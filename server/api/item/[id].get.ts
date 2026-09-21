export default defineEventHandler(async (event) => {
  const page = await api.item(itemId(event))
  cacheFor(event, 60)
  return page
})
