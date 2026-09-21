export default defineEventHandler(async (event) => {
  const page = await api.user(getRouterParam(event, 'id') ?? '')
  cacheFor(event, 300)
  return page
})
