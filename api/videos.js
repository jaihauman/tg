<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Reels</title>

<style>
  body {
    margin: 0;
    background: black;
    overflow: hidden;
  }

  .reel-container {
    height: 100vh;
    width: 100vw;
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
  }

  .reel {
    height: 100vh;
    width: 100vw;
    position: relative;
    scroll-snap-align: start;
    display: flex;
    justify-content: center;
    align-items: center;
    background: black;
  }

  video {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  /* Loading spinner */
  .spinner {
    position: absolute;
    width: 60px;
    height: 60px;
    border: 5px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

</style>
</head>
<body>

<div id="container" class="reel-container"></div>

<script>
const API_URL = "https://tg-psi-ecru.vercel.app/api/videos";
let videos = [];
let loadedCount = 0;

/* --------------------------------------------------------
   Fetch videos fast
--------------------------------------------------------- */
async function loadVideos() {
  const res = await fetch(API_URL);
  videos = await res.json();
  loadReel(); // load first video
}

/* --------------------------------------------------------
   Create a single reel
--------------------------------------------------------- */
function createReel(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "reel";

  const loader = document.createElement("div");
  loader.className = "spinner";

  const video = document.createElement("video");
  video.src = url;
  video.loop = true;
  video.muted = false;         // 🔥 unmuted by default
  video.playsInline = true;
  video.preload = "metadata";

  video.addEventListener("loadeddata", () => {
    loader.remove();
  });

  wrapper.appendChild(video);
  wrapper.appendChild(loader);

  return wrapper;
}

/* --------------------------------------------------------
   Load reels one-by-one as user scrolls
--------------------------------------------------------- */
function loadReel() {
  if (loadedCount >= videos.length) return;

  const url = videos[loadedCount].url;
  const reel = createReel(url);

  container.appendChild(reel);
  observeReel(reel);

  // Preload next video early
  if (videos[loadedCount + 1]) {
    const pre = document.createElement("video");
    pre.src = videos[loadedCount + 1].url;
    pre.preload = "auto";
  }

  loadedCount++;
}

/* --------------------------------------------------------
   Intersection Observer: Autoplay + Load More
--------------------------------------------------------- */
function observeReel(reel) {
  const video = reel.querySelector("video");

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(e => console.log(e));
        // Load next reel when this one appears
        if (reel === container.lastElementChild) {
          loadReel();
        }
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });

  obs.observe(reel);
}

loadVideos();
</script>

</body>
</html>
