<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reels Style Video Feed</title>

  <style>
    body {
      margin: 0;
      background: #000;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    .reels-container {
      height: 100vh;
      width: 100vw;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
    }

    .reel {
      height: 100vh;
      width: 100%;
      scroll-snap-align: start;
      position: relative;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    video {
      height: 100%;
      width: auto;
      object-fit: cover;
    }

    .loading {
      color: white;
      position: absolute;
      bottom: 20px;
      text-align: center;
      width: 100%;
      font-size: 18px;
    }
  </style>
</head>
<body>

  <div class="reels-container" id="reels"></div>

  <script>
    const apiUrl = '/api/videos';
    let videoList = [];
    let loadedCount = 0;

    async function loadVideos() {
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        videoList = Array.isArray(data) ? data : [data];

        createReels();
      } catch (e) {
        console.error("API error:", e);
      }
    }

    function createReels() {
      const container = document.getElementById("reels");

      videoList.forEach((vid, index) => {
        const reel = document.createElement("div");
        reel.className = "reel";

        reel.innerHTML = `
          <video 
            data-index="${index}"
            playsinline 
            webkit-playsinline 
            muted 
            preload="none"
          >
            <source src="${vid.url}" type="video/mp4">
          </video>
          <div class="loading">Loading...</div>
        `;

        container.appendChild(reel);
      });

      setupAutoPlay();
    }

    function setupAutoPlay() {
      const videos = document.querySelectorAll("video");

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const loadingText = video.parentElement.querySelector(".loading");

          if (entry.isIntersecting) {
            if (video.readyState === 0) {
              video.addEventListener("loadeddata", () => {
                loadingText.style.display = "none";
              });
            }

            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      }, { threshold: 0.75 });

      videos.forEach((v) => observer.observe(v));
    }

    loadVideos();
  </script>

</body>
</html>
