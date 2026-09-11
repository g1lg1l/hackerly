import type { MaybeRefOrGetter } from 'vue'

export const SITE_NAME = 'Hackerly'
export const SITE_DESCRIPTION = 'A calm, keyboard-first reader for Hacker News.'

/** Full document title as shown in the tab and in social previews. */
export const fullTitle = (title?: string) =>
  !title || title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`

interface PageMeta {
  title: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string | undefined>
  /** Pages that only show this device's local data have nothing for crawlers. */
  noindex?: boolean
}

/** Title, description and social tags for one page. Site-wide tags live in useBoot. */
export function usePageMeta(meta: PageMeta) {
  const title = () => toValue(meta.title)
  const social = () => fullTitle(toValue(meta.title))
  const description = () => toValue(meta.description) ?? SITE_DESCRIPTION

  useSeoMeta({
    title,
    description,
    ogTitle: social,
    ogDescription: description,
    twitterTitle: social,
    twitterDescription: description,
    robots: meta.noindex ? 'noindex, nofollow' : undefined,
  })
}
