import type { H3Event } from 'h3'
import type { CommentNode, FeedType, HnItem, HnUser, Story } from '#shared/types/hn'
import { decodeEntities, sanitizeHn } from '#shared/utils/sanitize'

const HN = 'https://hacker-news.firebaseio.com/v0'
export const FEEDS: Record<FeedType, string> = {
  top: 'topstories',
  new: 'newstories',
  best: 'beststories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories',
}

const hn = <T>(path: string) => $fetch<T>(`${HN}/${path}.json`, { timeout: 8000, retry: 1 })

// ponytail: fixed concurrency cap; a 1k-comment thread would otherwise open 1k sockets at once
const MAX_INFLIGHT = 48
let inflight = 0
const waiting: (() => void)[] = []
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_INFLIGHT) await new Promise<void>((r) => waiting.push(r))
  inflight++
  try {
    return await fn()
  } finally {
    inflight--
    waiting.shift()?.()
  }
}

export const getIds = defineCachedFunction((feed: FeedType) => hn<number[]>(FEEDS[feed]), {
  name: 'ids',
  maxAge: 60,
  staleMaxAge: 600,
  getKey: (feed: FeedType) => feed,
})

export const getItem = defineCachedFunction((id: number) => limited(() => hn<HnItem | null>(`item/${id}`)), {
  name: 'item',
  maxAge: 60,
  staleMaxAge: 3600,
  getKey: (id: number) => String(id),
  validate: (e) => e.value != null,
})

export const getUser = defineCachedFunction(
  (id: string) => hn<HnUser | null>(`user/${encodeURIComponent(id)}`),
  {
    name: 'user',
    maxAge: 300,
    staleMaxAge: 3600,
    getKey: (id: string) => id,
    validate: (e) => e.value != null,
  },
)

export const isLive = (i: HnItem | null | undefined): i is HnItem => !!i && !i.dead && !i.deleted

export function toStory(i: HnItem): Story {
  return {
    id: i.id,
    type: i.type,
    title: decodeEntities(i.title ?? ''),
    url: i.url || undefined,
    by: i.by,
    time: i.time,
    score: i.score,
    descendants: i.descendants,
  }
}

/** Fetches a comment and its whole subtree. Dead comments and childless deleted ones vanish. */
export async function getThread(id: number): Promise<CommentNode | null> {
  const c = await getItem(id).catch(() => null)
  if (!c || c.dead || c.type !== 'comment') return null
  const kids = (await Promise.all((c.kids ?? []).map(getThread))).filter((k): k is CommentNode => !!k)
  if (c.deleted && !kids.length) return null
  return {
    id: c.id,
    by: c.by,
    time: c.time,
    text: c.deleted ? '' : sanitizeHn(c.text),
    kids,
    count: kids.reduce((n, k) => n + 1 + k.count, 0),
    deleted: c.deleted || undefined,
  }
}

export function itemId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id' })
  return id
}

export const cacheFor = (event: H3Event, seconds: number) =>
  setHeader(event, 'cache-control', `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`)
