import type { Ref } from 'vue'

export interface SelectOptions {
  /** Scroll the item into view if it is off screen. */
  scroll?: boolean
  /** Smooth scrolling, for long jumps. Ignored when motion is reduced. */
  smooth?: boolean
}

/** Keyboard cursor over a list of ids rendered as elements with a data-id attribute. */
export function useSelection(ids: Ref<number[]>, opts: { block?: ScrollLogicalPosition } = {}) {
  const current = ref<number | null>(null)
  const index = computed(() => (current.value == null ? -1 : ids.value.indexOf(current.value)))

  function select(id: number | null, { scroll = false, smooth = false }: SelectOptions = {}) {
    current.value = id
    if (scroll && id != null) nextTick(() => reveal(id, smooth))
  }

  /** Moves by `delta` items. Returns false when already at the edge. */
  function move(delta: number): boolean {
    const count = ids.value.length
    if (!count) return false
    const next = index.value < 0 ? (delta > 0 ? 0 : count - 1) : index.value + delta
    if (next < 0 || next >= count) return false
    select(ids.value[next]!, { scroll: true })
    return true
  }

  function reveal(id: number, smooth = false) {
    const el = document.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const html = document.documentElement
    const headerHeight = parseInt(getComputedStyle(html).getPropertyValue('--header-h')) || 52
    const offScreen = rect.top < headerHeight + 8 || rect.bottom > window.innerHeight - 8
    if (!offScreen) return
    const reducedMotion =
      html.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({
      block: opts.block ?? 'nearest',
      behavior: smooth && !reducedMotion ? 'smooth' : 'auto',
    })
  }

  return { current, index, select, move }
}
