import type { CommentsPage, ItemPage } from '#shared/types/hn'

/** Warms the session cache for a story, so opening it from the feed is instant. */
export function usePrefetch() {
  const app = useNuxtApp()
  const inflight = new Set<string>()

  function warm(key: string, url: string) {
    if (app.payload.data[key] || inflight.has(key)) return
    inflight.add(key)
    $fetch<ItemPage | CommentsPage>(url)
      .then((data) => {
        app.payload.data[key] = data
      })
      .catch(() => {})
      .finally(() => inflight.delete(key))
  }

  return (id: number) => {
    warm(`item:${id}`, `/api/item/${id}`)
    warm(`comments:${id}`, `/api/comments/${id}`)
  }
}
