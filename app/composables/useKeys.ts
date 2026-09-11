type Handler = (event: KeyboardEvent) => unknown

/** Keys are written like "j", "J", "Enter", "mod+k" or the chord "g h". */
export type KeyMap = Record<string, Handler>

// Later registrations (pages, lists) take precedence over earlier ones (app-wide).
const scopes: KeyMap[] = []
let pendingChord: string | null = null
let chordTimer: ReturnType<typeof setTimeout> | undefined

/** Registers shortcuts for the lifetime of the calling component. A handler returning false passes the key on. */
export function useKeys(map: KeyMap) {
  onMounted(() => {
    scopes.push(map)
  })
  onBeforeUnmount(() => {
    const i = scopes.indexOf(map)
    if (i >= 0) scopes.splice(i, 1)
  })
}

function dispatch(key: string, event: KeyboardEvent): boolean {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const handler = scopes[i]![key]
    if (handler && handler(event) !== false) return true
  }
  return false
}

const hasChord = (prefix: string) =>
  scopes.some((map) => Object.keys(map).some((k) => k.startsWith(`${prefix} `)))

function keyName(event: KeyboardEvent): string {
  const mod = event.metaKey || event.ctrlKey ? 'mod+' : ''
  return mod + (event.key === ' ' ? 'Space' : event.key)
}

const isTyping = (target: HTMLElement) =>
  !!target.closest?.('input, textarea, select, [contenteditable="true"]')
const isControl = (target: HTMLElement) => !!target.closest?.('a, button, [role="button"], summary, label')

/** Installs the single document listener. Call once, from app.vue. */
export function useKeyListener(enabled: () => boolean) {
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey) return
    if (['Shift', 'Meta', 'Control', 'Alt'].includes(event.key)) return

    const key = keyName(event)
    const target = event.target as HTMLElement
    const typing = isTyping(target)

    // Enter and Space on a focused link or button keep activating it.
    if ((key === 'Enter' || key === 'Space') && isControl(target)) return

    // Inside dialogs and inputs only the palette toggle (and "?" outside inputs) work.
    if (document.querySelector('dialog[open]') || typing || !enabled()) {
      const allowed = key === 'mod+k' || (key === '?' && !typing)
      if (allowed && dispatch(key, event)) event.preventDefault()
      pendingChord = null
      return
    }

    if (pendingChord) {
      const chord = `${pendingChord} ${key}`
      pendingChord = null
      clearTimeout(chordTimer)
      if (dispatch(chord, event)) event.preventDefault()
      return
    }

    if (key === 'g' && hasChord('g')) {
      pendingChord = 'g'
      chordTimer = setTimeout(() => {
        pendingChord = null
      }, 1200)
      event.preventDefault()
      return
    }

    if (dispatch(key, event)) event.preventDefault()
  })
}
