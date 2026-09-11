<script setup lang="ts">
const creator = useCreator()
const shortcuts = useShortcuts()
usePageMeta({ title: 'About', description: 'What Hackerly is, where its data comes from, and who built it.' })
</script>

<template>
  <div>
    <h1 class="serif mt-7 text-[22px] font-medium">About Hackerly</h1>
    <div class="hn mt-4 !max-w-none text-[15px] leading-[1.65]">
      <p>
        Hackerly is an independent alternative interface for Hacker News. Same stories, same comments, same
        community; a calmer place to read them.
      </p>
      <p>
        Everything on the site comes from the
        <a href="https://github.com/HackerNews/API" rel="noopener">public Hacker News API</a>. Story search is
        provided by <a href="https://hn.algolia.com" rel="noopener">Algolia’s HN Search</a>. Hackerly is not
        affiliated with or endorsed by Y Combinator or Hacker News.
      </p>
      <p>
        There are no accounts. Saved stories, reading history, hidden stories and your preferences live in
        this browser only. Page views are counted anonymously with Vercel Analytics, without cookies. To vote,
        comment or submit, you’ll still want
        <a href="https://news.ycombinator.com" rel="noopener">news.ycombinator.com</a>; every story links back
        there.
      </p>
      <p>
        Works best with a keyboard: press <kbd>?</kbd> anywhere to see the
        <button class="link" @click="shortcuts = true">shortcuts</button>. You can also paste a Hacker News
        URL and swap the domain; item and user links resolve here.
      </p>
    </div>
    <p class="mt-8 border-t border-rule pt-5 text-[13px] text-muted">
      Built by <a :href="creator.github" class="link" rel="noopener">{{ creator.name }}</a
      >. Source on <a :href="creator.repo" class="link" rel="noopener">GitHub</a>.
    </p>
  </div>
</template>
