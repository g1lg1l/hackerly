<script setup lang="ts">
import type { UserPage } from '#shared/types/hn'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const api = useApi()
const { data, error, pending } = await useAsyncData<UserPage>(`user:${id}`, () => api.user(id), {
  lazy: true,
  getCachedData: fresh(10 * 60_000),
})
if (import.meta.server && error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 502,
    statusMessage: error.value.statusCode === 404 ? `No user named “${id}”` : 'Couldn’t load this profile',
    fatal: true,
  })
}
usePageMeta({
  title: id,
  description: () =>
    data.value
      ? `${id} on Hacker News: ${fmtInt(data.value.user.karma)} karma, joined ${absDate(data.value.user.created)}.`
      : undefined,
})
useKeys({ Escape: () => (window.history.length > 1 ? router.back() : navigateTo('/')) })
</script>

<template>
  <div>
    <template v-if="data">
      <header class="border-b border-rule pt-6 pb-5">
        <h1 class="serif text-[26px] leading-tight font-medium">{{ data.user.id }}</h1>
        <div class="meta !mt-2 !text-[13.5px]">
          <span class="tnum">{{ fmtInt(data.user.karma) }} karma</span>
          <span>joined {{ absDate(data.user.created) }}</span>
          <a
            :href="`https://news.ycombinator.com/user?id=${data.user.id}`"
            class="inline-flex items-center gap-1 hover:text-ink"
            rel="noopener"
            target="_blank"
            >On HN<Icon name="external" :size="11"
          /></a>
        </div>
        <HnText v-if="data.user.about" :html="data.user.about" class="mt-5" />
      </header>
      <section class="pt-6">
        <h2 class="mb-2 text-[13px] font-medium text-muted">Recent submissions</h2>
        <StoryList :stories="data.stories" empty="No submissions yet." />
        <p class="py-6 text-[13px] text-muted">
          <a
            :href="`https://news.ycombinator.com/submitted?id=${data.user.id}`"
            class="link"
            rel="noopener"
            target="_blank"
            >All submissions</a
          >
          and
          <a
            :href="`https://news.ycombinator.com/threads?id=${data.user.id}`"
            class="link"
            rel="noopener"
            target="_blank"
            >comments</a
          >
          on Hacker News.
        </p>
      </section>
    </template>
    <div v-else-if="error" class="py-24 text-center">
      <p class="serif text-[20px]">
        {{ error.statusCode === 404 ? `No user named “${id}”.` : 'Couldn’t load this profile.' }}
      </p>
    </div>
    <div v-else-if="pending" class="pt-6" aria-busy="true">
      <div class="sk h-7 w-40" />
      <div class="sk mt-3 h-3 w-64" />
    </div>
  </div>
</template>
