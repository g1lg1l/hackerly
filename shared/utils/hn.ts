import { createError } from 'h3'
import { $fetch } from 'ofetch'
import type {
  CommentNode,
  CommentsPage,
  FeedPage,
  FeedType,
  HnItem,
  HnUser,
  ItemPage,
  Story,
  UserPage,
} from '../types/hn'
import { decodeEntities, sanitizeHn } from './sanitize.ts'

/**
 * Everything the app knows about Hacker News, independent of where it runs.
 * On Vercel the server routes wrap a cached source; the static build calls this from the browser.
 */

const HN = 'https://hacker-news.firebaseio.com/v0'
export const FEEDS: Record<FeedType, string> = {
  top: 'topstories',
  new: 'newstories',
  best: 'beststories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories',
}
const PAGE = 30

/** Raw reads from the HN API. The server wraps these in Nitro's cache. */
export interface HnSource {
  ids(feed: FeedType): Promise<number[]>
  item(id: number): Promise<HnItem | null>
  user(id: string): Promise<HnUser | null>
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

export const directSource: HnSource = {
  ids: (feed) => hn<number[]>(FEEDS[feed]),
  item: (id) => limited(() => hn<HnItem | null>(`item/${id}`)),
  user: (id) => hn<HnUser | null>(`user/${encodeURIComponent(id)}`),
}

/** h3 errors are what Nitro answers with and what Nuxt's useAsyncData exposes, on both sides. */
const fail = (statusCode: number, statusMessage: string) => createError({ statusCode, statusMessage })

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

/** Comments per response. Top-level threads are loaded in rank order until the budget is met. */
const BUDGET = 150
/** Discussions up to this size come down in one parallel sweep. */
const SMALL = 300

export function createHnApi(src: HnSource) {
  /** Fetches a comment and its whole subtree. Dead comments and childless deleted ones vanish. */
  async function getThread(id: number): Promise<CommentNode | null> {
    const c = await src.item(id).catch(() => null)
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

  return {
    async feed(type: FeedType, page: number): Promise<FeedPage> {
      if (!(type in FEEDS)) throw fail(404, 'Unknown feed')
      page = Math.max(1, Math.floor(page) || 1)
      const ids = await src.ids(type)
      const start = (page - 1) * PAGE
      const raw = await Promise.all(
        ids.slice(start, start + PAGE).map((id) => src.item(id).catch(() => null)),
      )
      const items = raw.flatMap((i, n) =>
        isLive(i) && i.title ? [{ ...toStory(i), rank: start + n + 1 }] : [],
      )
      return { items, page, pages: Math.max(1, Math.ceil(ids.length / PAGE)), fetchedAt: Date.now() }
    },

    async item(id: number): Promise<ItemPage> {
      const raw = await src.item(id)
      if (!raw) throw fail(404, 'No such item')
      if (raw.deleted) throw fail(404, 'This item was deleted')

      const item: ItemPage['item'] = {
        ...toStory(raw),
        text: sanitizeHn(raw.text),
        parent: raw.parent,
        dead: raw.dead || undefined,
      }

      // Comments: walk up to the story they belong to.
      let root: Story | undefined
      if (raw.type === 'comment') {
        let cur: HnItem = raw
        for (let i = 0; cur.type === 'comment' && cur.parent && i < 80; i++) {
          const parent = await src.item(cur.parent)
          if (!parent) break
          cur = parent
        }
        if (cur.type !== 'comment') root = toStory(cur)
      }

      const parts = raw.parts?.length
        ? (await Promise.all(raw.parts.map((p) => src.item(p).catch(() => null))))
            .filter(isLive)
            .map((p) => ({ id: p.id, text: sanitizeHn(p.text), score: p.score ?? 0 }))
        : undefined

      return { item, root, kids: raw.kids ?? [], parts, fetchedAt: Date.now() }
    },

    async comments(id: number, skip = 0): Promise<CommentsPage> {
      const raw = await src.item(id)
      if (!raw) throw fail(404, 'No such item')

      const kids = raw.kids ?? []
      skip = Math.min(kids.length, Math.max(0, Math.floor(skip) || 0))

      // HN ranks the biggest threads first, so start small and double the chunk until the budget is met.
      const comments: CommentNode[] = []
      let loaded = 0
      let end = skip
      let chunk =
        (raw.descendants ?? kids.length) <= SMALL
          ? kids.length
          : skip
            ? 8
            : (raw.descendants ?? 0) > 1000
              ? 2
              : 4
      while (end < kids.length && loaded < BUDGET) {
        const threads = await Promise.all(kids.slice(end, end + chunk).map(getThread))
        for (const t of threads)
          if (t) {
            comments.push(t)
            loaded += 1 + t.count
          }
        end = Math.min(kids.length, end + chunk)
        chunk *= 2
      }

      return { comments, next: end < kids.length ? end : null, total: kids.length, fetchedAt: Date.now() }
    },

    async user(id: string): Promise<UserPage> {
      if (!/^[\w.-]{1,40}$/.test(id)) throw fail(400, 'Invalid user id')
      const user = await src.user(id)
      if (!user) throw fail(404, 'No such user')

      const recent = await Promise.all(
        (user.submitted ?? []).slice(0, 60).map((i) => src.item(i).catch(() => null)),
      )
      const stories = recent
        .filter(isLive)
        .filter((i) => i.type !== 'comment' && i.title)
        .slice(0, 30)
        .map(toStory)

      return {
        user: { id: user.id, created: user.created, karma: user.karma, about: sanitizeHn(user.about) },
        stories,
      }
    },
  }
}

export type HnApi = ReturnType<typeof createHnApi> & { search: typeof search }

/**
 * The official HN API has no full-text search. Algolia runs the public HN Search API
 * (the same one the news.ycombinator.com search box uses). Swap this function to change providers.
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

export async function search(q: string): Promise<{ items: Story[] }> {
  q = q.trim().slice(0, 200)
  if (!q) return { items: [] }
  const res = await $fetch<{ hits: Hit[] }>('https://hn.algolia.com/api/v1/search', {
    query: { query: q, tags: '(story,poll)', hitsPerPage: 20 },
    timeout: 8000,
  })
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
}
