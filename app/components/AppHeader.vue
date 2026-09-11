<script setup lang="ts">
const palette = usePalette()
const { toggleTheme } = usePrefs()

// Content fades under the sticky header once the page has scrolled.
const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 4)
</script>

<template>
  <header class="hdr" :class="{ scrolled }">
    <div class="mx-auto px-4 sm:px-6" style="max-width: var(--measure)">
      <div class="flex min-h-12 items-center gap-5 sm:min-h-13">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2" aria-label="Hackerly, top stories">
          <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="var(--accent)" />
            <path d="M16 9.5 24 22.5H8z" fill="#fff" />
          </svg>
          <span class="wordmark">Hackerly</span>
        </NuxtLink>

        <FeedNav class="hidden flex-1 sm:flex" />

        <div class="ml-auto flex items-center gap-0.5 sm:ml-0">
          <button class="ibtn" title="Search (/)" aria-label="Search" @click="palette = true">
            <Icon name="search" />
          </button>
          <button
            class="ibtn"
            title="Toggle theme (t)"
            aria-label="Toggle light or dark theme"
            @click="toggleTheme"
          >
            <Icon name="sun" class="only-dark" />
            <Icon name="moon" class="only-light" />
          </button>
          <NuxtLink to="/settings" class="ibtn" title="Preferences" aria-label="Preferences">
            <Icon name="sliders" />
          </NuxtLink>
        </div>
      </div>

      <FeedNav class="fade-x -mx-4 px-4 sm:hidden" />
    </div>
  </header>
</template>

<style>
html[data-theme='dark'] .only-light {
  display: none;
}
html:not([data-theme='dark']) .only-dark {
  display: none;
}
</style>
