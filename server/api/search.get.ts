import type { Story } from '#shared/types/hn'
import { decodeEntities } from '#shared/utils/sanitize'

/**
 * The official HN API has no full-text search. Algolia runs the public HN Search API
 * (the same one news.ycombinator.com's search box uses). Swap this file to change providers.
 */
interface Hit {
  objectID: string
  title?: string
  url?: string
  author: string
  points?: number
  num_comments?: number
  created_at_i: number
}

export default defineEventHandler(async (event): Promise<{ items: Story[] }> => {
  const q = String(getQuery(event).q ?? '')
    .trim()
    .slice(0, 200)
  if (!q) return { items: [] }

  const res = await $fetch<{ hits: Hit[] }>('https://hn.algolia.com/api/v1/search', {
    query: { query: q, tags: '(story,poll)', hitsPerPage: 20 },
    timeout: 8000,
  })
  cacheFor(event, 300)
  return {
    items: res.hits
      .filter((h) => h.title)
      .map((h) => ({
        id: Number(h.objectID),
        type: 'story',
        title: decodeEntities(h.title!),
        url: h.url || undefined,
        by: h.author,
        time: h.created_at_i,
        score: h.points ?? 0,
        descendants: h.num_comments ?? 0,
      })),
  }
})
