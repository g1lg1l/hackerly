<script setup lang="ts">
const local = useLocal()
const { show } = useToast()
const stories = computed(() => local.savedList.value.filter((s) => s.kind === 'story'))
const comments = computed(() => local.savedList.value.filter((s) => s.kind === 'comment'))
usePageMeta({ title: 'Saved', description: 'Stories and comments you saved on this device.', noindex: true })

function removeSaved(id: number) {
  local.unsave(id)
  show('Removed from saved')
}
</script>

<template>
  <div>
    <h1 class="serif mt-7 mb-3 text-[22px] font-medium">Saved</h1>
    <ClientOnly>
      <StoryList
        :stories="stories"
        empty="Nothing saved yet. Press s on a story, or use the bookmark next to it."
      />
      <section v-if="comments.length" class="mt-10">
        <h2 class="mb-1 text-[13px] font-medium text-muted">Comments</h2>
        <article v-for="c in comments" :key="c.id" class="border-b border-rule py-3">
          <div class="flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
            <NuxtLink v-if="c.by" :to="`/user/${c.by}`" class="c-by">{{ c.by }}</NuxtLink>
            <TimeAgo :time="c.time" />
            <span v-if="c.storyTitle" class="min-w-0 truncate"
              >on
              <NuxtLink :to="`/item/${c.storyId}`" class="hover:text-ink">{{ c.storyTitle }}</NuxtLink></span
            >
            <button
              class="act ml-auto"
              aria-pressed="true"
              title="Remove from saved"
              @click="removeSaved(c.id)"
            >
              <Icon name="bookmark" :size="13" fill />
            </button>
          </div>
          <NuxtLink :to="`/item/${c.id}`" class="mt-1 block text-[14.5px] leading-relaxed">{{
            c.text
          }}</NuxtLink>
        </article>
      </section>
      <template #fallback>
        <div class="sk mt-4 h-4 w-1/2" />
      </template>
    </ClientOnly>
  </div>
</template>
