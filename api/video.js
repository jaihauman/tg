const apiUrl = '/api/videos'; // your Vercel serverless endpoint

async function fetchVideos() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const videos = Array.isArray(data) ? data : [data];
    const container = document.getElementById('videoContainer');
    container.innerHTML = '';

    videos.forEach(video => {
      const card = document.createElement('div');
      card.classList.add('video-card');

      card.innerHTML = `
        <video controls preload="metadata">
          <source src="${video.url}" type="video/mp4">
          Your browser does not support HTML5 video.
        </video>
        <div class="video-info">
          <p><strong>Width:</strong> ${video.width}</p>
          <p><strong>Height:</strong> ${video.height}</p>
          <p><strong>Duration:</strong> ${video.duration}s</p>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching videos:', err);
    document.getElementById('videoContainer').innerHTML = '<p style="color:red;">Failed to load videos.</p>';
  }
}

// Fetch videos on page load
fetchVideos();
