import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeEntities, excerpt, sanitizeHn } from '../shared/utils/sanitize.ts'

test('rebuilds HN paragraphs and drops unknown tags', () => {
  assert.equal(sanitizeHn('first<p>second <i>it</i>'), '<p>first</p><p>second <i>it</i></p>')
  assert.equal(sanitizeHn('<script>alert(1)</script>hi <img src=x onerror=alert(1)>'), '<p>alert(1)hi</p>')
  assert.equal(sanitizeHn('a < b'), '<p>a &lt; b</p>')
  assert.equal(sanitizeHn(''), '')
})

test('links: keeps http(s) only, rewrites HN links to local routes', () => {
  assert.equal(sanitizeHn('<a href="javascript:alert(1)" onclick="x">x</a>'), '<p><a>x</a></p>')
  assert.equal(
    sanitizeHn('<a href="https://news.ycombinator.com/item?id=123" rel="nofollow">t</a>'),
    '<p><a href="/item/123">t</a></p>',
  )
  assert.equal(
    sanitizeHn('<a href="https://e.com/?a=1&amp;b=2">t</a>'),
    '<p><a href="https://e.com/?a=1&amp;b=2" rel="nofollow noopener">t</a></p>',
  )
})

test('quotes and code blocks', () => {
  assert.equal(sanitizeHn('&gt; quoted<p>reply'), '<blockquote>quoted</blockquote><p>reply</p>')
  assert.equal(sanitizeHn('<pre><code>  x &lt; y</code></pre>'), '<pre><code>  x &lt; y</code></pre>')
})

test('entities and excerpts', () => {
  assert.equal(decodeEntities('Tom &amp; Jerry&#x27;s &quot;x&quot; &#8217;'), 'Tom & Jerry\'s "x" ’')
  assert.equal(excerpt('<p>hello <i>world</i></p>', 8), 'hello w…')
})
