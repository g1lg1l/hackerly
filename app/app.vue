<script setup lang="ts">
useBoot()
const palette = usePalette()
const shortcuts = useShortcuts()
const { prefs, toggleTheme } = usePrefs()
const { message } = useToast()

useKeyListener(() => prefs.value.keys)
useKeys({
  '/': () => (palette.value = true),
  'mod+k': () => (palette.value = !palette.value),
  '?': () => (shortcuts.value = !shortcuts.value),
  t: toggleTheme,
  r: () => refreshNuxtData(),
  'g h': () => navigateTo('/'),
  'g t': () => navigateTo('/'),
  'g n': () => navigateTo('/new'),
  'g b': () => navigateTo('/best'),
  'g a': () => navigateTo('/ask'),
  'g s': () => navigateTo('/show'),
  'g j': () => navigateTo('/jobs'),
  'g l': () => navigateTo('/saved'),
  'g y': () => navigateTo('/history'),
  'g p': () => navigateTo('/settings'),
})
</script>

<template>
  <div>
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2"
    >
      Skip to content
    </a>
    <NuxtLoadingIndicator color="#ff6600" :height="2" />
    <AppHeader />
    <main id="main" class="mx-auto w-full px-4 sm:px-6" style="max-width: var(--measure)">
      <NuxtPage />
    </main>
    <AppFooter />
    <ClientOnly>
      <CommandPalette />
      <ShortcutsDialog />
      <ConfirmDialog />
    </ClientOnly>
    <Transition name="fade">
      <div v-if="message" class="toast" role="status">{{ message }}</div>
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
