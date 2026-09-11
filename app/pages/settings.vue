<script setup lang="ts">
import type { CommentNode, Story } from '#shared/types/hn'

const { prefs, update, reset } = usePrefs()
const local = useLocal()
const { confirm } = useConfirm()
usePageMeta({
  title: 'Preferences',
  description: 'Theme, typography and reading preferences for Hackerly.',
  noindex: true,
})

type Option = [value: string, label: string]
type Row = { key: keyof Prefs; label: string; hint?: string } & (
  { kind: 'options'; options: Option[] } | { kind: 'stepper'; min: number; max: number } | { kind: 'toggle' }
)

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Appearance',
    rows: [
      {
        key: 'theme',
        kind: 'options',
        label: 'Theme',
        options: [
          ['system', 'System'],
          ['light', 'Light'],
          ['dark', 'Dark'],
        ],
      },
      { key: 'hnBar', kind: 'toggle', label: 'Orange title bar', hint: 'Like the original.' },
      {
        key: 'density',
        kind: 'options',
        label: 'Feed density',
        options: [
          ['comfortable', 'Comfortable'],
          ['compact', 'Compact'],
        ],
      },
      {
        key: 'motion',
        kind: 'options',
        label: 'Animations',
        options: [
          ['system', 'On'],
          ['off', 'Off'],
        ],
        hint: 'Off also honours your system’s reduced-motion setting.',
      },
    ],
  },
  {
    title: 'Reading',
    rows: [
      {
        key: 'font',
        kind: 'options',
        label: 'Comment typeface',
        options: [
          ['sans', 'Sans'],
          ['serif', 'Serif'],
        ],
      },
      { key: 'fontSize', kind: 'stepper', label: 'Text size', min: 13, max: 19 },
      {
        key: 'leading',
        kind: 'options',
        label: 'Line height',
        options: [
          ['tight', 'Tight'],
          ['normal', 'Normal'],
          ['relaxed', 'Relaxed'],
        ],
      },
      {
        key: 'width',
        kind: 'options',
        label: 'Content width',
        options: [
          ['narrow', 'Narrow'],
          ['normal', 'Normal'],
          ['wide', 'Wide'],
        ],
      },
      {
        key: 'indent',
        kind: 'options',
        label: 'Reply indentation',
        options: [
          ['small', 'Small'],
          ['normal', 'Normal'],
          ['large', 'Large'],
        ],
      },
    ],
  },
  {
    title: 'Stories',
    rows: [
      { key: 'showDomain', kind: 'toggle', label: 'Show domains' },
      { key: 'showScore', kind: 'toggle', label: 'Show points' },
      { key: 'showComments', kind: 'toggle', label: 'Show comment counts' },
      {
        key: 'titleOpens',
        kind: 'options',
        label: 'Story titles open',
        options: [
          ['article', 'The article'],
          ['comments', 'The comments'],
        ],
        hint: 'Domains always open the article; comment counts always open the discussion.',
      },
      {
        key: 'time',
        kind: 'options',
        label: 'Timestamps',
        options: [
          ['relative', 'Relative'],
          ['absolute', 'Absolute'],
        ],
      },
      { key: 'newTab', kind: 'toggle', label: 'Open articles in a new tab' },
    ],
  },
  {
    title: 'Keyboard',
    rows: [{ key: 'keys', kind: 'toggle', label: 'Keyboard shortcuts', hint: 'Press ? to see them all.' }],
  },
]

// Live preview of the reading settings.
const now = Math.floor(Date.now() / 1000)
const SAMPLE_STORY: Story = {
  id: 1,
  type: 'story',
  title: 'Show HN: A quieter way to read Hacker News',
  url: 'https://github.com/example/hackerly',
  by: 'pg',
  time: now - 7200,
  score: 312,
  descendants: 148,
  rank: 7,
}
const SAMPLE_COMMENT: CommentNode = {
  id: 2,
  by: 'dang',
  time: now - 3600,
  count: 1,
  text: '<p>This is what comments look like with your current settings. Line height, text size and typeface apply here and on every story page.</p><blockquote>Quoted text sits like this.</blockquote><p>Code stays in <code>monospace</code>.</p>',
  kids: [
    {
      id: 3,
      by: 'pg',
      time: now - 1800,
      count: 0,
      kids: [],
      text: '<p>Replies are indented by the amount you choose above.</p>',
    },
  ],
}
provide(threadKey, {
  selected: ref(null),
  select: () => {},
  op: ref('pg'),
  newSince: ref(0),
  storyId: ref(1),
  storyTitle: ref(SAMPLE_STORY.title),
})

async function clearHistory() {
  const ok = await confirm({
    title: 'Clear reading history?',
    detail: 'Removes every visited story from this device.',
    action: 'Clear history',
  })
  if (ok) local.clearHistory()
}
async function resetAll() {
  const ok = await confirm({
    title: 'Reset preferences?',
    detail: 'Theme, typography and story settings go back to their defaults.',
    action: 'Reset',
  })
  if (ok) reset()
}
</script>

<template>
  <div>
    <h1 class="serif mt-7 text-[22px] font-medium">Preferences</h1>
    <p class="mt-1 text-[13px] text-muted">Saved on this device. No account needed.</p>

    <ClientOnly>
      <section v-for="group in GROUPS" :key="group.title" class="mt-8">
        <h2 class="mb-1 text-[13px] font-medium text-muted">{{ group.title }}</h2>
        <div
          v-for="row in group.rows"
          :key="row.key"
          class="flex items-center justify-between gap-4 border-t border-rule py-3 first-of-type:border-0"
        >
          <div class="min-w-0">
            <div class="text-[14px]">{{ row.label }}</div>
            <div v-if="row.hint" class="text-[12.5px] text-muted">{{ row.hint }}</div>
          </div>

          <fieldset v-if="row.kind === 'options'" class="seg m-0 border-0 p-0.5">
            <legend class="sr-only">{{ row.label }}</legend>
            <label v-for="[value, label] in row.options" :key="value">
              <input
                type="radio"
                :name="row.key"
                :value
                :checked="prefs[row.key] === value"
                @change="update(row.key, value)"
              />{{ label }}
            </label>
          </fieldset>

          <div v-else-if="row.kind === 'stepper'" class="flex items-center gap-1">
            <button
              class="ibtn !h-7 !w-7 border border-rule text-[15px]"
              :disabled="Number(prefs[row.key]) <= row.min"
              aria-label="Smaller"
              @click="update(row.key, Number(prefs[row.key]) - 1)"
            >
              −
            </button>
            <span class="w-10 text-center text-[13px] tnum">{{ prefs[row.key] }}px</span>
            <button
              class="ibtn !h-7 !w-7 border border-rule text-[15px]"
              :disabled="Number(prefs[row.key]) >= row.max"
              aria-label="Larger"
              @click="update(row.key, Number(prefs[row.key]) + 1)"
            >
              +
            </button>
          </div>

          <input
            v-else
            type="checkbox"
            class="switch"
            role="switch"
            :checked="!!prefs[row.key]"
            :aria-label="row.label"
            @change="update(row.key, ($event.target as HTMLInputElement).checked)"
          />
        </div>
      </section>

      <section class="mt-8">
        <h2 class="mb-2 text-[13px] font-medium text-muted">Preview</h2>
        <div class="border-y border-rule"><StoryRow :story="SAMPLE_STORY" show-rank /></div>
        <div class="mt-3"><CommentNode :node="SAMPLE_COMMENT" :depth="0" /></div>
      </section>

      <section class="mt-8">
        <h2 class="mb-1 text-[13px] font-medium text-muted">On this device</h2>
        <div class="flex items-center justify-between gap-4 py-3">
          <span class="text-[14px]"
            >Reading history <span class="text-muted tnum">({{ local.historyList.value.length }})</span></span
          >
          <button class="btn" :disabled="!local.historyList.value.length" @click="clearHistory">Clear</button>
        </div>
        <div class="flex items-center justify-between gap-4 border-t border-rule py-3">
          <span class="text-[14px]"
            >Hidden stories <span class="text-muted tnum">({{ local.hiddenList.value.length }})</span></span
          >
          <NuxtLink to="/hidden" class="btn">Manage</NuxtLink>
        </div>
        <div class="flex items-center justify-between gap-4 border-t border-rule py-3">
          <span class="text-[14px]">Preferences</span>
          <button class="btn" @click="resetAll">Reset to defaults</button>
        </div>
      </section>

      <template #fallback>
        <div class="sk mt-8 h-4 w-1/2" />
        <div class="sk mt-3 h-4 w-1/3" />
      </template>
    </ClientOnly>
  </div>
</template>
