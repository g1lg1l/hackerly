export interface Prefs {
  theme: 'system' | 'light' | 'dark'
  fontSize: number
  width: 'narrow' | 'normal' | 'wide'
  leading: 'tight' | 'normal' | 'relaxed'
  font: 'sans' | 'serif'
  density: 'comfortable' | 'compact'
  indent: 'small' | 'normal' | 'large'
  motion: 'system' | 'off'
  time: 'relative' | 'absolute'
  titleOpens: 'article' | 'comments'
  showDomain: boolean
  showScore: boolean
  showComments: boolean
  newTab: boolean
  keys: boolean
  hnBar: boolean
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  fontSize: 15,
  width: 'normal',
  leading: 'normal',
  font: 'sans',
  density: 'comfortable',
  indent: 'normal',
  motion: 'system',
  time: 'relative',
  titleOpens: 'article',
  showDomain: true,
  showScore: true,
  showComments: true,
  newTab: false,
  keys: true,
  hnBar: false,
}

export const PREFS_KEY = 'hackerly:prefs'

/**
 * Writes prefs onto <html> as data attributes and CSS variables. All pref-dependent styling hangs
 * off these, so server markup never depends on prefs. The function is also stringified into the
 * pre-hydration <script> (see bootScript), so it must stay self-contained: no imports, no closures.
 */
export function applyPrefs(el: HTMLElement, p: Prefs) {
  var dark =
    p.theme === 'dark' || (p.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  el.dataset.theme = dark ? 'dark' : 'light'
  el.dataset.font = p.font
  el.dataset.density = p.density
  el.dataset.time = p.time
  el.dataset.motion = p.motion
  el.toggleAttribute('data-hide-domain', !p.showDomain)
  el.toggleAttribute('data-hide-score', !p.showScore)
  el.toggleAttribute('data-hide-comments', !p.showComments)
  el.toggleAttribute('data-hn-bar', !!p.hnBar)

  var style = el.style
  style.setProperty('--font-size', Math.min(19, Math.max(13, Number(p.fontSize) || 15)) + 'px')
  style.setProperty('--leading', p.leading === 'tight' ? '1.45' : p.leading === 'relaxed' ? '1.75' : '1.6')
  style.setProperty('--indent', p.indent === 'small' ? '14px' : p.indent === 'large' ? '30px' : '22px')
  style.setProperty('--measure', p.width === 'narrow' ? '620px' : p.width === 'wide' ? '880px' : '720px')
  style.setProperty('--prose', p.width === 'narrow' ? '64ch' : p.width === 'wide' ? '92ch' : '72ch')

  var themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor)
    themeColor.setAttribute('content', p.hnBar ? (dark ? '#ff7a1f' : '#ff6600') : dark ? '#161614' : '#fbfaf7')
}

/** Inline script that applies stored prefs before first paint. */
export const bootScript =
  `(function(){try{var p=Object.assign(${JSON.stringify(DEFAULT_PREFS)},JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||'{}'));` +
  `(${applyPrefs.toString()})(document.documentElement,p)}catch(e){}})()`

export function usePrefs() {
  const prefs = useState<Prefs>('prefs', () => ({ ...DEFAULT_PREFS }))

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    prefs.value = { ...prefs.value, [key]: value }
  }

  /** Untyped variant for the settings table, whose option lists are the source of allowed values. */
  function update(key: keyof Prefs, value: string | number | boolean) {
    prefs.value = { ...prefs.value, [key]: value } as Prefs
  }

  const isDark = () =>
    prefs.value.theme === 'dark' ||
    (prefs.value.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  function toggleTheme() {
    const html = document.documentElement
    html.classList.add('theming')
    setTimeout(() => html.classList.remove('theming'), 300)
    set('theme', isDark() ? 'light' : 'dark')
  }

  function reset() {
    prefs.value = { ...DEFAULT_PREFS }
  }

  /** Client boot: load stored prefs, then keep <html> and storage in sync. */
  function init() {
    try {
      prefs.value = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
    } catch {}

    watch(
      prefs,
      (value) => {
        applyPrefs(document.documentElement, value)
        try {
          localStorage.setItem(PREFS_KEY, JSON.stringify(value))
        } catch {}
      },
      { immediate: true },
    )

    const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
    watch(systemDark, () => applyPrefs(document.documentElement, prefs.value))
  }

  return { prefs, set, update, toggleTheme, reset, init }
}
