function closeNotice() {
    localStorage.setItem("noticeClosed", "true");
    document.getElementById('notice-div').classList.add('hidden');
}

function closeDetails() {
    document.getElementById('lesson-details-div').classList.toggle('closed');
}

let updateInterval;

let names = null;
let orarend = null;
const names_URL = "/orarend/names.json"
const orarend_URL = "/orarend/10E.json"

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



function renderPhoneOrarend() {
    document.getElementById("day-div").innerHTML = ""; // clear old render

    // Get today
    const date = new Date();
    const today = ["hétfő", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "hétfő"][date.getDay()+0]; //szo és vas -> hétfő (0 = vas FASZOM)

    /// Set Day title
    let dayTitle = document.querySelector("template").content.querySelector("#day-title").cloneNode();
    document.getElementById("day-div").appendChild(dayTitle);
    dayTitle.innerText = today.charAt(0).toUpperCase() + today.slice(1);


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


        for (let j = 0; j < lessons.length; j++) {
            content = lessonTemplate.cloneNode(true);
            lessonsDiv.appendChild(content);

            if (lessons.length > 2)
                content.classList.add("inline");

            if (current > i)
                content.classList.add("happened");
            // Ha kicsongettek, a következő óra "next", a jelenlegi "happened" stílust kap
            if (date.getMinutes() >= 45) {
                if (current === i-1)
                    content.classList.add("next");
                if (current === i)
                    content.classList.add("happened");
            } else if (current === i) {
                content.classList.add("current"); // Óra alatt
            }

            if (names) { // translate acronyms to real names
                content.querySelector(".field-targy").innerText = names["subjects"][lessons[j].subject];
            } else {
                content.querySelector(".field-targy").innerText = lessons[j].subject;
               // console.log("translation failed");
            }
            content.querySelector(".field-tanar").innerText = lessons[j].teacher;
            content.querySelector(".field-terem").innerText = lessons[j].room;
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

