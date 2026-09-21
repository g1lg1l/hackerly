import tailwindcss from '@tailwindcss/vite'

// `NITRO_PRESET=github-pages nuxt generate` (see .github/workflows/pages.yml) builds a static SPA:
// no server, so the browser talks to Hacker News directly and Vercel-only features are left out.
const STATIC = process.env.NITRO_PRESET === 'github-pages'
const BASE = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: !STATIC,
  modules: ['@vueuse/nuxt', ...(STATIC ? [] : ['@vercel/analytics/nuxt', '@vercel/speed-insights/nuxt'])],
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
  // Vercel: rendered pages hold no per-user state, so cache them at the edge and revalidate in the background.
  routeRules: STATIC
    ? {}
    : {
        ...Object.fromEntries(
          ['/', '/new', '/best', '/ask', '/show', '/jobs'].map((path) => [
            path,
            { isr: { expiration: 60, allowQuery: ['p'] } },
          ]),
        ),
        '/item/**': { isr: 60 },
        '/user/**': { isr: 300 },
      },
  // Closest Vercel region to the HN API's Firebase backend.
  nitro: { vercel: { regions: ['iad1'] } },
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
