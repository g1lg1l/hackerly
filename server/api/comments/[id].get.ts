export default defineEventHandler(async (event) => {
  const page = await api.comments(itemId(event), Number(getQuery(event).skip))
  cacheFor(event, 600)
  return page
})
