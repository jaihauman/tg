// api/videos.js
// Edge runtime: proxies https://ok.newhqmovies.workers.dev and caches the JSON on Vercel Edge.

export const config = {
  runtime: "edge",
};

const UPSTREAM = "https://ok.newhqmovies.workers.dev";

export default async function handler(req) {
  try {
    const upstreamRes = await fetch(UPSTREAM, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FastReels/1.0)",
        "Accept": "application/json, text/plain, */*",
      },
      redirect: "follow",
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: "Upstream returned non-OK status",
          status: upstreamRes.status,
          rawPreview: text.slice(0, 500),
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON from upstream",
          rawPreview: text.slice(0, 500),
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return and cache at edge for 60s, stale-while-revalidate 300s
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Edge error", message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
