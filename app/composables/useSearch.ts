import type { Ref } from 'vue'
import type { Story } from '#shared/types/hn'

/** Debounced story search for the palette. Results always belong to the latest query. */
export function useSearch(query: Ref<string>) {
  const results = ref<Story[]>([])
  const searching = ref(false)
  const failed = ref(false)
  let latest = ''
  const api = useApi()

  watch(query, (value) => {
    latest = value.trim()
    failed.value = false
    searching.value = latest.length > 0
    if (!latest) results.value = []
  })

  watchDebounced(
    query,
    async (value) => {
      const term = value.trim()
      if (!term) return
      try {
        const { items } = await api.search(term)
        if (term === latest) results.value = items
      } catch {
        if (term === latest) {
          results.value = []
          failed.value = true
        }
      } finally {
        if (term === latest) searching.value = false
      }
    },
    { debounce: 220 },
  )

  return { results, searching, failed }
}
