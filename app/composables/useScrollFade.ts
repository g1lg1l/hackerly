import type { Ref } from 'vue'

/**
 * Flags which edges of a scroll container hide more content, as --fade-* custom properties.
 * The .fade-y / .fade-x classes turn those flags into edge masks.
 */
export function useScrollFade(el: Ref<HTMLElement | undefined>) {
  function update() {
    const node = el.value
    if (!node) return
    const flags = {
      '--fade-top': node.scrollTop > 2,
      '--fade-bottom': node.scrollTop + node.clientHeight < node.scrollHeight - 2,
      '--fade-left': node.scrollLeft > 2,
      '--fade-right': node.scrollLeft + node.clientWidth < node.scrollWidth - 2,
    }
    for (const [name, on] of Object.entries(flags)) node.style.setProperty(name, on ? '1' : '0')
  }

  useEventListener(el, 'scroll', update, { passive: true })
  useResizeObserver(el, update)
  useMutationObserver(el, update, { childList: true, subtree: true })

  return update
}
