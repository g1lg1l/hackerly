import type { InjectionKey, Ref } from 'vue'

/** Shared by the story page and every CommentNode beneath it. */
export interface ThreadContext {
  selected: Ref<number | null>
  select: (id: number) => void
  /** Story author, for the OP badge. */
  op: Ref<string | undefined>
  /** Comments newer than this (ms) get a "new" dot. 0 disables. */
  newSince: Ref<number>
  storyId: Ref<number | undefined>
  storyTitle: Ref<string | undefined>
}

export const threadKey: InjectionKey<ThreadContext> = Symbol('thread')
