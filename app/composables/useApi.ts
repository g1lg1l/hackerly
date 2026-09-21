import { createHnApi, directSource, search, type HnApi } from '#shared/utils/hn'

let direct: HnApi | undefined

/**
 * Data access for pages and composables. With a server (Vercel), calls go through `/api/*`,
 * which caches HN reads across visitors. Static builds (GitHub Pages) have no server, so the
 * browser runs the same code against Hacker News directly.
 */
export function useApi(): HnApi {
  if (useRuntimeConfig().public.static) return (direct ??= { ...createHnApi(directSource), search })
  return {
    feed: (type, p) => $fetch(`/api/feed/${type}`, { query: { p } }),
    item: (id) => $fetch(`/api/item/${id}`),
    comments: (id, skip) => $fetch(`/api/comments/${id}`, { query: { skip } }),
    user: (id) => $fetch(`/api/user/${encodeURIComponent(id)}`),
    search: (q) => $fetch('/api/search', { query: { q } }),
  }
}
