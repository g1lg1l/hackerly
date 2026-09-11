<script setup lang="ts">
defineProps<{ points: number; long?: boolean }>()
</script>

<template>
  <span class="score" :title="plural(points, 'point')">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 1.5 9.5 8.5H.5z" fill="currentColor" />
    </svg>
    {{ long ? plural(points, 'point') : points }}
  </span>
</template>
