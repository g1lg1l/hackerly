import tailwindcss from '@tailwindcss/vite'

// `NITRO_PRESET=github-pages nuxt generate` (see .github/workflows/pages.yml) builds a static SPA:
// no server, so the browser talks to Hacker News directly.
const STATIC = process.env.NITRO_PRESET === 'github-pages'
const BASE = process.env.NUXT_APP_BASE_URL || '/'

const cdn = (seconds: number) => ({
  headers: { 'cache-control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}` },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: !STATIC,
  modules: ['@vueuse/nuxt'],
  runtimeConfig: { public: { static: STATIC } },
  css: [
    '@fontsource-variable/newsreader/opsz.css',
    '@fontsource-variable/newsreader/opsz-italic.css',
    '~/assets/css/main.css',
  ],
  vite: { plugins: [tailwindcss()] },
  experimental: {
    // Keep fetched feeds/stories in memory for the session so back-navigation is instant.
    purgeCachedData: false,
    // Payloads stay inline in the HTML; separate _payload.json fetches would re-render every story a feed links to.
    payloadExtraction: false,
  },
  // Rendered pages hold no per-user state, so the CDN caches them and revalidates in the background.
  // CDN cache hits are free; regenerating on every request would hit the HN API far more.
  routeRules: STATIC
    ? {}
    : {
        ...Object.fromEntries(['/', '/new', '/best', '/ask', '/show', '/jobs'].map((path) => [path, cdn(300)])),
        '/item/**': cdn(600),
        '/user/**': cdn(3600),
      },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'A calm, keyboard-friendly reader for Hacker News.' },
        { name: 'theme-color', content: '#fbfaf7' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    },
  },
})
