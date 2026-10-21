export default defineEventHandler(async (event) => {
  const page = await api.user(getRouterParam(event, 'id') ?? '')
  cacheFor(event, 3600)
  return page
})
