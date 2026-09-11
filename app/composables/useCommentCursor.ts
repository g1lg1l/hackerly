import type { Ref } from 'vue'
import type { CommentNode } from '#shared/types/hn'

/** Keyboard cursor over the visible comments: next/previous, thread jumps and parent. */
export function useCommentCursor(comments: Ref<CommentNode[]>, isCollapsed: (id: number) => boolean) {
  // Visible ids in reading order; collapsed subtrees are skipped.
  const visibleIds = computed(() => {
    const ids: number[] = []
    const walk = (nodes: CommentNode[]) => {
      for (const node of nodes) {
        ids.push(node.id)
        if (!isCollapsed(node.id)) walk(node.kids)
      }
    }
    walk(comments.value)
    return ids
  })

  const parentOf = computed(() => {
    const map = new Map<number, number | null>()
    const walk = (nodes: CommentNode[], parent: number | null) => {
      for (const node of nodes) {
        map.set(node.id, parent)
        walk(node.kids, node.id)
      }
    }
    walk(comments.value, null)
    return map
  })

  const cursor = useSelection(visibleIds, { block: 'start' })

  function find(nodes: CommentNode[], id: number | null): CommentNode | undefined {
    for (const node of nodes) {
      if (node.id === id) return node
      const hit = find(node.kids, id)
      if (hit) return hit
    }
  }
  const selected = computed(() => find(comments.value, cursor.current.value))

  function rootOf(id: number): number {
    let current = id
    for (let parent = parentOf.value.get(current); parent != null; parent = parentOf.value.get(current))
      current = parent
    return current
  }

  /** Jumps between top-level threads. Returns false when there is no next thread. */
  function moveThread(delta: 1 | -1): boolean {
    const roots = comments.value.map((c) => c.id)
    const current = cursor.current.value
    if (current == null) {
      const first = roots[delta > 0 ? 0 : roots.length - 1]
      if (first != null) cursor.select(first, { scroll: true, smooth: true })
      return first != null
    }
    const root = rootOf(current)
    // Going up from inside a thread first lands on the thread's own root.
    if (delta < 0 && root !== current) {
      cursor.select(root, { scroll: true, smooth: true })
      return true
    }
    const target = roots[roots.indexOf(root) + delta]
    if (target == null) return false
    cursor.select(target, { scroll: true, smooth: true })
    return true
  }

  function toParent() {
    const parent = cursor.current.value != null ? parentOf.value.get(cursor.current.value) : null
    if (parent != null) cursor.select(parent, { scroll: true, smooth: true })
  }

  function toFirst() {
    const first = comments.value[0]
    if (first) cursor.select(first.id, { scroll: true, smooth: true })
  }

  return { cursor, selected, moveThread, toParent, toFirst }
}
