// api/videos.js
// Vercel serverless function to proxy https://ok.newhqmovies.workers.dev
// - Uses global fetch (no node-fetch)
// - Adds timeout, retries, headers, and helpful error JSON

const UPSTREAM = 'https://ok.newhqmovies.workers.dev';
const FETCH_TIMEOUT_MS = 7000;
const RETRIES = 2; // number of extra attempts (total attempts = RETRIES + 1)
const RAW_PREVIEW_LEN = 800; // how much raw text to include in error responses

function timeoutFetch(resource, options = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function fetchWithRetries(url, opts = {}, attempts = RETRIES + 1) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await timeoutFetch(url, opts);
      return res;
    } catch (err) {
      lastErr = err;
      // small backoff
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  // Allow CORS from your front-end for local testing if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const fetchOptions = {
      method: 'GET',
      headers: {
        // Cloudflare / Workers sometimes block non-browser user-agents
        'User-Agent': 'Mozilla/5.0 (compatible; MyReels/1.0)',
        'Accept': 'application/json, text/plain, */*',
        // Add any other headers if needed (Referer, Authorization) - but only if required
      },
      // don't follow infinite redirects
      redirect: 'follow',
    };

    const upstreamRes = await fetchWithRetries(UPSTREAM, fetchOptions);

    // If upstream responds non-OK, return a helpful JSON error
    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => '');
      return res.status(502).json({
        error: 'Upstream returned non-OK status',
        upstreamStatus: upstreamRes.status,
        upstreamStatusText: upstreamRes.statusText,
        rawPreview: text ? text.slice(0, RAW_PREVIEW_LEN) : '',
      });
    }

    // Read body as text first so we can safely diagnose non-JSON
    const bodyText = await upstreamRes.text();

    // Try to parse JSON
    try {
      const data = JSON.parse(bodyText);

      // Set caching headers for Vercel edge / CDN
      // s-maxage controls server (Vercel) caching. Adjust as needed.
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

      return res.status(200).json(data);
    } catch (parseErr) {
      // Upstream returned something that's not valid JSON (HTML error page, etc.)
      return res.status(502).json({
        error: 'Invalid JSON returned by upstream API',
        message: parseErr.message,
        rawPreview: bodyText.slice(0, RAW_PREVIEW_LEN),
        note: 'If this is HTML, the upstream is returning an HTML error page (Cloudflare/Worker). Try adding required headers or verify upstream.',
      });
    }
  } catch (err) {
    // Network/timeout/retry failure
    console.error('Proxy error:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: 'Server proxy error',
      message: err && err.message ? err.message : String(err),
      hint: 'This typically means the server could not reach the upstream URL (timeout, DNS, or blocked).',
    });
  }
}
