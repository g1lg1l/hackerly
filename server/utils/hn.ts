import type { H3Event } from 'h3'
import type { FeedType } from '#shared/types/hn'
import { createHnApi, directSource } from '#shared/utils/hn'

/** The shared HN client, with every raw read cached in Nitro storage across requests. */
export const api = createHnApi({
  ids: defineCachedFunction(directSource.ids, {
    name: 'ids',
    maxAge: 60,
    staleMaxAge: 600,
    getKey: (feed: FeedType) => feed,
  }),
  item: defineCachedFunction(directSource.item, {
    name: 'item',
    maxAge: 60,
    staleMaxAge: 3600,
    getKey: (id: number) => String(id),
    validate: (e) => e.value != null,
  }),
  user: defineCachedFunction(directSource.user, {
    name: 'user',
    maxAge: 300,
    staleMaxAge: 3600,
    getKey: (id: string) => id,
    validate: (e) => e.value != null,
  }),
})

export function itemId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id' })
  return id
}

export const cacheFor = (event: H3Event, seconds: number) =>
  setHeader(event, 'cache-control', `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`)
