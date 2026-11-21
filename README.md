# animeiAPI

Anime **metadata + streaming** API. Returns real anime data (search, trending, details, episodes) and HLS/M3U8 streaming sources.

## How it works

Miruro (miruro.tv/.ru/.bz/.to) is a React/Vue SPA behind Cloudflare — there is no
scrapeable HTML. It is a frontend over two JSON APIs, which this project talks to
directly:

| Data | Backend | Protection |
|---|---|---|
| Metadata (search, trending, info, episodes) | [AniList GraphQL](https://graphql.anilist.co) | None (public) |
| Streaming sources (M3U8/HLS) | Miruro secure pipe `miruro.*/api/secure/pipe` | Cloudflare challenge |

- `scraper.js` — HTTP + AniList GraphQL + encrypted Miruro pipe helpers.
- `api.config.js` — endpoint definitions (single source of truth).
- `server.js` — Express router + caching.

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000
# or
npm start
```

## Endpoints

| Method | Path | Kind | What it does |
|---|---|---|---|
| GET | `/search?q=&page=&perPage=` | AniList | Search anime |
| GET | `/trending` | AniList | Trending anime |
| GET | `/popular` | AniList | Most popular anime |
| GET | `/recent` | AniList | Currently airing / recent |
| GET | `/info/:id` | AniList | Full anime detail (id = AniList ID) |
| GET | `/episodes/:id` | pipe | Episode list from all providers |
| GET | `/watch/:provider/:anilistId/:category/:slug` | pipe | M3U8 streaming sources |
| GET | `/hls/:encodedUrl` | proxy | HLS playlist/segment proxy (referer fix) |
| GET | `/` | — | Endpoints + cache stats |
| GET | `/health` | — | Health check |
| GET | `/cache/stats` | — | Cache statistics |
| DELETE | `/cache` | — | Clear cache |

All endpoints return:

```json
{ "success": true, "source": "...", "count": 1, "data": { ... }, "tookMs": 142 }
```

Cached responses include `"cached": true` and header `X-Cache: HIT`.

## Streaming flow (3 steps)

1. `GET /episodes/20` → get providers + episode list (sub/dub).
2. Take an episode `id` from step 1 and call
   `GET /watch/{provider}/{anilistId}/{category}/{slug}`.
3. Play `data.streams[0].url` in any HLS player (hls.js, Video.js, VLC, mpv).

## HLS proxy (skip referer checks)

Some M3U8 hosts require a `Referer`/`Origin` header. To play streams from any
client, proxy the playlist through `/hls/{base64url(url)}`:

```js
const m3u8 = "https://cdn.example.com/video/master.m3u8";
const url = `/hls/${Buffer.from(m3u8).toString("base64url")}`;
// → /hls/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20v...
```

The proxy fetches the target with the correct `Referer` and rewrites relative
segment/playlist URLs so they also route back through `/hls/*`.

## Cloudflare / TLS note (streaming only)

The secure pipe (`/episodes`, `/watch`) rejects datacenter/cloud IPs with a
Cloudflare challenge. The pipe helper sends full same-origin browser headers;
to reliably pass the challenge from a non-browser host, point it at a
[FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) instance:

```bash
# run FlareSolverr (Docker)
docker run -d --name flaresolverr -p 8191:8191 \
  -e LOG_LEVEL=info ghcr.io/flaresolverr/flaresolverr:latest
```

```bash
# .env
FLARESOLVERR_URL=http://localhost:8191      # endpoint (default http://localhost:8191)
FLARESOLVERR_ALWAYS=1                        # optional: route ALL pipe requests via FlareSolverr
FLARESOLVERR_TIMEOUT=60000                   # optional: solve timeout (ms)
```

When `FLARESOLVERR_URL` is set, a pipe request that gets blocked (`403`) will
automatically be retried through FlareSolverr, which solves the challenge in a
real browser and returns the decrypted pipe response. Solved `cf_clearance`
cookies are cached per hostname to speed up later requests. Metadata endpoints
(AniList) are unaffected and need no bypass.

## Configuration

Edit `api.config.js`:

- `sourceUrl` — Miruro streaming base(s) used by the pipe (mirror rotation).
- `cache` — global cache toggle + TTL (default 300s).
- Each endpoint declares a `kind`:
  - `anilist` → `buildQuery(opts)` returns `{ query, variables }`, optional `map(data)`.
  - `pipe` → `buildPayload(opts, base)` returns a pipe payload; optional `resolve(payload, helpers)` for multi-step requests.
  - `json` → plain JSON GET via `buildUrl`/`url`.

## Legal

AniList and Miruro content belongs to their respective owners. This API links
to third-party services and does not host any media. Use responsibly and in
compliance with the source sites' terms.

## Deployment

### Docker Compose (self-hosted)

```bash
docker compose up -d --build
```

Runs two services on the same network:
- `animeiapi` → `http://localhost:3000`
- `flaresolverr` → `http://localhost:8191` (auto-wired via `FLARESOLVERR_URL`)

Works for streaming when your host has a **residential** IP (home machine / VPS
with non-datacenter IP). Cloudflare flags datacenter IPs even for FlareSolverr.

### Cloudflare Worker

```bash
npx wrangler login            # one-time auth
wrangler kv namespace create CACHE   # copy the "id" into wrangler.jsonc
npx wrangler secret put FLARESOLVERR_URL
npm run deploy                # = wrangler deploy
```

Metadata endpoints work immediately. Streaming (`/episodes`, `/watch`) requires
your FlareSolverr to be reachable from Cloudflare's edge — Worker datacenter IPs
are always Cloudflare-blocked. Expose your local/residential FlareSolverr with a
tunnel:

```bash
# on the machine running FlareSolverr (or use Docker):
cloudflared tunnel --url http://localhost:8191
# → gives a *.trycloudflare.com URL; set it as the Worker secret:
npx wrangler secret put FLARESOLVERR_URL   # paste https://xxx.trycloudflare.com
```

For a permanent setup, use a named `cloudflared tunnel` (or a public VPS) instead
of the `.trycloudflare.com` quick tunnel.
