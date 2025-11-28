// api/videos.js
// Vercel Edge-Cached API Proxy (FAST)

export const config = {
  runtime: "edge", // 💨 RUN ON VERCEL EDGE (FAST)
};

const UPSTREAM = "https://ok.newhqmovies.workers.dev";

export default async function handler(req) {
  try {
    const response = await fetch(UPSTREAM, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FastReels/1.0)",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({
          error: "Upstream error",
          status: response.status,
          raw: text.slice(0, 300)
        }),
        { status: 502 }
      );
    }

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON from upstream",
          raw: text.slice(0, 300)
        }),
        { status: 500 }
      );
    }

    // 🚀 EDGE CACHE FOR 1 MINUTE + serve stale while refreshing
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server crashed", message: err.message }),
      { status: 500 }
    );
  }
}
