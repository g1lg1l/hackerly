<script setup lang="ts">
import type { Story } from '#shared/types/hn'

const props = defineProps<{
  stories: Story[]
  pending?: boolean
  hideable?: boolean
  ranks?: boolean
  empty?: string
}>()
const emit = defineEmits<{ end: [] }>()

const local = useLocal()
const { prefs } = usePrefs()
const { show } = useToast()
const prefetch = usePrefetch()

const visible = computed(() =>
  props.hideable ? props.stories.filter((s) => !local.isHidden(s.id)) : props.stories,
)
const ids = computed(() => visible.value.map((s) => s.id))
const cursor = useSelection(ids)
const selected = computed(() => visible.value.find((s) => s.id === cursor.current.value))

function open(story: Story, comments = false) {
  if (comments || !story.url) return navigateTo(`/item/${story.id}`)
  local.markRead(story)
  if (prefs.value.newTab) window.open(story.url, '_blank', 'noopener')
  else location.href = story.url
}

function hide(story: Story) {
  const at = ids.value.indexOf(story.id)
  local.hide(story)
  cursor.select(ids.value[at] ?? ids.value[at - 1] ?? null, { scroll: true })
  show('Hidden')
}

async function copyLink(story: Story) {
  show((await copyText(`${location.origin}/item/${story.id}`)) ? 'Link copied' : 'Couldn’t copy')
}

useKeys({
  j: () => {
    if (!cursor.move(1)) emit('end')
  },
  k: () => cursor.move(-1),
  Enter: () => selected.value && open(selected.value, prefs.value.titleOpens === 'comments'),
  o: () => selected.value && open(selected.value),
  c: () => selected.value && open(selected.value, true),
  s: () => selected.value && show(local.toggleSaveStory(selected.value) ? 'Saved' : 'Removed from saved'),
  h: () => selected.value && props.hideable && hide(selected.value),
  m: () => selected.value && show(local.toggleRead(selected.value) ? 'Marked as read' : 'Marked as unread'),
  u: () => selected.value?.by && navigateTo(`/user/${selected.value.by}`),
  y: () => selected.value && copyLink(selected.value),
})

watch(cursor.current, (id) => {
  if (id) prefetch(id)
})

// Remember the cursor per URL, so coming back from a story lands where you left.
const route = useRoute()
const remembered = useState<Record<string, number>>('cursor-memory', () => ({}))
function restore() {
  if (cursor.current.value != null && ids.value.includes(cursor.current.value)) return
  const id = remembered.value[route.fullPath]
  cursor.current.value = id && ids.value.includes(id) ? id : null
}
onMounted(restore)
watch(ids, restore)
watch(cursor.current, (id) => {
  if (id) remembered.value[route.fullPath] = id
})
</script>

<template>
  <div>
    <ol v-if="visible.length" class="m-0 list-none p-0 transition-opacity" :class="{ 'opacity-50': pending }">
      <li v-for="story in visible" :key="story.id">
        <StoryRow
          :story
          :selected="story.id === cursor.current.value"
          :hideable
          :show-rank="ranks"
          @select="cursor.select(story.id)"
          @hide="hide(story)"
        />
      </li>
    </ol>

    <div v-else-if="pending" aria-busy="true" aria-label="Loading stories">
      <div v-for="i in 12" :key="i" class="row !border-transparent">
        <span v-if="ranks" class="rank" />
        <div class="flex-1 py-[3px]">
          <div class="sk h-[15px]" :style="{ width: `${42 + ((i * 37) % 50)}%` }" />
          <div class="sk mt-2.5 h-[11px] w-44" />
        </div>
      </div>
    </div>

    <p v-else class="py-20 text-center text-muted">{{ empty ?? 'Nothing here.' }}</p>
  </div>
</template>
