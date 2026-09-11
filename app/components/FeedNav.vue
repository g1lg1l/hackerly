<script setup lang="ts">
const FEEDS: [label: string, to: string][] = [
  ['Top', '/'],
  ['New', '/new'],
  ['Best', '/best'],
  ['Ask', '/ask'],
  ['Show', '/show'],
  ['Jobs', '/jobs'],
]
const MINE: [label: string, to: string][] = [
  ['Saved', '/saved'],
  ['History', '/history'],
]

const route = useRoute()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path === to)

// On small screens the row scrolls: fade its edges and start with the active tab in view.
const el = ref<HTMLElement>()
useScrollFade(el)
onMounted(() => {
  const active = el.value?.querySelector<HTMLElement>('.active')
  if (el.value && active)
    el.value.scrollLeft = active.offsetLeft - (el.value.clientWidth - active.offsetWidth) / 2
})
</script>

<template>
  <nav ref="el" class="nav" aria-label="Feeds">
    <div class="flex gap-4">
      <NuxtLink
        v-for="[label, to] in FEEDS"
        :key="to"
        :to
        :class="{ active: isActive(to) }"
        :aria-current="isActive(to) ? 'page' : undefined"
      >
        {{ label }}
      </NuxtLink>
    </div>
    <div class="flex gap-4 sm:ml-auto">
      <NuxtLink
        v-for="[label, to] in MINE"
        :key="to"
        :to
        :class="{ active: isActive(to) }"
        :aria-current="isActive(to) ? 'page' : undefined"
      >
        {{ label }}
      </NuxtLink>
    </div>
  </nav>
</template>
