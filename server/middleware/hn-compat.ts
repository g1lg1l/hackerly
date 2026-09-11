/** Accept news.ycombinator.com URL shapes so swapping the domain just works. */
const ALIASES: Record<string, string> = {
  '/news': '/',
  '/newest': '/new',
  '/front': '/best',
  '/shownew': '/show',
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const id = url.searchParams.get('id')
  if (id && (url.pathname === '/item' || url.pathname === '/user'))
    return sendRedirect(event, `${url.pathname}/${encodeURIComponent(id)}`, 301)
  const alias = ALIASES[url.pathname]
  if (alias) return sendRedirect(event, alias, 301)
})
