<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{ page: number; pages: number; link: (page: number) => RouteLocationRaw }>()

/** Seven slots once there are more than seven pages: 1 … 4 5 6 … 17. `null` is a gap. */
const slots = computed<(number | null)[]>(() => {
  const { page, pages } = props
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, null, pages]
  if (page >= pages - 3) return [1, null, pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, null, page - 1, page, page + 1, null, pages]
})
</script>

<template>
  <nav v-if="pages > 1" class="pager" aria-label="Pages">
    <NuxtLink v-if="page > 1" :to="link(page - 1)" class="pager-item" aria-label="Previous page">
      <Icon name="arrow-left" :size="14" />
    </NuxtLink>
    <span v-else class="pager-item" aria-hidden="true" />

    <template v-for="(slot, i) in slots" :key="i">
      <span v-if="slot === null" class="pager-item pager-gap">…</span>
      <NuxtLink
        v-else
        :to="link(slot)"
        class="pager-item"
        :class="{ active: slot === page }"
        :aria-current="slot === page ? 'page' : undefined"
      >
        {{ slot }}
      </NuxtLink>
    </template>

    <NuxtLink v-if="page < pages" :to="link(page + 1)" class="pager-item" aria-label="Next page">
      <Icon name="arrow-right" :size="14" />
    </NuxtLink>
    <span v-else class="pager-item" aria-hidden="true" />
  </nav>
</template>
