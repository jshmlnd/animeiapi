/**
 * animeiAPI – Cloudflare Worker
 * =====================================================================
 * Metadata  → AniList GraphQL (https://graphql.anilist.co) [works from CF]
 * Streaming → Miruro secure pipe, via FlareSolverr (Cloudflare bypass)
 * HLS       → /hls/* proxies m3u8 playlists + segments (referer fix)
 *
 * Bindings (wrangler.jsonc):
 *   - KV namespace "CACHE"  (optional caching, TTL 300s default)
 *   - secret FLARESOLVERR_URL, FLARESOLVERR_TIMEOUT, SOURCE_URL
 *
 * Endpoints:
 *   GET /search?q=&page=&perPage=
 *   GET /trending | /popular | /recent
 *   GET /info/:id
 *   GET /episodes/:id
 *   GET /watch/:provider/:anilistId/:category/:slug
 *   GET /hls/:encodedUrl   (m3u8 playlist/segment proxy)
 *   GET /health
 */

const ANILIST_URL = 'https://graphql.anilist.co';

const MIRRORS = [
  'https://www.miruro.tv',
  'https://www.miruro.ru',
  'https://www.miruro.bz',
  'https://www.miruro.to',
];

const MEDIA_LIST_FIELDS = `
  id
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  format
  season
  seasonYear
  episodes
  duration
  status
  averageScore
  meanScore
  popularity
  favourites
  genres
  isAdult
`;

const CACHE_TTL = 300;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function errorJson(message, status, details) {
  return json({ success: false, error: message, ...(details ? { details } : {}) }, status);
}

// ── helpers ───────────────────────────────────────────────────────────
function b64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64EncodeUrl(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64DecodeUrl(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

async function gunzip(buf) {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

// ── cache ─────────────────────────────────────────────────────────────
async function cacheGet(env, key) {
  if (!env.CACHE) return null;
  try {
    return await env.CACHE.get(key, 'json');
  } catch {
    return null;
  }
}

async function cachePut(env, key, value, ttl = CACHE_TTL) {
  if (!env.CACHE) return;
  try {
    await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch {
    /* cache is best-effort */
  }
}

// ── AniList ───────────────────────────────────────────────────────────
async function anilist(query, variables) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://anilist.co' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors && body.errors.length) {
    const err = new Error(body.errors.map((e) => e.message).join('; '));
    err.status = (body.errors[0] && body.errors[0].status) || 502;
    throw err;
  }
  return body.data;
}

// ── Miruro pipe (via FlareSolverr) ────────────────────────────────────
function encodePipeRequest(payload) {
  return b64urlEncode(JSON.stringify(payload));
}

async function decodePipeResponse(encoded) {
  const buf = b64urlDecode(encoded.trim());
  const raw = await gunzip(buf);
  return JSON.parse(new TextDecoder().decode(raw));
}

async function pipeViaFlareSolverr(env, base, payload) {
  if (!env.FLARESOLVERR_URL) {
    const err = new Error('FLARESOLVERR_URL is not set (streaming requires a FlareSolverr instance)');
    err.status = 502;
    throw err;
  }
  const fsUrl = env.FLARESOLVERR_URL.replace(/\/+$/, '');
  const pipeUrl = `${base}/api/secure/pipe?e=${encodePipeRequest(payload)}`;

  const res = await fetch(`${fsUrl}/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmd: 'request.get',
      url: pipeUrl,
      maxTimeout: Number(env.FLARESOLVERR_TIMEOUT || 60000),
    }),
  });
  const body = await res.json();

  if (body.status !== 'ok' || !body.solution) {
    const msg = body.message || 'no solution';
    const err = new Error(`FlareSolverr: ${msg}`);
    err.status = 502;
    if (/block|challenge|banned|captcha|forbidden/i.test(msg)) err.isBlocked = true;
    throw err;
  }
  const status = body.solution.status;
  if (status && status >= 400) {
    const err = new Error(`FlareSolverr: upstream HTTP ${status}`);
    err.status = status;
    throw err;
  }
  return decodePipeResponse(body.solution.response);
}

// Cross-mirror fallback: try each base in order, moving on when the
// failure looks like a per-domain Cloudflare block.
async function pipeFirstWorking(env, bases, payload) {
  let lastErr = null;
  for (const base of bases) {
    try {
      return await pipeViaFlareSolverr(env, base, payload);
    } catch (err) {
      if (!err.isBlocked) throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error('pipe: no mirrors configured');
}

// ── HLS proxy ─────────────────────────────────────────────────────────
// Miruro's M3U8 playlists/segments often check the Referer header. This
// proxy fetches them server-side with the correct Referer and rewrites
// relative segment/sub-playlist URLs so they route back through /hls/*.
function rewriteM3u8(text, baseUrl, proxyBase) {
  const lines = text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // rewrite any absolute URI references inside EXT-X tags (e.g. keys)
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
    // segment lines: resolve relative → absolute, then proxy-wrap
    try {
      const abs = new URL(trimmed, baseUrl).toString();
      return `${proxyBase}${b64EncodeUrl(abs)}`;
    } catch {
      return line;
    }
  });
  return lines.join('\n');
}

async function proxyHls(urlStr, env, selfUrl) {
  let target;
  try {
    target = new URL(urlStr);
  } catch {
    const err = new Error('invalid hls url');
    err.status = 400;
    throw err;
  }

  // Referer sent to the HLS host (their own origin, so they don't reject).
  const refererBase = env.HLS_REFERER ? env.HLS_REFERER.replace(/\/+$/, '') : MIRRORS[0];

  const res = await fetch(target.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: `${refererBase}/`,
      Origin: refererBase,
    },
  });

  if (res.status >= 400) {
    const err = new Error(`upstream HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  const body = await res.arrayBuffer();

  const headers = {
    'content-type': contentType,
    'cache-control': 'public, max-age=3600',
    'access-control-allow-origin': '*',
  };

  const isPlaylist =
    contentType.includes('mpegurl') ||
    contentType.includes('vnd.apple') ||
    target.pathname.endsWith('.m3u8');

  if (isPlaylist) {
    // proxyBase points at THIS worker, so segments route back through /hls/*.
    const proxyBase = `${(env.HLS_ORIGIN || selfUrl || 'https://example.com').replace(/\/+$/, '')}/hls/`;
    const text = new TextDecoder().decode(body);
    const rewritten = rewriteM3u8(text, target.toString(), proxyBase);
    return new Response(rewritten, { status: 200, headers });
  }

  return new Response(body, { status: 200, headers });
}

// ── handlers ──────────────────────────────────────────────────────────
const handlers = {
  async search({ q, page, perPage }) {
    if (!q) return errorOnly('search requires ?q=', 400);
    const data = await anilist(
      `query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { search: q, page: page || 1, perPage: Math.min(perPage || 20, 50) },
    );
    const p = data.Page;
    return { page: p.pageInfo.currentPage, perPage: p.pageInfo.perPage, total: p.pageInfo.total, hasNextPage: p.pageInfo.hasNextPage, results: p.media };
  },

  async trending({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) },
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },

  async popular({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, sort: [POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) },
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },

  async recent({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, status: RELEASING, sort: [START_DATE_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) },
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },

  async info({ id }) {
    if (!id) return errorOnly('info requires /info/:id', 400);
    const data = await anilist(
      `query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge color }
          bannerImage
          format season seasonYear episodes duration status
          averageScore meanScore popularity favourites trending
          genres synonyms siteUrl
          trailer { id site thumbnail }
          studios { nodes { id name isAnimationStudio siteUrl } }
          nextAiringEpisode { episode airingAt timeUntilAiring }
          startDate { year month day } endDate { year month day }
        }
      }`,
      { id: Number(id) },
    );
    if (!data.Media) return errorOnly(`anime ${id} not found`, 404);
    return data.Media;
  },

  async episodes({ id }, env, bases) {
    if (!id) return errorOnly('episodes requires /episodes/:id', 400);
    return pipeFirstWorking(env, bases, {
      path: 'episodes',
      method: 'GET',
      query: { anilistId: Number(id) },
      body: null,
      version: '0.1.0',
    });
  },

  async watch({ provider, anilistId, category, slug }, env, bases) {
    if (!provider || !anilistId || !category || !slug) {
      return errorOnly('watch requires /watch/:provider/:anilistId/:category/:slug', 400);
    }
    const epData = await pipeFirstWorking(env, bases, {
      path: 'episodes',
      method: 'GET',
      query: { anilistId: Number(anilistId) },
      body: null,
      version: '0.1.0',
    });
    const prov = ((epData.providers || {})[provider] || {});
    const list = ((prov.episodes || {})[category] || []);
    const target = list.find((ep) => {
      const origId = String(ep.id || '');
      const prefix = origId.includes(':') ? origId.split(':')[0] : origId;
      return `${prefix}-${ep.number}` === slug;
    });
    if (!target) return errorOnly(`slug '${slug}' not found for ${provider}/${category}`, 404);
    return pipeFirstWorking(env, bases, {
      path: 'sources',
      method: 'GET',
      query: { episodeId: b64urlEncode(String(target.id)), provider, category, anilistId: Number(anilistId) },
      body: null,
      version: '0.1.0',
    });
  },
};

function errorOnly(message, status) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

// ── router ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    const mirrorIdx = Math.floor(Date.now() / 1000) % MIRRORS.length;
    const configured = env.SOURCE_URL
      ? env.SOURCE_URL.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean)
      : [...MIRRORS];
    const first = configured[mirrorIdx % configured.length];
    const bases = [first, ...configured.filter((u) => u !== first)];

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    // ── HLS proxy (handled before JSON router) ─────────────────────────
    const hlsMatch = path.match(/^\/hls\/(.+)$/);
    if (hlsMatch) {
      try {
        const targetUrl = b64DecodeUrl(hlsMatch[1]);
        const selfUrl = `${url.protocol}//${url.host}`;
        return await proxyHls(targetUrl, env, selfUrl);
      } catch (err) {
        const status = err.status && err.status < 500 ? err.status : 502;
        return json({ success: false, error: 'HLS proxy failed', details: err.message }, status, corsHeaders);
      }
    }

    try {
      const q = Object.fromEntries(url.searchParams.entries());
      const cacheKey = `json:${path}?${url.searchParams.toString()}`;

      const routes = [
        { re: /^\/search$/, fn: () => handlers.search(q), ttl: CACHE_TTL },
        { re: /^\/trending$/, fn: () => handlers.trending(q), ttl: CACHE_TTL },
        { re: /^\/popular$/, fn: () => handlers.popular(q), ttl: CACHE_TTL },
        { re: /^\/recent$/, fn: () => handlers.recent(q), ttl: CACHE_TTL },
        { re: /^\/info\/(\d+)$/, fn: (m) => handlers.info({ id: m[1] }), ttl: CACHE_TTL },
        { re: /^\/episodes\/(\d+)$/, fn: (m) => handlers.episodes({ id: m[1] }, env, bases), ttl: CACHE_TTL },
        {
          re: /^\/watch\/([^/]+)\/(\d+)\/([^/]+)\/([^/]+)$/,
          fn: (m) => handlers.watch({ provider: m[1], anilistId: m[2], category: m[3], slug: m[4] }, env, bases),
          ttl: 3600,
        },
        { re: /^\/health$/, fn: () => ({ status: 'ok' }), ttl: 0 },
        {
          re: /^\/$/,
          fn: () => ({
            name: 'animeiAPI (Worker)',
            endpoints: ['/search', '/trending', '/popular', '/recent', '/info/:id', '/episodes/:id', '/watch/:provider/:anilistId/:category/:slug', '/hls/:encodedUrl', '/health'],
          }),
          ttl: 0,
        },
      ];

      for (const r of routes) {
        const m = path.match(r.re);
        if (!m) continue;

        // read-through cache for JSON endpoints
        let data;
        if (r.ttl > 0) {
          const cached = await cacheGet(env, cacheKey);
          if (cached !== null && cached !== undefined) {
            return json({ success: true, cached: true, data: cached }, 200, corsHeaders);
          }
          data = await r.fn(m);
          await cachePut(env, cacheKey, data, r.ttl);
        } else {
          data = await r.fn(m);
        }

        const count = Array.isArray(data) ? data.length : data ? 1 : 0;
        return json({ success: true, cached: false, count, data }, 200, corsHeaders);
      }

      return json({ success: false, error: 'Not found' }, 404, corsHeaders);
    } catch (err) {
      const status = err.status && err.status < 500 ? err.status : 502;
      return json({ success: false, error: 'Request failed', details: err.message }, status, corsHeaders);
    }
  },
};
