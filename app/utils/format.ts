const UNITS: [number, string, string][] = [
  [60, 'm', 'minute'],
  [60, 'h', 'hour'],
  [24, 'd', 'day'],
  [30.44, 'mo', 'month'],
  [12, 'y', 'year'],
]

/** "3h" (or "3 hours ago" when long). `now` is passed in so SSR and hydration agree. */
export function ago(unix: number, now: number, long = false): string {
  const s = Math.max(0, Math.floor(now / 1000 - unix))
  if (s < 60) return long ? 'just now' : 'now'
  let v = s / 60
  for (let i = 0; i < UNITS.length; i++) {
    const next = UNITS[i + 1]
    if (!next || v < next[0]) {
      const n = Math.floor(v)
      return long ? `${n} ${UNITS[i]![2]}${n === 1 ? '' : 's'} ago` : `${n}${UNITS[i]![1]}`
    }
    v /= next[0]
  }
  return ''
}

const absFmt = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })
/** Local time; only render after mount (server and client time zones differ). */
export const absTime = (unix: number) => absFmt.format(new Date(unix * 1000))

const dateFmt = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })
/** Date only, UTC, safe to server-render. */
export const absDate = (unix: number) => dateFmt.format(new Date(unix * 1000))

export function domainOf(url?: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    let host = u.hostname.replace(/^www\./, '')
    if (host === 'github.com' || host === 'gitlab.com') {
      const owner = u.pathname.split('/')[1]
      if (owner) host += `/${owner}`
    }
    return host
  } catch {
    return ''
  }
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
export const commentsLabel = (n?: number) => (n ? plural(n, 'comment') : 'discuss')

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const fmtInt = (n: number) => n.toLocaleString('en')
