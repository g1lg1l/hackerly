import type { CommentNode, CommentsPage } from '#shared/types/hn'

/** Comments per response. Top-level threads are loaded in rank order until the budget is met. */
const BUDGET = 150
/** Discussions up to this size come down in one parallel sweep. */
const SMALL = 300

export default defineEventHandler(async (event): Promise<CommentsPage> => {
  const id = itemId(event)
  const raw = await getItem(id)
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'No such item' })

  const kids = raw.kids ?? []
  const skip = Math.min(kids.length, Math.max(0, Math.floor(Number(getQuery(event).skip)) || 0))

  // HN ranks the biggest threads first, so start small and double the chunk until the budget is met.
  const comments: CommentNode[] = []
  let loaded = 0
  let end = skip
  let chunk =
    (raw.descendants ?? kids.length) <= SMALL ? kids.length : skip ? 8 : (raw.descendants ?? 0) > 1000 ? 2 : 4
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

  cacheFor(event, 60)
  return { comments, next: end < kids.length ? end : null, total: kids.length, fetchedAt: Date.now() }
})
