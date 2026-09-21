import { search } from '#shared/utils/hn'

export default defineEventHandler(async (event) => {
  const res = await search(String(getQuery(event).q ?? ''))
  cacheFor(event, 300)
  return res
})
