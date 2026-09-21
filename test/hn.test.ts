import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHnApi, type HnSource } from '../shared/utils/hn.ts'
import type { HnItem } from '../shared/types/hn.ts'

// A story with 40 top-level threads (1 reply each) and one dead comment, from an in-memory source.
const items = new Map<number, HnItem>()
const kids = Array.from({ length: 40 }, (_, n) => 100 + n)
items.set(1, { id: 1, type: 'story', title: 'Hello &amp; welcome', time: 0, kids, descendants: 80 })
for (const k of kids) {
  items.set(k, { id: k, type: 'comment', time: 0, text: 'top', parent: 1, kids: [k * 10] })
  items.set(k * 10, { id: k * 10, type: 'comment', time: 0, text: 'reply', parent: k })
}
items.get(139)!.dead = true
const src: HnSource = {
  ids: async () => [1, 2, 1],
  item: async (id) => items.get(id) ?? null,
  user: async () => null,
}
const api = createHnApi(src)

test('feed: pages ids, drops missing items, decodes titles', async () => {
  const feed = await api.feed('top', 1)
  assert.equal(feed.pages, 1)
  assert.deepEqual(
    feed.items.map((i) => [i.id, i.title, i.rank]),
    [
      [1, 'Hello & welcome', 1],
      [1, 'Hello & welcome', 3],
    ],
  )
  await assert.rejects(api.feed('nope' as any, 1), { statusCode: 404 })
})

test('comments: whole small discussion in one sweep, dead threads gone', async () => {
  const page = await api.comments(1)
  assert.equal(page.total, 40)
  assert.equal(page.next, null)
  assert.equal(page.comments.length, 39)
  assert.equal(page.comments[0]!.count, 1)
  assert.equal(page.comments[0]!.kids[0]!.text, '<p>reply</p>')
})

test('item: 404 for unknown, walks comments up to their story', async () => {
  await assert.rejects(api.item(999), { statusCode: 404 })
  const page = await api.item(1000)
  assert.equal(page.root?.id, 1)
  assert.equal(page.item.parent, 100)
})
