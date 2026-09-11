import type { UserPage } from '#shared/types/hn'
import { sanitizeHn } from '#shared/utils/sanitize'

export default defineEventHandler(async (event): Promise<UserPage> => {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[\w.-]{1,40}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  const user = await getUser(id)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'No such user' })

  const recent = await Promise.all(
    (user.submitted ?? []).slice(0, 60).map((i) => getItem(i).catch(() => null)),
  )
  const stories = recent
    .filter(isLive)
    .filter((i) => i.type !== 'comment' && i.title)
    .slice(0, 30)
    .map(toStory)

  cacheFor(event, 300)
  return {
    user: { id: user.id, created: user.created, karma: user.karma, about: sanitizeHn(user.about) },
    stories,
  }
})
