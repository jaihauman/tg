// api/video.js
export const config = {
  runtime: "edge",  // ⚡ run on Vercel Edge Network
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const fileUrl = url.searchParams.get("url");

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Fetch original video from Telegram (slow)
    const upstream = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (FastEdgeVideoCache)"
      }
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({
        error: "Failed to fetch upstream video",
        status: upstream.status
      }), { status: 502 });
    }

    // ⚡ FULL EDGE CACHE
    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, immutable"); 
    // cache for 24 hours

    return new Response(upstream.body, {
      status: upstream.status,
      headers
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Edge crash",
      message: err.message
    }), { status: 500 });
  }
}
