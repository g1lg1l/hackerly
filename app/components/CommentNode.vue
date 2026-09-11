<script setup lang="ts">
import type { CommentNode as Node } from '#shared/types/hn'

const props = defineProps<{ node: Node; depth: number }>()
const thread = inject(threadKey)!
const local = useLocal()
const armed = useArmed()
const { show } = useToast()
const { bump, trigger: pop } = useBump()

const collapsed = computed(() => local.isCollapsed(props.node.id))
const isSelected = computed(() => thread.selected.value === props.node.id)
const isOp = computed(() => !!props.node.by && props.node.by === thread.op.value)
const isNew = computed(() => thread.newSince.value > 0 && props.node.time * 1000 > thread.newSince.value)
const saved = computed(() => local.isSaved(props.node.id))
// Folds animate once the page has settled. Huge subtrees snap; animating hundreds of nodes stutters.
const animateBody = computed(() => armed.value)
const animateKids = computed(() => armed.value && props.node.count <= 80)

const toggle = () => local.toggleCollapse(props.node.id)

function onHeaderClick(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest('a, button')) toggle()
}

function save() {
  const { id, by, time, text } = props.node
  const ok = local.toggleSaveComment({
    id,
    by,
    time,
    text: excerpt(text, 240),
    storyId: thread.storyId.value,
    storyTitle: thread.storyTitle.value,
  })
  pop()
  show(ok ? 'Comment saved' : 'Removed from saved')
}

async function copyLink() {
  show((await copyText(`${location.origin}/item/${props.node.id}`)) ? 'Link copied' : 'Couldn’t copy')
}
</script>

<template>
  <div class="c" :class="{ collapsed, sel: isSelected }" :data-id="node.id" :style="{ '--d': depth }">
    <div class="c-main" @mousedown="thread.select(node.id)">
      <div class="c-hd" @click="onHeaderClick">
        <button
          class="c-toggle"
          :aria-expanded="!collapsed"
          :title="collapsed ? 'Expand thread' : 'Collapse thread'"
          :aria-label="collapsed ? 'Expand comment' : 'Collapse comment'"
          @click.stop="toggle"
        >
          {{ collapsed ? '+' : '−' }}
        </button>
        <NuxtLink v-if="node.by" :to="`/user/${node.by}`" class="c-by" :class="{ op: isOp }">{{
          node.by
        }}</NuxtLink>
        <span v-else class="c-by">[deleted]</span>
        <span v-if="isOp" class="op-tag" title="Story author">OP</span>
        <NuxtLink :to="`/item/${node.id}`" class="c-time" title="Permalink"
          ><TimeAgo :time="node.time"
        /></NuxtLink>
        <span v-if="isNew" class="dot" title="New since your last visit" />
        <span v-if="collapsed && node.count" class="c-count">
          {{ node.count }} {{ node.count === 1 ? 'reply' : 'replies' }}
        </span>

        <span class="c-acts">
          <button
            class="act"
            :aria-pressed="saved"
            :title="saved ? 'Remove from saved' : 'Save comment'"
            @click="save"
          >
            <Icon name="bookmark" :size="13" :fill="saved" :class="{ bump }" />
          </button>
          <button class="act" title="Copy link" @click="copyLink"><Icon name="link" :size="13" /></button>
        </span>
      </div>

      <Transition name="fold" :css="animateBody">
        <div v-if="!collapsed" class="fold">
          <div>
            <HnText v-if="!node.deleted" :html="node.text" class="c-body" />
            <p v-else class="c-body deleted">[deleted]</p>
          </div>
        </div>
      </Transition>
    </div>

    <Transition name="fold" :css="animateKids">
      <div v-if="node.kids.length && !collapsed" class="fold">
        <div class="kids">
          <button class="guide" tabindex="-1" aria-hidden="true" title="Collapse thread" @click="toggle" />
          <CommentNode v-for="kid in node.kids" :key="kid.id" :node="kid" :depth="depth + 1" />
        </div>
      </div>
    </Transition>
  </div>
</template>
