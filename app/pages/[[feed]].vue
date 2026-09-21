<script setup lang="ts">
import type { FeedPage, FeedType } from '#shared/types/hn'

const NAMES: Record<FeedType, string> = {
  top: 'Top',
  new: 'New',
  best: 'Best',
  ask: 'Ask HN',
  show: 'Show HN',
  jobs: 'Jobs',
}
const DESCRIPTIONS: Record<FeedType, string> = {
  top: 'The front page of Hacker News, made readable: stories, points and discussions from the HN community.',
  new: 'The newest submissions to Hacker News, as they arrive.',
  best: 'The highest-voted recent stories on Hacker News.',
  ask: 'Ask HN: questions and discussions from the Hacker News community.',
  show: 'Show HN: projects the Hacker News community is building and sharing.',
  jobs: 'Jobs at Y Combinator startups, posted on Hacker News.',
}

definePageMeta({
  validate: (route) =>
    !route.params.feed || ['new', 'best', 'ask', 'show', 'jobs'].includes(String(route.params.feed)),
})

const route = useRoute()
const feed = computed<FeedType>(() => (route.params.feed as FeedType) || 'top')
const page = computed(() => Math.max(1, Math.floor(Number(route.query.p)) || 1))

const api = useApi()
const { data, pending, error, refresh } = await useAsyncData<FeedPage>(
  () => `feed:${feed.value}:${page.value}`,
  () => api.feed(feed.value, page.value),
  {
    lazy: true,
    getCachedData: fresh(5 * 60_000),
  },
)

usePageMeta({
  title: () => {
    if (feed.value === 'top' && page.value === 1) return SITE_NAME
    return page.value > 1 ? `${NAMES[feed.value]}, page ${page.value}` : NAMES[feed.value]
  },
  description: () => DESCRIPTIONS[feed.value],
})

const pageLink = (p: number) => (p <= 1 ? route.path : { path: route.path, query: { p } })
function nextPage() {
  if (data.value && page.value < data.value.pages) navigateTo(pageLink(page.value + 1))
}
watch(page, () => window.scrollTo({ top: 0 }))
</script>

<template>
  <div>
    <div v-if="error && !data" class="py-24 text-center">
      <p class="serif text-[20px]">Couldn’t load {{ NAMES[feed] }} stories.</p>
      <p class="mt-2 text-muted">
        Hacker News didn’t answer. <button class="link" @click="refresh()">Try again</button>
      </p>
    </div>
    <template v-else>
      <StoryList
        :stories="data?.items ?? []"
        :pending
        hideable
        ranks
        empty="No stories here right now."
        @end="nextPage"
      />
      <Pagination v-if="data" :page :pages="data.pages" :link="pageLink" />
    </template>
  </div>
</template>
