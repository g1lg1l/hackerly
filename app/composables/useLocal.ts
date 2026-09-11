import type { Story } from '#shared/types/hn'

export interface SavedStory extends Story {
  kind: 'story'
  savedAt: number
}
export interface SavedComment {
  kind: 'comment'
  id: number
  by?: string
  time: number
  text: string
  storyId?: number
  storyTitle?: string
  savedAt: number
}
export type SavedItem = SavedStory | SavedComment
export interface Visit extends Story {
  visitedAt: number
}
export interface Hidden extends Story {
  hiddenAt: number
}

interface LocalData {
  saved: Record<string, SavedItem>
  hidden: Record<string, Hidden>
  history: Record<string, Visit>
  collapsed: Record<string, number>
}

const KEYS = ['saved', 'hidden', 'history', 'collapsed'] as const
const LIMITS = { hidden: 1000, history: 500, collapsed: 2000 }

const snapshot = (s: Story): Story => ({
  id: s.id,
  type: s.type,
  title: s.title,
  url: s.url,
  by: s.by,
  time: s.time,
  score: s.score,
  descendants: s.descendants,
})

/** Drops the oldest entries once a record grows past `limit`. */
function prune<T>(record: Record<string, T>, limit: number, timeOf: (value: T) => number) {
  const keys = Object.keys(record)
  if (keys.length <= limit) return
  keys
    .sort((a, b) => timeOf(record[a]!) - timeOf(record[b]!))
    .slice(0, keys.length - limit)
    .forEach((key) => delete record[key])
}

/**
 * Everything an account would normally hold, kept in localStorage instead.
 * State is loaded after mount (see init) so server and hydration markup match.
 */
export function useLocal() {
  const data = useState<LocalData>('local', () => ({ saved: {}, hidden: {}, history: {}, collapsed: {} }))
  const ready = useState('local-ready', () => false)

  function init() {
    const loaded = { ...data.value }
    for (const key of KEYS) {
      try {
        const stored = JSON.parse(localStorage.getItem(`hackerly:${key}`) || 'null')
        if (stored && typeof stored === 'object') loaded[key] = stored
      } catch {}
    }
    data.value = loaded
    ready.value = true

    for (const key of KEYS) {
      watch(
        () => data.value[key],
        (value) => {
          try {
            localStorage.setItem(`hackerly:${key}`, JSON.stringify(value))
          } catch {}
        },
        { deep: true },
      )
    }
  }

  // Saved stories and comments
  const isSaved = (id: number) => id in data.value.saved
  const unsave = (id: number) => {
    delete data.value.saved[id]
  }
  function toggleSaveStory(story: Story): boolean {
    if (isSaved(story.id)) {
      unsave(story.id)
      return false
    }
    data.value.saved[story.id] = { ...snapshot(story), kind: 'story', savedAt: Date.now() }
    return true
  }
  function toggleSaveComment(comment: Omit<SavedComment, 'kind' | 'savedAt'>): boolean {
    if (isSaved(comment.id)) {
      unsave(comment.id)
      return false
    }
    data.value.saved[comment.id] = { ...comment, kind: 'comment', savedAt: Date.now() }
    return true
  }
  const savedList = computed(() => Object.values(data.value.saved).sort((a, b) => b.savedAt - a.savedAt))

  // Hidden stories
  const isHidden = (id: number) => id in data.value.hidden
  function hide(story: Story) {
    data.value.hidden[story.id] = { ...snapshot(story), hiddenAt: Date.now() }
    prune(data.value.hidden, LIMITS.hidden, (h) => h.hiddenAt)
  }
  const unhide = (id: number) => {
    delete data.value.hidden[id]
  }
  const hiddenList = computed(() => Object.values(data.value.hidden).sort((a, b) => b.hiddenAt - a.hiddenAt))
  const clearHidden = () => {
    data.value.hidden = {}
  }

  // Reading history
  const isRead = (id: number) => id in data.value.history
  /** Records a visit and returns the previous visit time in ms, if any. */
  function visit(story: Story): number | undefined {
    const previous = data.value.history[story.id]?.visitedAt
    data.value.history[story.id] = { ...snapshot(story), visitedAt: Date.now() }
    prune(data.value.history, LIMITS.history, (v) => v.visitedAt)
    return previous
  }
  const markRead = (story: Story) => {
    if (!isRead(story.id)) visit(story)
  }
  function toggleRead(story: Story): boolean {
    if (isRead(story.id)) {
      delete data.value.history[story.id]
      return false
    }
    visit(story)
    return true
  }
  const historyList = computed(() =>
    Object.values(data.value.history).sort((a, b) => b.visitedAt - a.visitedAt),
  )
  const clearHistory = () => {
    data.value.history = {}
  }

  // Collapsed comments
  const isCollapsed = (id: number) => id in data.value.collapsed
  function toggleCollapse(id: number) {
    if (isCollapsed(id)) {
      delete data.value.collapsed[id]
    } else {
      data.value.collapsed[id] = Date.now()
      prune(data.value.collapsed, LIMITS.collapsed, (t) => t)
    }
  }

  return {
    ready,
    init,
    isSaved,
    unsave,
    toggleSaveStory,
    toggleSaveComment,
    savedList,
    isHidden,
    hide,
    unhide,
    hiddenList,
    clearHidden,
    isRead,
    visit,
    markRead,
    toggleRead,
    historyList,
    clearHistory,
    isCollapsed,
    toggleCollapse,
  }
}
