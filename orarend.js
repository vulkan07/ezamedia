let updateInterval;

let names = null;
let orarend = null;
const names_URL = "/orarend/names.json"
const orarend_URL = "/orarend/10E.json"

let selectedLesson = null;
let selectedGroup = {group:null, index:0};

function closeNotice() {
    localStorage.setItem("noticeClosed", "true");
    document.getElementById('notice-div').classList.add('hidden');
}

function closeDetails() {
    if (selectedLesson) {
        selectedLesson.classList.remove("selected");
        selectedLesson = null;
    }
    document.getElementById('lesson-details-div').classList.add('closed');
}

function translate(type, acronym) {
    if (names && names[type] && names[type][acronym]) return names[type][acronym];
    return acronym;
}

function fail(reason) {
    document.getElementById('statusmsg').classList.remove('hidden');
    document.getElementById('errormsg').classList.remove('hidden');
    document.getElementById('statusmsg').innerText = "Nem sikerült betölteni";
    document.getElementById('errormsg').innerText = "(" + reason + ")";

    document.getElementById('spinner').classList.add('hidden');
}

function fetchData() {
    fetch(names_URL)
        .then(response => {
            if (!response.ok) {
                fail("Nem sikerült betölteni");
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(json => {
            names = json;
        })

    fetch(orarend_URL)
        .then(response => {
            if (!response.ok) {
                fail("Nem sikerült betölteni");
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(json => {
            orarend = json;

            renderPhoneOrarend();

            const date = new Date();
            setTimeout(renderPhoneOrarend, (61-date.getSeconds())*1000);

            updateInterval = setInterval(() => {
                const date = new Date();
                setTimeout(renderPhoneOrarend, (61-date.getSeconds())*1000);
            }, 60000); // update every min

        })
        .catch(error => {
            fail(error);
            //this.dataError = true; //Idk whats this
        })
}

function updateDetailsDiv(srcdiv,lessonData,period,today) {
    if (srcdiv === selectedLesson) {
        closeDetails();
        return;
    }
    if (selectedLesson) selectedLesson.classList.remove("selected");
    selectedLesson = srcdiv;
    srcdiv.classList.add("selected");
    let div = document.getElementById('lesson-details-div');
    div.classList.remove('closed');
    div.querySelector("#details-day").innerText = today.charAt(0).toUpperCase() + today.slice(1);
    div.querySelector("#details-period").innerText = period + ". óra";
    div.querySelector("#details-group").innerText = translate("groups", lessonData.group);
    div.querySelector("#details-teacher").innerText = translate("teachers", lessonData.teacher);
    div.querySelector("#details-room").innerText = lessonData.room;
    if (lessonData.lunch) 
        div.querySelector("#details-lunch").classList.remove("hidden");
    else
        div.querySelector("#details-lunch").classList.add("hidden");

    if (lessonData.double) 
        div.querySelector("#details-double").classList.remove("hidden");
    else
        div.querySelector("#details-double").classList.add("hidden");
}

function onGroupSelect() {
    selectedGroup.group = document.getElementById("groupselector").value;
    selectedGroup.index = document.getElementById("groupselector").selectedIndex;
    renderPhoneOrarend();
}

function renderPhoneOrarend() {
//    closeDetails(); // re-rendering means the previous selection is lost because its deleted, this isnt good but im too lazy to fix

    document.getElementById("day-div").innerHTML = ""; // clear old render

    // Get today
    const date = new Date();
    const today = ["hétfő", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "hétfő"][date.getDay()+0]; //szo és vas -> hétfő (0 = vas FASZOM)

    /// Set Day title
    let dayTitle = document.querySelector("template").content.querySelector("#day-title").cloneNode();
    document.getElementById("day-div").appendChild(dayTitle);
    dayTitle.innerText = today.charAt(0).toUpperCase() + today.slice(1);

    // Group Selector
    let selector = document.querySelector("template").content.querySelector("#groupselector").cloneNode(true);
    selector.value = selectedGroup.group; // sketchy af
    selector.selectedIndex = selectedGroup.index;
    document.getElementById("day-div").appendChild(selector);


    const lessonTemplate = document.querySelector("template").content.querySelector(".lesson");
    const dayDiv = document.getElementById("day-div");

    // Calculate lesson to be highlighted
    let current = date.getHours()-7; //-7

    for (let i = 0; i < 9; i++) {
        let periodDiv = document.createElement("div");
        let lessonsDiv = document.createElement("div");
        let periodnum = document.createElement("div");
        periodDiv.className = "period";
        lessonsDiv.className = "lessons-div";
        periodnum.className = "period-num";
        document.getElementById("day-div").appendChild(periodDiv);
        periodnum.innerText = i;
        periodDiv.appendChild(periodnum);
        periodDiv.appendChild(lessonsDiv);
        dayDiv.appendChild(periodDiv);

        const lessons = orarend[today][i];
        let content;

        // Hide periods without lessons (usually 0th or 8th)
        if (lessons.length === 0) {
            periodDiv.classList.add("hidden");
            continue;
        }

        if (lessons.length > 2)
            lessonsDiv.classList.add("tabbed");

        // Note: this is bad, ideally the period should contain the lunch field, not the lessons, since groups share lunch
        if (lessons[0]["lunch"]) {
            const lunchbar = document.querySelector("template").content.querySelector(".lunchbar");
            dayDiv.appendChild(lunchbar.cloneNode(true));
        }

        filter = false;
        if (selectedGroup !== null) {
            for (let j = 0; j < lessons.length; j++)
                filter |= lessons[j].group === selectedGroup.group;
        }

        for (let j = 0; j < lessons.length; j++) {
            if (filter && lessons[j].group !== selectedGroup.group) {
                continue;
            }
            content = lessonTemplate.cloneNode(true);
            content.addEventListener("click", e => updateDetailsDiv(lessonsDiv.querySelectorAll(".lesson")[j], lessons[j], i, today));
            lessonsDiv.appendChild(content);

            if (lessons.length > 2)
                content.classList.add("inline");

            if (current > i)
                content.classList.add("happened");

            // Ha kicsongettek, a következő óra "next", a jelenlegi "happened" stílust kap
            if (date.getMinutes() >= 45) {
                if (current === i-1)
                    content.classList.add("current");
                if (current === i)
                    content.classList.add("happened");
            } else if (current === i) {
                content.classList.add("current"); // Óra alatt
            }

            if (i > 3)
                window.scrollTo(0, 160*(i-4) ); // scroll down after a bit

            content.querySelector(".field-targy").innerText = translate("subjects", lessons[j].subject);
            content.querySelector(".field-tanar").innerText = lessons[j].teacher;
            content.querySelector(".field-terem").innerText = lessons[j].room;

            if (selectedLesson && selectedLesson.innerHTML === content.innerHTML) { // sketchy af way to remember selected lesson, causes bug on double (identical) lessons
                content.classList.add("selected");
            }
        }
    }

    console.log("Orarend rendered");
    document.getElementById("spinner").classList.add("hidden");
}

function init() {
    if (localStorage.getItem("noticeClosed")) closeNotice();
    fetchData();
}

//window.onload = init();
document.addEventListener("DOMContentLoaded", () => init());

