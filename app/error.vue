<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
useBoot()
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => {
  if (!notFound.value) return 'Something went wrong'
  const msg = props.error.statusMessage
  return msg && !msg.startsWith('Page Not Found') ? msg : 'Page not found'
})
usePageMeta({ title, noindex: true })
</script>

<template>
  <div>
    <AppHeader />
    <main class="mx-auto px-4 py-24 text-center sm:px-6" style="max-width: var(--measure)">
      <p class="text-[13px] text-faint tnum">{{ error.statusCode }}</p>
      <h1 class="serif mt-2 text-[26px] leading-tight">{{ title }}</h1>
      <p class="mt-3 text-muted">
        {{
          notFound
            ? 'It may have been deleted, or the link is wrong.'
            : 'Hacker News didn’t answer in time. This usually passes in a moment.'
        }}
      </p>
      <div class="mt-7 flex justify-center gap-2">
        <button v-if="!notFound" class="btn" @click="clearError()">Try again</button>
        <button class="btn" @click="clearError({ redirect: '/' })">Back to top stories</button>
      </div>
    </main>
  </div>
</template>
