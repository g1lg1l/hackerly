<script setup lang="ts">
const props = defineProps<{ time: number; long?: boolean }>()
const now = useNow()
// Absolute times use the viewer's time zone, so they render only after mount.
const mounted = useMounted()
const absolute = computed(() => (mounted.value ? absTime(props.time) : ''))
</script>

<template>
  <time :datetime="new Date(time * 1000).toISOString()" :title="absolute || undefined"
    ><span class="t-rel">{{ ago(time, now, long) }}</span
    ><span class="t-abs">{{ absolute }}</span></time
  >
</template>
