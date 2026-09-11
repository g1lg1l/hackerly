<script setup lang="ts">
const local = useLocal()
usePageMeta({
  title: 'Hidden',
  description: 'Stories you hid from your feeds on this device.',
  noindex: true,
})
</script>

<template>
  <div>
    <h1 class="serif mt-7 mb-3 text-[22px] font-medium">Hidden stories</h1>
    <ClientOnly>
      <ul v-if="local.hiddenList.value.length" class="m-0 list-none p-0">
        <li
          v-for="s in local.hiddenList.value"
          :key="s.id"
          class="flex items-center gap-4 border-b border-rule py-2.5"
        >
          <NuxtLink :to="`/item/${s.id}`" class="title min-w-0 flex-1 truncate !text-[15px]"
            >{{ s.title }}<span v-if="domainOf(s.url)" class="domain">{{ domainOf(s.url) }}</span></NuxtLink
          >
          <button class="btn" @click="local.unhide(s.id)">Unhide</button>
        </li>
      </ul>
      <p v-else class="py-20 text-center text-muted">
        Nothing hidden. Press h on a story to hide it from feeds.
      </p>
      <template #fallback><div class="sk mt-4 h-4 w-1/2" /></template>
    </ClientOnly>
  </div>
</template>
