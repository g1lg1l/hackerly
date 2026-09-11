<script setup lang="ts">
import type { CommentNode } from '#shared/types/hn'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
if (!Number.isInteger(id) || id <= 0)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const local = useLocal()
const { prefs } = usePrefs()
const { show } = useToast()
const { bump, trigger: pop } = useBump()

const {
  data,
  item,
  error,
  comments,
  commentsError,
  loadingComments,
  hasMore,
  loadingMore,
  loadMore,
  retryComments,
  refresh,
} = await useStory(id)

const isComment = computed(() => item.value?.type === 'comment')
const target = computed(() => (prefs.value.newTab ? '_blank' : undefined))
const saved = computed(() => !!item.value && local.isSaved(item.value.id))
const storyId = computed(() => data.value?.root?.id ?? item.value?.id)
const storyTitle = computed(() => data.value?.root?.title ?? item.value?.title)

// Reading history, plus "new since your last visit" markers on comments.
const newSince = ref(0)
let recorded = false
watch(
  [item, local.ready],
  ([current, ready]) => {
    if (!current || !ready || recorded || current.type === 'comment') return
    recorded = true
    newSince.value = local.visit(current) ?? 0
  },
  { immediate: true },
)

// Comment permalinks render the comment itself as the root of its subtree.
const rootNode = computed<CommentNode | undefined>(() => {
  const current = item.value
  if (!current || current.type !== 'comment') return
  const kids = comments.value
  return {
    id: current.id,
    by: current.by,
    time: current.time,
    text: current.text,
    kids,
    count: kids.reduce((n, k) => n + 1 + k.count, 0),
  }
})

const { cursor, selected, moveThread, toParent, toFirst } = useCommentCursor(comments, local.isCollapsed)
provide(threadKey, {
  selected: cursor.current,
  select: (commentId) => cursor.select(commentId),
  op: computed(() => data.value?.root?.by ?? item.value?.by),
  newSince,
  storyId,
  storyTitle,
})

// Load the next batch of threads as the end of the page comes into view.
const sentinel = ref<HTMLElement>()
useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry?.isIntersecting) loadMore()
  },
  { rootMargin: '800px' },
)

function saveSelected() {
  const node = selected.value
  if (node) {
    const ok = local.toggleSaveComment({
      id: node.id,
      by: node.by,
      time: node.time,
      text: excerpt(node.text, 240),
      storyId: storyId.value,
      storyTitle: storyTitle.value,
    })
    show(ok ? 'Comment saved' : 'Removed from saved')
  } else if (item.value) {
    pop()
    show(local.toggleSaveStory(item.value) ? 'Saved' : 'Removed from saved')
  }
}

async function copyLink(targetId = cursor.current.value ?? id) {
  show((await copyText(`${location.origin}/item/${targetId}`)) ? 'Link copied' : 'Couldn’t copy')
}

function openArticle() {
  const url = item.value?.url
  if (!url) return
  if (prefs.value.newTab) window.open(url, '_blank', 'noopener')
  else location.href = url
}

function hideStory() {
  if (!item.value) return
  local.hide(item.value)
  show('Hidden from feeds')
}

const toggleSelected = () => cursor.current.value != null && local.toggleCollapse(cursor.current.value)
const goBack = () => (window.history.length > 1 ? router.back() : navigateTo('/'))

useKeys({
  j: () => cursor.move(1) || loadMore(),
  k: () => cursor.move(-1),
  J: () => moveThread(1) || loadMore(),
  K: () => moveThread(-1),
  p: toParent,
  c: toFirst,
  x: toggleSelected,
  Enter: toggleSelected,
  o: openArticle,
  s: saveSelected,
  y: () => copyLink(),
  u: () => {
    const by = selected.value?.by ?? item.value?.by
    if (by) navigateTo(`/user/${by}`)
  },
  h: hideStory,
  r: refresh,
  Escape: goBack,
})

usePageMeta({
  title: () => {
    if (isComment.value)
      return `${item.value?.by ?? 'Comment'} on ${data.value?.root?.title ?? 'Hacker News'}`
    return item.value?.title ?? 'Story'
  },
  description: () => {
    const current = item.value
    if (!current) return undefined
    if (current.text) return excerpt(current.text, 160)
    const parts = [
      current.score != null ? plural(current.score, 'point') : '',
      current.descendants != null ? plural(current.descendants, 'comment') : '',
    ].filter(Boolean)
    return `${parts.join(' and ')} on Hacker News${current.by ? `, posted by ${current.by}` : ''}.`
  },
})
</script>

<template>
  <div>
    <article v-if="item">
      <header class="border-b border-rule pt-6 pb-5">
        <p v-if="isComment" class="mb-3 text-[13px] text-muted">
          <template v-if="data?.root">
            Comment on <NuxtLink :to="`/item/${data.root.id}`" class="link">{{ data.root.title }}</NuxtLink>
          </template>
          <template v-else>Comment</template>
          <NuxtLink
            v-if="item.parent && item.parent !== data?.root?.id"
            :to="`/item/${item.parent}`"
            class="link ml-2"
            >parent</NuxtLink
          >
        </p>

        <template v-else>
          <h1 class="serif text-[26px] leading-[1.2] font-medium tracking-[-0.01em] sm:text-[28px]">
            <a
              v-if="item.url"
              :href="item.url"
              :target
              rel="noopener"
              class="decoration-faint underline-offset-4 hover:underline"
            >
              {{ item.title }}
            </a>
            <span v-else>{{ item.title }}</span>
          </h1>
          <a
            v-if="item.url"
            :href="item.url"
            :target
            rel="noopener"
            class="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
          >
            {{ domainOf(item.url) }}<Icon name="external" :size="12" />
          </a>

          <div class="meta !mt-3 !text-[13.5px]">
            <ScoreMark v-if="item.score != null && item.type !== 'job'" :points="item.score" long />
            <NuxtLink v-if="item.by" :to="`/user/${item.by}`" class="by">{{ item.by }}</NuxtLink>
            <TimeAgo :time="item.time" long />
            <a v-if="item.type !== 'job'" href="#comments" class="comments">{{
              commentsLabel(item.descendants)
            }}</a>
          </div>

          <div class="mt-4 flex flex-wrap gap-1.5">
            <button class="btn" :aria-pressed="saved" @click="saveSelected">
              <Icon name="bookmark" :size="13" :fill="saved" :class="{ bump }" />{{
                saved ? 'Saved' : 'Save'
              }}
            </button>
            <button class="btn" @click="hideStory"><Icon name="eye-off" :size="13" />Hide</button>
            <button class="btn" @click="copyLink(id)"><Icon name="link" :size="13" />Copy link</button>
            <a
              :href="`https://news.ycombinator.com/item?id=${id}`"
              class="btn"
              rel="noopener"
              target="_blank"
            >
              On HN<Icon name="external" :size="12" />
            </a>
          </div>

          <HnText v-if="item.text" :html="item.text" class="mt-6" />

          <ol v-if="data?.parts?.length" class="mt-5 m-0 list-none p-0">
            <li
              v-for="part in data.parts"
              :key="part.id"
              class="flex items-baseline justify-between gap-4 border-t border-rule py-2 first:border-0"
            >
              <HnText :html="part.text" class="!max-w-none" />
              <span class="shrink-0 text-[13px] text-muted tnum">{{ plural(part.score, 'point') }}</span>
            </li>
          </ol>
        </template>
      </header>

      <section id="comments" class="pt-4">
        <h2 class="sr-only">Comments</h2>

        <CommentNode v-if="rootNode" :node="rootNode" :depth="0" />
        <template v-else>
          <div v-if="loadingComments" aria-busy="true" aria-label="Loading comments">
            <div v-for="i in 6" :key="i" class="py-3" :style="{ paddingLeft: `${(i % 3) * 22}px` }">
              <div class="sk h-3 w-32" />
              <div class="sk mt-3 h-3" :style="{ width: `${55 + ((i * 29) % 40)}%` }" />
              <div class="sk mt-2 h-3" :style="{ width: `${30 + ((i * 53) % 50)}%` }" />
            </div>
          </div>
          <p v-else-if="commentsError && !comments.length" class="py-16 text-center text-muted">
            Couldn’t load the comments. <button class="link" @click="retryComments()">Try again</button>
          </p>
          <p v-else-if="!comments.length && item.type !== 'job'" class="py-16 text-center text-muted">
            No comments yet.
          </p>
          <CommentNode v-for="comment in comments" :key="comment.id" :node="comment" :depth="0" />
        </template>

        <div v-if="hasMore" ref="sentinel" class="py-8 text-center">
          <button class="btn" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? 'Loading…' : 'Load more comments' }}
          </button>
        </div>
      </section>

      <div
        v-if="comments.length > 2"
        class="fixed right-4 bottom-5 hidden gap-1 rounded-md border border-rule bg-paper p-1 shadow-lg [@media(hover:none)]:flex"
      >
        <button class="ibtn" aria-label="Previous thread" @click="moveThread(-1)">
          <Icon name="arrow-up" />
        </button>
        <button class="ibtn" aria-label="Next thread" @click="moveThread(1)">
          <Icon name="arrow-down" />
        </button>
      </div>
    </article>

    <div v-else-if="error" class="py-24 text-center">
      <p class="serif text-[20px]">
        {{
          error.statusCode === 404
            ? error.statusMessage || 'This story isn’t available.'
            : 'Couldn’t load this story.'
        }}
      </p>
      <p class="mt-2 text-muted">
        <button v-if="error.statusCode !== 404" class="link" @click="refresh()">Try again</button>
        <NuxtLink v-else to="/" class="link">Back to top stories</NuxtLink>
      </p>
    </div>

    <div v-else class="pt-6" aria-busy="true" aria-label="Loading story">
      <div class="sk h-7 w-3/4" />
      <div class="sk mt-3 h-3 w-32" />
      <div class="sk mt-4 h-3 w-56" />
    </div>
  </div>
</template>
