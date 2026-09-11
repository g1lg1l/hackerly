import type { HnItem, ItemPage, Story } from '#shared/types/hn'
import { sanitizeHn } from '#shared/utils/sanitize'

export default defineEventHandler(async (event): Promise<ItemPage> => {
  const id = itemId(event)
  const raw = await getItem(id)
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'No such item' })
  if (raw.deleted) throw createError({ statusCode: 404, statusMessage: 'This item was deleted' })

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
      const parent = await getItem(cur.parent)
      if (!parent) break
      cur = parent
    }
    if (cur.type !== 'comment') root = toStory(cur)
  }

  const parts = raw.parts?.length
    ? (await Promise.all(raw.parts.map((p) => getItem(p).catch(() => null))))
        .filter(isLive)
        .map((p) => ({ id: p.id, text: sanitizeHn(p.text), score: p.score ?? 0 }))
    : undefined

  cacheFor(event, 60)
  return { item, root, kids: raw.kids ?? [], parts, fetchedAt: Date.now() }
})
