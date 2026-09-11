<script setup lang="ts">
const local = useLocal()
const { confirm } = useConfirm()
usePageMeta({ title: 'History', description: 'Stories you have read on this device.', noindex: true })
async function clear() {
  const ok = await confirm({
    title: 'Clear reading history?',
    detail: 'Removes every visited story from this device.',
    action: 'Clear history',
  })
  if (ok) local.clearHistory()
}
</script>

<template>
  <div>
    <div class="mt-7 mb-3 flex items-baseline justify-between">
      <h1 class="serif text-[22px] font-medium">History</h1>
      <ClientOnly
        ><button v-if="local.historyList.value.length" class="btn" @click="clear">
          Clear history
        </button></ClientOnly
      >
    </div>
    <ClientOnly>
      <StoryList :stories="local.historyList.value" empty="Stories you open will show up here." />
      <template #fallback><div class="sk mt-4 h-4 w-1/2" /></template>
    </ClientOnly>
  </div>
</template>
