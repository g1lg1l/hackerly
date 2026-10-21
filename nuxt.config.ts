import tailwindcss from '@tailwindcss/vite'

// `NITRO_PRESET=github-pages nuxt generate` (see .github/workflows/pages.yml) builds a static SPA:
// no server, so the browser talks to Hacker News directly.
const STATIC = process.env.NITRO_PRESET === 'github-pages'
const BASE = process.env.NUXT_APP_BASE_URL || '/'

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
