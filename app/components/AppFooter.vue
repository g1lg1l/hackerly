<script setup lang="ts">
const creator = useCreator()
const shortcuts = useShortcuts()
</script>

<template>
  <footer
    class="mx-auto mt-5 mb-10  text-[12.5px] leading-relaxed text-muted sm:px-4"
    style="max-width: var(--measure)"
  >
    <div class="flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-5 px-4">
      <NuxtLink to="/about" class="hover:text-ink">About</NuxtLink>
      <button class="hover:text-ink" @click="shortcuts = true">Keyboard shortcuts</button>
      <a :href="creator.repo" class="hover:text-ink" rel="noopener">Source</a>
      <span class="sm:ml-auto">
        Built by <a :href="creator.github" class="hover:text-ink" rel="noopener">{{ creator.name }}</a>
      </span>
    </div>
    <p class="mt-3 px-4">
      Hackerly is an independent reader for Hacker News, built on the public HN API. Not affiliated with Y
      Combinator.
    </p>
  </footer>
</template>
