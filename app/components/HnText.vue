<script setup lang="ts">
/** Renders sanitized HN HTML. Internal links stay in the app; external ones follow the new-tab preference. */
defineProps<{ html: string }>()
const { prefs } = usePrefs()

function onClick(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest('a')
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const href = link.getAttribute('href') || ''
  if (href.startsWith('/')) {
    event.preventDefault()
    navigateTo(href)
  } else if (prefs.value.newTab && /^https?:/.test(href)) {
    event.preventDefault()
    window.open(href, '_blank', 'noopener')
  }
}
</script>

<template>
  <div class="hn" @click="onClick" v-html="html" />
</template>
