// Only for index.html, see main.js
function playVideo() {
    const button = document.getElementById('video-btn');
    const video = document.getElementById('video');
    button.classList.add('hidden');
    video.classList.remove('hidden');
    video.volume = 0.4;
    video.play();

    document.getElementById('video').addEventListener('ended',() => {
        document.querySelector('.btn').classList.remove("hidden");
        document.getElementById('video').classList.add("hidden");
    },false);
}
