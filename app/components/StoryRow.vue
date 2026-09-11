<script setup lang="ts">
import type { Story } from '#shared/types/hn'

const props = defineProps<{ story: Story; selected?: boolean; hideable?: boolean; showRank?: boolean }>()
const emit = defineEmits<{ select: []; hide: [] }>()

const local = useLocal()
const { prefs } = usePrefs()
const { show } = useToast()
const { bump, trigger: pop } = useBump()
const prefetch = usePrefetch()

const itemPath = computed(() => `/item/${props.story.id}`)
const domain = computed(() => domainOf(props.story.url))
const target = computed(() => (prefs.value.newTab ? '_blank' : undefined))
const titleOpensArticle = computed(() => !!props.story.url && prefs.value.titleOpens === 'article')
const saved = computed(() => local.isSaved(props.story.id))
const read = computed(() => local.isRead(props.story.id))
const isJob = computed(() => props.story.type === 'job')

function toggleSave() {
  pop()
  show(local.toggleSaveStory(props.story) ? 'Saved' : 'Removed from saved')
}

// Warm the story after a short hover, so opening it feels instant.
const hover = useTimeoutFn(() => prefetch(props.story.id), 150, { immediate: false })
</script>

<template>
  <article
    class="row"
    :class="{ selected, read }"
    :data-id="story.id"
    @mousedown="emit('select')"
    @mouseenter="hover.start()"
    @mouseleave="hover.stop()"
  >
    <span v-if="showRank && story.rank" class="rank">{{ story.rank }}</span>

    <div class="min-w-0 flex-1">
      <h2 class="title">
        <a v-if="titleOpensArticle" :href="story.url" :target rel="noopener" @click="local.markRead(story)">
          {{ story.title }}
        </a>
        <NuxtLink v-else :to="itemPath">{{ story.title }}</NuxtLink>
        <a
          v-if="domain"
          :href="story.url"
          :target
          rel="noopener"
          class="domain"
          @click="local.markRead(story)"
        >
          {{ domain }}
        </a>
      </h2>

      <div class="meta">
        <ScoreMark v-if="story.score != null && !isJob" :points="story.score" />
        <NuxtLink v-if="story.by" :to="`/user/${story.by}`" class="by">{{ story.by }}</NuxtLink>
        <TimeAgo :time="story.time" />
        <NuxtLink v-if="isJob" :to="itemPath">job</NuxtLink>
        <NuxtLink v-else :to="itemPath" class="comments">{{ commentsLabel(story.descendants) }}</NuxtLink>

        <span class="acts">
          <button
            class="act"
            :aria-pressed="saved"
            :title="saved ? 'Remove from saved' : 'Save'"
            @click="toggleSave"
          >
            <Icon name="bookmark" :size="14" :fill="saved" :class="{ bump }" />
          </button>
          <button v-if="hideable" class="act" title="Hide" @click="emit('hide')">
            <Icon name="eye-off" :size="14" />
          </button>
        </span>
      </div>
    </div>
  </article>
</template>
