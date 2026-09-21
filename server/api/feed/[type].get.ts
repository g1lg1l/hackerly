import type { FeedType } from '#shared/types/hn'

export default defineEventHandler(async (event) => {
  const page = await api.feed(getRouterParam(event, 'type') as FeedType, Number(getQuery(event).p))
  cacheFor(event, 60)
  return page
})
