function closeNotice() {
    localStorage.setItem("noticeClosed", "true");
    document.getElementById('notice-div').classList.add('hidden');
}

var updateInterval;

let names = null;
let orarend = null;
const names_URL = "/orarend/names.json"
const orarend_URL = "/orarend/10E.json"

function fail(reason) {
    document.getElementById('statusmsg').classList.remove('hidden');
    document.getElementById('statusmsg').innerText = reason;
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
        .catch(function () {
            fail("Nem sikerült betölteni");
            this.dataError = true;
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
            // sketchy af method to update render when new minute (+100ms)
            const date = new Date();
            setTimeout( () => {
                console.log("Bound update interval to minute");
                updateInterval = setInterval(() => renderPhoneOrarend(), 60000); // update every min
            }, (60-date.getSeconds())*1000+100);
        })
        /*.catch(function () {
            fail("Nem sikerült betölteni");
            this.dataError = true;
        })*/
}



function renderPhoneOrarend() {
    console.log("Orarend rendered");
    document.getElementById("day-div").innerHTML = ""; // clear old render

    // Get Day
    const date = new Date();
    const today = ["hétfő", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "hétfő"][date.getDay()+5]; //szo és vas -> hétfő (0 = vas FASZOM)


    /// Set Day title
    let dayTitle = document.querySelector("template").content.querySelector("#day-title").cloneNode();
    document.getElementById("day-div").appendChild(dayTitle);
    dayTitle.innerText = today.charAt(0).toUpperCase() + today.slice(1);


    const lessonTemplate = document.querySelector("template").content.querySelector(".lesson");

    let current = date.getHours()-8;
    if (date.getMinutes() > 45) current++; // ha kicsongettek, kovi orat mutatja

    for (let i = 0; i < 9; i++) {
        let periodDiv = document.createElement("div");
        let lessonsDiv = document.createElement("div");
        periodDiv.className = "period";
        lessonsDiv.className = "lessons-div";
        document.getElementById("day-div").appendChild(periodDiv);
        periodDiv.appendChild(lessonsDiv);

        lessons = orarend[today][i];
        let content;

        if (lessons.length > 2)
            lessonsDiv.classList.add("tabbed");

        for (let j = 0; j < lessons.length; j++) {
            content = lessonTemplate.cloneNode(true);
            lessonsDiv.appendChild(content);

            if (current === i) {
                content.classList.add("current");
                periodDiv.classList.add("current");
            }
            if (current > i) {
                content.classList.add("happened");
            }

            if (names) { // translate acronyms to real names
                content.querySelector(".field-targy").innerText = names["subjects"][lessons[j].subject];
            } else {
                content.querySelector(".field-targy").innerText = lessons[j].subject;
                console.log("translation failed");
            }
            content.querySelector(".field-tanar").innerText = lessons[j].teacher;
            content.querySelector(".field-terem").innerText = lessons[j].room;
        }
    }

    document.getElementById("spinner").classList.add("hidden");
}

function init() {
    if (localStorage.getItem("noticeClosed")) closeNotice();
    fetchData();
}

//window.onload = init();
document.addEventListener("DOMContentLoaded", () => init());
