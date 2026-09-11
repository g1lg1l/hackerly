/**
 * HN's API returns user text as a small HTML subset: paragraphs separated by bare `<p>`,
 * plus <i>, <b>, <a href>, <pre><code>. Output is rebuilt from an allowlist, so any other
 * tag or attribute is dropped and can never reach v-html.
 */
const INLINE = new Set(['i', 'b', 'em', 'strong', 'u', 's', 'code', 'pre'])
const HN_LINK = /^https?:\/\/news\.ycombinator\.com\/(item|user)\?id=([\w.-]+)$/

export function sanitizeHn(html?: string | null): string {
  if (!html) return ''
  return html
    .split(/<\/?p\s*\/?>/i)
    .map((para) => {
      const body = inline(para).trim()
      if (!body) return ''
      if (body.startsWith('<pre>')) return body
      const quote = /^&gt;\s?([\s\S]*)$/.exec(body)
      return quote ? `<blockquote>${quote[1]}</blockquote>` : `<p>${body}</p>`
    })
    .join('')
}

function inline(s: string): string {
  return s
    .split(/(<\/?[a-zA-Z][^<>]*>)/)
    .map((part, i) => {
      if (i % 2 === 0) return part.replace(/</g, '&lt;') // text: nothing here may open a tag
      const m = /^<(\/?)([a-zA-Z]+)([^<>]*)>$/.exec(part)
      if (!m) return ''
      const close = m[1]
      const tag = m[2]!.toLowerCase()
      const attrs = m[3] ?? ''
      if (tag === 'br') return '<br>'
      if (INLINE.has(tag)) return close ? `</${tag}>` : `<${tag}>`
      if (tag === 'a') return close ? '</a>' : anchor(attrs)
      return ''
    })
    .join('')
}

function anchor(attrs: string): string {
  const href = (/\shref\s*=\s*"([^"]*)"/i.exec(attrs) ?? /\shref\s*=\s*'([^']*)'/i.exec(attrs))?.[1] ?? ''
  const hn = HN_LINK.exec(href)
  if (hn) return `<a href="/${hn[1]}/${hn[2]}">`
  if (/^https?:\/\//i.test(href)) return `<a href="${href.replace(/"/g, '&quot;')}" rel="nofollow noopener">`
  return '<a>'
}

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Titles come HTML-escaped from the API; decode them for plain-text rendering. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e.startsWith('#')) {
      const code = e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m
    }
    return NAMED[e.toLowerCase()] ?? m
  })
}

/** Plain-text excerpt of sanitized HTML. */
export function excerpt(html: string, max = 200): string {
  const text = decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text
}
