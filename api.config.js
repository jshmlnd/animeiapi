/**
 * animeiAPI – Anime Data Config
 * =====================================================================
 * Miruro is a React/Vue SPA protected by Cloudflare; there is no scrapeable
 * HTML. It is a frontend over two JSON APIs (see scraper.js):
 *
 *   1. AniList GraphQL   → metadata   (search, trending/popular/recent,
 *                                        info, episodes list)
 *   2. Miruro secure pipe → streaming (sources / watch → M3U8)
 *
 * Each endpoint below declares a `kind`:
 *   - 'anilist' : a GraphQL metadata query (uses endpoint.buildQuery)
 *   - 'pipe'    : an encrypted pipe request  (uses endpoint.buildPayload)
 *   - 'json'    : a plain JSON GET (uses endpoint.url)
 *
 * sourceUrl is now the Miruro base used by the streaming pipe
 * (rotated via the mirrors listed below).
 */

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

module.exports = {
  name: 'animeiAPI',

  // Miruro streaming base(s). Metadata comes from AniList GraphQL.
  sourceUrl: ['https://www.miruro.tv/', 'https://www.miruro.ru/', 'https://www.miruro.bz/', 'https://www.miruro.to/'],

  cache: {
    enabled: true,
    ttl: 300,
    checkperiod: 60,
  },

  // No JS rendering needed — we talk to JSON APIs, not HTML.
  renderJs: false,

  fetchOpts: {},

  endpoints: [
    // ── Search & discovery (AniList) ─────────────────────────────────
    {
      method: 'GET',
      path: '/search',
      kind: 'anilist',
      buildQuery: (opts) => ({
        query: `
          query ($search: String, $page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              pageInfo { total currentPage hasNextPage perPage }
              media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_LIST_FIELDS} }
            }
          }`,
        variables: {
          search: opts.q,
          page: opts.page || 1,
          perPage: Math.min(opts.perPage || 20, 50),
        },
      }),
      map: (data) => {
        const p = data.Page;
        return { page: p.pageInfo.currentPage, perPage: p.pageInfo.perPage, total: p.pageInfo.total, hasNextPage: p.pageInfo.hasNextPage, results: p.media };
      },
      description: 'Search anime – GET /search?q=naruto&page=1&perPage=20',
    },

    {
      method: 'GET',
      path: '/trending',
      kind: 'anilist',
      buildQuery: (opts) => ({
        query: `
          query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              pageInfo { total currentPage hasNextPage perPage }
              media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
            }
          }`,
        variables: { page: opts.page || 1, perPage: Math.min(opts.perPage || 20, 50) },
      }),
      map: (data) => ({ results: data.Page.media, pageInfo: data.Page.pageInfo }),
      description: 'Trending anime',
    },

    {
      method: 'GET',
      path: '/popular',
      kind: 'anilist',
      buildQuery: (opts) => ({
        query: `
          query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              pageInfo { total currentPage hasNextPage perPage }
              media(type: ANIME, sort: [POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
            }
          }`,
        variables: { page: opts.page || 1, perPage: Math.min(opts.perPage || 20, 50) },
      }),
      map: (data) => ({ results: data.Page.media, pageInfo: data.Page.pageInfo }),
      description: 'Most popular anime',
    },

    {
      method: 'GET',
      path: '/recent',
      kind: 'anilist',
      buildQuery: (opts) => ({
        query: `
          query ($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
              pageInfo { total currentPage hasNextPage perPage }
              media(type: ANIME, status: RELEASING, sort: [START_DATE_DESC]) { ${MEDIA_LIST_FIELDS} }
            }
          }`,
        variables: { page: opts.page || 1, perPage: Math.min(opts.perPage || 20, 50) },
      }),
      map: (data) => ({ results: data.Page.media, pageInfo: data.Page.pageInfo }),
      description: 'Currently airing / recent anime',
    },

    // ── Anime details (AniList) ──────────────────────────────────────
    {
      method: 'GET',
      path: '/info/:id',
      kind: 'anilist',
      buildQuery: (opts) => ({
        query: `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              idMal
              title { romaji english native }
              description(asHtml: false)
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
              trending
              genres
              synonyms
              siteUrl
              trailer { id site thumbnail }
              studios { nodes { id name isAnimationStudio siteUrl } }
              nextAiringEpisode { episode airingAt timeUntilAiring }
              startDate { year month day }
              endDate { year month day }
            }
          }`,
        variables: { id: Number(opts.id) },
      }),
      map: (data) => data.Media,
      description: 'Anime detail – GET /info/20',
    },

    // ── Episodes (Miruro pipe) ───────────────────────────────────────
    {
      method: 'GET',
      path: '/episodes/:id',
      kind: 'pipe',
      buildPayload: (opts) => ({
        path: 'episodes',
        method: 'GET',
        query: { anilistId: Number(opts.id) },
        body: null,
        version: '0.1.0',
      }),
      description: 'Episode list (all providers) – GET /episodes/20',
    },

    // ── Streaming sources (Miruro pipe) ──────────────────────────────
    {
      method: 'GET',
      path: '/api/:provider/:anilistId/:category/:slug',
      kind: 'pipe',
      buildPayload: (opts, base) => {
        // Two-step: fetch episodes to resolve slug → episodeId, then sources.
        return {
          episodes: { path: 'episodes', method: 'GET', query: { anilistId: Number(opts.anilistId) }, body: null, version: '0.1.0' },
          provider: opts.provider,
          category: opts.category,
          slug: opts.slug,
          anilistId: Number(opts.anilistId),
          base,
        };
      },
      resolve: async (resolved, helpers) => {
        const { episodes, provider, category, slug, anilistId, base } = resolved;
        const epData = await helpers.pipe(base, episodes);
        const prov = ((epData.providers || {})[provider] || {});
        const list = ((prov.episodes || {})[category] || []);
        const target = list.find((ep) => {
          const origId = String(ep.id || '');
          const prefix = origId.includes(':') ? origId.split(':')[0] : origId;
          return `${prefix}-${ep.number}` === slug;
        });
        if (!target) {
          const err = new Error(`slug '${slug}' not found for provider ${provider}/${category}`);
          err.status = 404;
          throw err;
        }
        const enc = Buffer.from(String(target.id)).toString('base64url');
        const sourcesPayload = {
          path: 'sources',
          method: 'GET',
          query: { episodeId: enc, provider, category, anilistId },
          body: null,
          version: '0.1.0',
        };
        return helpers.pipe(base, sourcesPayload);
      },
      description: 'Streaming sources – GET /api/kiwi/20/sub/<slug>',
    },
  ],
};
