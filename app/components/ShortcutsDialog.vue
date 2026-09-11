<script setup lang="ts">
const open = useShortcuts()
const dialog = ref<HTMLDialogElement>()
const body = ref<HTMLElement>()
const refade = useScrollFade(body)

watch(open, (isOpen) => {
  if (!isOpen) return dialog.value?.close()
  dialog.value?.showModal()
  nextTick(refade)
})

const GROUPS: { title: string; keys: [keys: string[], label: string][] }[] = [
  {
    title: 'Move',
    keys: [
      [['j'], 'Next story or comment'],
      [['k'], 'Previous'],
      [['J'], 'Next thread'],
      [['K'], 'Previous thread'],
      [['p'], 'Parent comment'],
      [['Esc'], 'Back to the feed'],
    ],
  },
  {
    title: 'Act',
    keys: [
      [['↵'], 'Open story, like clicking its title'],
      [['o'], 'Open the article'],
      [['c'], 'Open the comments'],
      [['x'], 'Collapse or expand a comment'],
      [['s'], 'Save'],
      [['h'], 'Hide story'],
      [['m'], 'Mark read or unread'],
      [['u'], 'Author profile'],
      [['y'], 'Copy link'],
    ],
  },
  {
    title: 'Go to',
    keys: [
      [['g', 'h'], 'Top'],
      [['g', 'n'], 'New'],
      [['g', 'b'], 'Best'],
      [['g', 'a'], 'Ask'],
      [['g', 's'], 'Show'],
      [['g', 'j'], 'Jobs'],
      [['g', 'l'], 'Saved'],
      [['g', 'y'], 'History'],
      [['g', 'p'], 'Preferences'],
    ],
  },
  {
    title: 'Everywhere',
    keys: [
      [['/'], 'Search and commands'],
      [['⌘', 'k'], 'Search and commands'],
      [['t'], 'Toggle theme'],
      [['r'], 'Refresh'],
      [['?'], 'This list'],
    ],
  },
]
</script>

<template>
  <dialog
    ref="dialog"
    class="sheet"
    aria-label="Keyboard shortcuts"
    @close="open = false"
    @click.self="open = false"
  >
    <div class="dlg !w-[min(720px,calc(100%-32px))]" tabindex="-1" autofocus>
      <div class="flex items-center justify-between border-b border-rule px-5 py-3">
        <h2 class="serif text-[17px]">Keyboard shortcuts</h2>
        <button class="ibtn -mr-2" aria-label="Close" @click="open = false"><Icon name="x" /></button>
      </div>

      <div
        ref="body"
        class="fade-y grid max-h-[70vh] gap-x-8 gap-y-5 overflow-y-auto px-5 py-4 sm:grid-cols-2"
      >
        <section v-for="group in GROUPS" :key="group.title">
          <h3 class="mb-2 text-[12px] font-medium text-faint">{{ group.title }}</h3>
          <dl class="m-0">
            <div
              v-for="[keys, label] in group.keys"
              :key="label"
              class="flex items-center justify-between gap-4 py-[5px] text-[13.5px]"
            >
              <dt class="text-ink">{{ label }}</dt>
              <dd class="m-0 flex shrink-0 gap-1">
                <kbd v-for="key in keys" :key="key">{{ key }}</kbd>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <p class="border-t border-rule px-5 py-2.5 text-[12px] text-faint">
        Shortcuts can be turned off in
        <NuxtLink to="/settings" class="link" @click="open = false">Preferences</NuxtLink>.
      </p>
    </div>
  </dialog>
</template>
