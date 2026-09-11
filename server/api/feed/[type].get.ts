import type { FeedPage, FeedType } from '#shared/types/hn'

const PAGE = 30

export default defineEventHandler(async (event): Promise<FeedPage> => {
  const type = getRouterParam(event, 'type') as FeedType
  if (!(type in FEEDS)) throw createError({ statusCode: 404, statusMessage: 'Unknown feed' })
  const page = Math.max(1, Math.floor(Number(getQuery(event).p)) || 1)

  const ids = await getIds(type)
  const start = (page - 1) * PAGE
  const raw = await Promise.all(ids.slice(start, start + PAGE).map((id) => getItem(id).catch(() => null)))
  const items = raw.flatMap((i, n) => (isLive(i) && i.title ? [{ ...toStory(i), rank: start + n + 1 }] : []))

  cacheFor(event, 60)
  return { items, page, pages: Math.max(1, Math.ceil(ids.length / PAGE)), fetchedAt: Date.now() }
})
