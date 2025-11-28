<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reels Viewer</title>

    <style>
        body {
            margin: 0;
            background: #000;
            overflow: hidden;
        }

        #reel-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            overflow: hidden;
        }

        video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 0;
            left: 0;
        }

        .loading {
            color: white;
            font-size: 24px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>

    <div id="reel-container">
        <div class="loading">Loading...</div>
    </div>

<script>
let videos = [];
let currentIndex = 0;
let isFetching = false;

async function fetchVideos() {
    try {
        let res = await fetch("/api/videos");

        let text = await res.text();

        try {
            videos = JSON.parse(text);
        } catch {
            console.error("Server returned non-JSON:", text);
            return;
        }

        loadVideo(0);

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

function loadVideo(index) {
    if (!videos.length) return;

    const container = document.getElementById("reel-container");
    container.innerHTML = "";

    let video = document.createElement("video");
    video.src = videos[index].url;
    video.autoplay = true;
    video.loop = true;
    video.muted = false;
    video.controls = false;
    video.playsInline = true;

    container.appendChild(video);

    preloadNext(index + 1);
}

function preloadNext(nextIndex) {
    if (!videos[nextIndex]) return;

    let v = document.createElement("video");
    v.src = videos[nextIndex].url;
    v.preload = "auto";
}

document.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
        nextReel();
    } else {
        prevReel();
    }
});

function nextReel() {
    if (currentIndex < videos.length - 1) {
        currentIndex++;
        loadVideo(currentIndex);
    }
}

function prevReel() {
    if (currentIndex > 0) {
        currentIndex--;
        loadVideo(currentIndex);
    }
}

fetchVideos();
</script>

</body>
</html>
