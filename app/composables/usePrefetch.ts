/** Warms the session cache for a story, so opening it from the feed is instant. */
export function usePrefetch() {
  const app = useNuxtApp()
  const api = useApi()
  const inflight = new Set<string>()

  function warm(key: string, load: () => Promise<unknown>) {
    if (app.payload.data[key] || inflight.has(key)) return
    inflight.add(key)
    load()
      .then((data) => {
        app.payload.data[key] = data
      })
      .catch(() => {})
      .finally(() => inflight.delete(key))
  }

  return (id: number) => {
    warm(`item:${id}`, () => api.item(id))
    warm(`comments:${id}`, () => api.comments(id))
  }
}
