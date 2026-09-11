import fontUrl from '@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2?url'

/** Shared clock, so relative times match between server render and hydration. */
export const useNow = () => useState('now', () => Date.now())

/**
 * False until stored preferences and local data have been applied after mount.
 * Entrance animations wait for it, so restored state doesn't animate on load.
 */
export const useArmed = () => useState('armed', () => false)

/** Head tags and client boot shared by app.vue and error.vue. */
export function useBoot() {
  const { url } = useAppConfig()
  const route = useRoute()
  const pageUrl = () => url + route.path

  useHead({
    titleTemplate: (title) => fullTitle(title),
    link: [
      { rel: 'preload', as: 'font', type: 'font/woff2', href: fontUrl, crossorigin: '' },
      { rel: 'canonical', href: pageUrl },
    ],
    // Applies the stored theme and typography before first paint, so there is no flash.
    script: [{ innerHTML: bootScript, tagPosition: 'head' }],
  })
  // Site-wide social tags; pages set their own title and description through usePageMeta.
  useSeoMeta({
    description: SITE_DESCRIPTION,
    ogSiteName: SITE_NAME,
    ogType: 'website',
    ogLocale: 'en_US',
    ogUrl: pageUrl,
    ogImage: `${url}/og.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: SITE_DESCRIPTION,
    twitterCard: 'summary_large_image',
    twitterImage: `${url}/og.png`,
  })

  const prefs = usePrefs()
  const local = useLocal()
  const now = useNow()
  const armed = useArmed()

  onMounted(() => {
    prefs.init()
    local.init()
    setTimeout(() => {
      armed.value = true
    }, 250)
    useIntervalFn(() => {
      now.value = Date.now()
    }, 60_000)
  })
}
