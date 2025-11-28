// api/video.js
// Edge runtime: proxies video files (telegram or other) to Vercel Edge with caching.
// Supports Range requests (seek) and sets long s-maxage caching for files.

export const config = {
  runtime: "edge",
};

function headerValue(h, defaultVal = "") {
  try {
    return h ? h : defaultVal;
  } catch {
    return defaultVal;
  }
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("url");
    if (!raw) {
      return new Response(JSON.stringify({ error: "Missing 'url' param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate/allow only http(s) urls
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      return new Response(JSON.stringify({ error: "Invalid 'url' param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward Range header if present (very important for seeking)
    const range = req.headers.get("range") || undefined;

    const upstreamHeaders = {
      "User-Agent": "Mozilla/5.0 (FastEdgeVideoCache)",
      "Accept": "*/*",
      // forward Range if present
      ...(range ? { Range: range } : {}),
    };

    // Fetch upstream (this will be cached at edge by s-maxage header below)
    const upstreamRes = await fetch(raw, {
      method: "GET",
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      // return helpful error JSON
      const text = await upstreamRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: "Upstream fetch failed",
          status: upstreamRes.status,
          rawPreview: text.slice(0, 500),
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build response headers: copy some from upstream, and set Edge cache
    const resHeaders = new Headers();

    // Content-Type
    const contentType = headerValue(upstreamRes.headers.get("content-type"), "video/mp4");
    resHeaders.set("Content-Type", contentType);

    // Content-Length / Accept-Ranges / Content-Range forwarded if present
    const acceptRanges = upstreamRes.headers.get("accept-ranges");
    if (acceptRanges) resHeaders.set("Accept-Ranges", acceptRanges);

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) resHeaders.set("Content-Range", contentRange);

    const cl = upstreamRes.headers.get("content-length");
    if (cl) resHeaders.set("Content-Length", cl);

    // Vercel Edge cache control: cache video files for 1 day (adjust as needed)
    resHeaders.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    // Allow CORS from your frontend domain(s) if needed
    resHeaders.set("Access-Control-Allow-Origin", "*");

    // Stream upstream body through
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Edge error", message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
