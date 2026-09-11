<script setup lang="ts">
import type { Story } from '#shared/types/hn'

interface Command {
  label: string
  keys?: string
  to?: string
  run?: () => void
}
type Row = { kind: 'command'; command: Command } | { kind: 'story'; story: Story }

const open = usePalette()
const shortcuts = useShortcuts()
const { toggleTheme } = usePrefs()
const now = useNow()

const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const list = ref<HTMLElement>()
const refade = useScrollFade(list)

const COMMANDS: Command[] = [
  { label: 'Top stories', keys: 'g h', to: '/' },
  { label: 'New', keys: 'g n', to: '/new' },
  { label: 'Best', keys: 'g b', to: '/best' },
  { label: 'Ask HN', keys: 'g a', to: '/ask' },
  { label: 'Show HN', keys: 'g s', to: '/show' },
  { label: 'Jobs', keys: 'g j', to: '/jobs' },
  { label: 'Saved', keys: 'g l', to: '/saved' },
  { label: 'History', keys: 'g y', to: '/history' },
  { label: 'Preferences', keys: 'g p', to: '/settings' },
  { label: 'Toggle theme', keys: 't', run: toggleTheme },
  { label: 'Keyboard shortcuts', keys: '?', run: () => (shortcuts.value = true) },
  { label: 'About Hackerly', to: '/about' },
]

const query = ref('')
const { results, searching, failed } = useSearch(query)

const commands = computed(() => {
  const term = query.value.trim().toLowerCase()
  return term ? COMMANDS.filter((c) => c.label.toLowerCase().includes(term)) : COMMANDS
})
const rows = computed<Row[]>(() => [
  ...commands.value.map((command) => ({ kind: 'command' as const, command })),
  ...results.value.map((story) => ({ kind: 'story' as const, story })),
])
const emptyMessage = computed(() => {
  if (failed.value) return 'Search is unavailable right now.'
  return searching.value ? 'Searching…' : `No results for “${query.value.trim()}”.`
})

const active = ref(0)
watch(query, () => {
  active.value = 0
})
watch(active, (i) =>
  nextTick(() => list.value?.querySelector(`[data-row="${i}"]`)?.scrollIntoView({ block: 'nearest' })),
)

watch(open, (isOpen) => {
  if (!isOpen) return dialog.value?.close()
  dialog.value?.showModal()
  nextTick(() => {
    input.value?.select()
    refade()
  })
})

function run(row: Row) {
  open.value = false
  if (row.kind === 'story') return navigateTo(`/item/${row.story.id}`)
  if (row.command.to) return navigateTo(row.command.to)
  row.command.run?.()
}

function onKeydown(event: KeyboardEvent) {
  const count = rows.value.length
  if (event.key === 'ArrowDown' || (event.key === 'n' && event.ctrlKey)) {
    active.value = count ? (active.value + 1) % count : 0
  } else if (event.key === 'ArrowUp' || (event.key === 'p' && event.ctrlKey)) {
    active.value = count ? (active.value - 1 + count) % count : 0
  } else if (event.key === 'Enter') {
    const row = rows.value[active.value]
    if (row) run(row)
  } else {
    return
  }
  event.preventDefault()
}
</script>

<template>
  <dialog
    ref="dialog"
    class="sheet"
    aria-label="Search and commands"
    @close="open = false"
    @click.self="open = false"
  >
    <div class="dlg">
      <div class="flex items-center gap-3 border-b border-rule px-4">
        <Icon name="search" class="shrink-0 text-faint" />
        <input
          ref="input"
          v-model="query"
          type="text"
          class="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-faint"
          placeholder="Search stories, or jump to a page…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search stories or commands"
          role="combobox"
          aria-controls="palette-list"
          aria-expanded="true"
          @keydown="onKeydown"
        />
        <span v-if="searching" class="shrink-0 text-[12px] text-faint">Searching…</span>
      </div>

      <ul
        id="palette-list"
        ref="list"
        role="listbox"
        class="fade-y m-0 max-h-[60vh] list-none overflow-y-auto p-0 py-1.5"
      >
        <template v-for="(row, i) in rows" :key="row.kind === 'command' ? row.command.label : row.story.id">
          <li v-if="i === 0 && row.kind === 'command'" class="palette-heading" role="presentation">Go to</li>
          <li
            v-if="row.kind === 'story' && i === commands.length"
            class="palette-heading"
            role="presentation"
          >
            Stories
          </li>
          <li
            :data-row="i"
            role="option"
            :aria-selected="i === active"
            class="flex cursor-pointer items-baseline gap-3 px-4 py-2"
            :class="{ 'bg-surface': i === active }"
            @mouseenter="active = i"
            @click="run(row)"
          >
            <template v-if="row.kind === 'command'">
              <span class="flex-1 text-[14px]">{{ row.command.label }}</span>
              <kbd v-if="row.command.keys">{{ row.command.keys }}</kbd>
            </template>
            <div v-else class="min-w-0 flex-1">
              <div class="serif text-[15.5px] leading-snug">{{ row.story.title }}</div>
              <div class="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-muted tnum">
                <span v-if="row.story.score != null">▲ {{ row.story.score }}</span>
                <span>{{ commentsLabel(row.story.descendants) }}</span>
                <span>{{ ago(row.story.time, now) }}</span>
                <span v-if="domainOf(row.story.url)">{{ domainOf(row.story.url) }}</span>
              </div>
            </div>
          </li>
        </template>
        <li v-if="!rows.length" class="px-4 py-6 text-center text-[13px] text-muted">{{ emptyMessage }}</li>
      </ul>

      <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-rule px-4 py-2 text-[11.5px] text-faint">
        <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>esc</kbd> close</span>
        <span class="ml-auto">Story search by Algolia</span>
      </div>
    </div>
  </dialog>
</template>
