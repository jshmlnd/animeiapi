/**
 * animeiAPI – data provider helpers
 * =====================================================================
 * Miruro does not expose scrapeable HTML (SPA + Cloudflare). Instead it is a
 * frontend over two JSON APIs:
 *
 *   1. AniList GraphQL        → metadata (search, trending, info, episodes)
 *      https://graphql.anilist.co
 *
 *   2. Miruro "secure pipe"   → streaming sources (M3U8 / HLS)
 *      https://www.miruro.tv/api/secure/pipe
 *      (behind Cloudflare → requires TLS impersonation + same-origin headers)
 *
 * This module provides:
 *   - fetchJson   : generic GET/POST JSON fetch (axios)
 *   - anilist     : GraphQL query helper
 *   - mirrorPipe  : encrypted pipe request (episodes / sources)
 *   - scrape      : router used by server.js per endpoint
 * =====================================================================
 */
const axios = require('axios');
const zlib = require('zlib');

// ── HTTP client ───────────────────────────────────────────────────────
const http = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  },
  validateStatus: () => true,
});

async function fetchJson(url, { method = 'GET', headers = {}, data, params } = {}) {
  const res = await http.request({
    method,
    url,
    headers: { ...http.defaults.headers, ...headers },
    data,
    params,
  });
  if (res.status >= 400) {
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    err.body = typeof res.data === 'string' ? res.data.slice(0, 500) : res.data;
    throw err;
  }
  return res.data;
}

// ── AniList GraphQL ───────────────────────────────────────────────────
const ANILIST_URL = 'https://graphql.anilist.co';

async function anilist(query, variables = {}) {
  const body = await fetchJson(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://anilist.co' },
    data: { query, variables },
  });
  if (body.errors && body.errors.length) {
    const err = new Error(body.errors.map((e) => e.message).join('; '));
    err.status = (body.errors[0] && body.errors[0].status) || 502;
    throw err;
  }
  return body.data;
}

// ── Miruro secure pipe ────────────────────────────────────────────────
// Requests are base64-encoded JSON; responses are base64(gzip(json)).
function encodePipeRequest(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePipeResponse(encoded) {
  const compressed = Buffer.from(encoded.trim(), 'base64url');
  const json = zlib.gunzipSync(compressed).toString('utf8');
  return JSON.parse(json);
}

const PIPE_HEADERS = {
  Referer: 'https://www.miruro.tv/',
  Origin: 'https://www.miruro.tv',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

async function mirrorPipe(base, payload) {
  // base may include a path, e.g. https://www.miruro.tv
  const pipeUrl = `${base}/api/secure/pipe`;
  const e = encodePipeRequest(payload);
  const res = await http.get(pipeUrl, {
    params: { e },
    headers: { ...http.defaults.headers, ...PIPE_HEADERS },
  });
  if (res.status >= 400) {
    const err = new Error(`HTTP ${res.status} from secure pipe (Cloudflare?)`);
    err.status = res.status;
    err.isBlocked = true;
    throw err;
  }
  return decodePipeResponse(res.data);
}

// ── FlareSolverr (Cloudflare bypass) ──────────────────────────────────
// Talks to a FlareSolverr instance (POST /v1) which uses a real browser to
// solve Cloudflare challenges and returns the rendered response body.
async function pipeViaFlareSolverr(base, payload, session) {
  const fsUrl = (process.env.FLARESOLVERR_URL || 'http://localhost:8191')
    .replace(/\/+$/, '');
  const pipeUrl = `${base}/api/secure/pipe?e=${encodePipeRequest(payload)}`;

  const body = await fetchJson(`${fsUrl}/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      cmd: 'request.get',
      url: pipeUrl,
      maxTimeout: Number(process.env.FLARESOLVERR_TIMEOUT || 60000),
      ...(session ? { session } : {}),
    },
  });

  if (body.status !== 'ok' || !body.solution) {
    const msg = body.message || 'no solution';
    const err = new Error(`FlareSolverr: ${msg}`);
    err.status = 502;
    // challenge/ban failures are worth retrying on the next mirror;
    // transport errors (FS down/timeout) are not.
    if (/block|challenge|banned|captcha|forbidden/i.test(msg)) err.isBlocked = true;
    throw err;
  }

  const status = body.solution.status;
  if (status && status >= 400) {
    const err = new Error(`FlareSolverr: upstream HTTP ${status}`);
    err.status = status;
    err.isBlocked = true;
    throw err;
  }

  return decodePipeResponse(body.solution.response);
}

// Pipe dispatch: try direct, then fall back to FlareSolverr if available.
async function pipe(base, payload, { session } = {}) {
  if (process.env.FLARESOLVERR_ALWAYS === '1') {
    return pipeViaFlareSolverr(base, payload, session);
  }
  try {
    return await mirrorPipe(base, payload);
  } catch (err) {
    if (err.isBlocked && process.env.FLARESOLVERR_URL) {
      console.warn('[scraper] direct pipe blocked — retrying via FlareSolverr');
      return pipeViaFlareSolverr(base, payload, session);
    }
    throw err;
  }
}

// Cross-mirror fallback: try each base in order, moving on when the
// failure looks like a per-domain Cloudflare block. Non-block errors
// (bad payload, FS down) throw immediately.
async function pipeFirstWorking(bases, payload, opts = {}) {
  let lastErr = null;
  for (const base of bases) {
    try {
      return await pipe(base, payload, opts);
    } catch (err) {
      if (!err.isBlocked) throw err;
      console.warn(`[scraper] pipe blocked on ${base} — trying next mirror`);
      lastErr = err;
    }
  }
  throw lastErr || new Error('pipe: no mirrors configured');
}

// ── Router used by server.js ──────────────────────────────────────────
// Each endpoint declares `kind`:
//   'anilist'   → anilist(query, variables)          (metadata)
//   'pipe'      → mirrorPipe(base, payload)           (streaming)
//   'json'      → fetchJson(url)                       (direct JSON API)
async function scrape(opts) {
  if (!opts?.url) throw new Error('scrape: opts.url required');

  if (opts.kind === 'pipe') {
    const base = opts.base || opts.url.replace(/\/+$/, '');
    const payload = await opts.buildPayload(opts, opts.url);
    return pipe(base, payload);
  }

  if (opts.kind === 'anilist') {
    const { query, variables } = opts.buildQuery(opts);
    return anilist(query, variables);
  }

  // default: plain JSON GET
  return fetchJson(opts.url, { headers: opts.headers });
}

// ── HLS proxy helper (m3u8 playlist rewrite + segment passthrough) ───
function b64EncodeUrl(str) {
  return Buffer.from(str).toString('base64url');
}

function b64DecodeUrl(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function rewriteM3u8(text, baseUrl, proxyBase) {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        if (trimmed.includes('://') && !trimmed.startsWith('#EXTM3U')) {
          try {
            const abs = new URL(trimmed, baseUrl).toString();
            return line.replace(trimmed, `${proxyBase}${b64EncodeUrl(abs)}`);
          } catch {
            return line;
          }
        }
        return line;
      }
      try {
        const abs = new URL(trimmed, baseUrl).toString();
        return `${proxyBase}${b64EncodeUrl(abs)}`;
      } catch {
        return line;
      }
    })
    .join('\n');
}

async function proxyHls(urlStr, { refererBase, selfUrl } = {}) {
  let target;
  try {
    target = new URL(urlStr);
  } catch {
    const err = new Error('invalid hls url');
    err.status = 400;
    throw err;
  }

  const referer = (refererBase || 'https://www.miruro.tv').replace(/\/+$/, '');

  const res = await http.get(target.toString(), {
    headers: {
      ...http.defaults.headers,
      Referer: `${referer}/`,
      Origin: referer,
    },
    responseType: 'arraybuffer',
  });

  if (res.status >= 400) {
    const err = new Error(`upstream HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const contentType = (res.headers['content-type'] || '').split(';')[0];
  const buf = Buffer.from(res.data);
  const isPlaylist =
    contentType.includes('mpegurl') ||
    contentType.includes('vnd.apple') ||
    target.pathname.endsWith('.m3u8');

  if (isPlaylist) {
    const text = buf.toString('utf8');
    // proxyBase points at THIS server, so segments route back through /hls/*.
    const proxyBase = `${(selfUrl || referer).replace(/\/+$/, '')}/hls/`;
    return { body: rewriteM3u8(text, target.toString(), proxyBase), contentType: 'application/vnd.apple.mpegurl' };
  }

  return { body: buf, contentType: contentType || 'application/octet-stream' };
}

module.exports = {
  http,
  fetchJson,
  anilist,
  mirrorPipe,
  pipe,
  pipeFirstWorking,
  pipeViaFlareSolverr,
  encodePipeRequest,
  decodePipeResponse,
  b64EncodeUrl,
  b64DecodeUrl,
  rewriteM3u8,
  proxyHls,
  scrape,
};
