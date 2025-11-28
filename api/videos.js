export default async function handler(req, res) {
  try {
    const response = await fetch('https://ok.newhqmovies.workers.dev', {
      headers: { 'User-Agent': 'Mozilla/5.0' }  // Cloudflare sometimes requires UA
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Upstream API error", status: response.status });
    }

    const text = await response.text();

    // Verify the API actually returned JSON
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Invalid JSON returned by upstream API",
        raw: text.slice(0, 200)
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server crashed", message: error.message });
  }
}
