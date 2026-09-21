import type { CommentNode, CommentsPage, ItemPage } from '#shared/types/hn'

/** Story page data: the item, its comments in batches, and a full refresh. */
export async function useStory(id: number) {
  const nuxtApp = useNuxtApp()
  const api = useApi()
  const { show } = useToast()
  // Extra batches live in session state, so coming back to the page keeps them.
  const extra = useState<CommentNode[]>(`more:${id}`, () => [])
  const nextBatch = useState<number | null | undefined>(`next:${id}`, () => undefined)

  const {
    data,
    error,
    refresh: refreshItem,
  } = await useAsyncData<ItemPage>(`item:${id}`, () => api.item(id), {
    lazy: true,
    getCachedData: fresh(10 * 60_000),
  })

  if (import.meta.server && error.value) {
    throw createError({
      statusCode: error.value.statusCode ?? 502,
      statusMessage: error.value.statusMessage ?? 'Couldn’t load this story',
      fatal: true,
    })
  }

  const item = computed(() => data.value?.item)

  // Small discussions render on the server; big ones stream in after hydration.
  // Composables called after an await need the Nuxt context restored explicitly; on the server this returns a promise.
  const thread = await nuxtApp.runWithContext(() =>
    useAsyncData<CommentsPage>(`comments:${id}`, () => api.comments(id), {
      lazy: true,
      server: (data.value?.item.descendants ?? 0) <= 120,
      getCachedData: fresh(10 * 60_000),
    }),
  )
  const loadingMore = ref(false)

  const comments = computed(() => [...(thread.data.value?.comments ?? []), ...extra.value])
  const hasMore = computed(
    () => (nextBatch.value === undefined ? thread.data.value?.next : nextBatch.value) != null,
  )
  // `pending` is false while a client-only fetch is still idle on the server, so key the skeleton off status.
  const loadingComments = computed(
    () => !thread.data.value && thread.status.value !== 'success' && thread.status.value !== 'error',
  )

  async function loadMore() {
    const skip = nextBatch.value === undefined ? thread.data.value?.next : nextBatch.value
    if (skip == null || loadingMore.value) return
    loadingMore.value = true
    try {
      const batch = await api.comments(id, skip)
      extra.value = [...extra.value, ...batch.comments]
      nextBatch.value = batch.next
    } catch {
      show('Couldn’t load more comments')
    } finally {
      loadingMore.value = false
    }
  }

  function refresh() {
    extra.value = []
    nextBatch.value = undefined
    refreshItem()
    thread.refresh()
  }

  return {
    data,
    item,
    error,
    comments,
    commentsError: thread.error,
    loadingComments,
    hasMore,
    loadingMore,
    loadMore,
    retryComments: () => thread.refresh(),
    refresh,
  }
}
