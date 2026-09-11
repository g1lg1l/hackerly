/** Raw item from https://hacker-news.firebaseio.com/v0/item/:id.json */
export interface HnItem {
  id: number
  type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt'
  by?: string
  time: number
  text?: string
  dead?: boolean
  deleted?: boolean
  parent?: number
  poll?: number
  kids?: number[]
  url?: string
  score?: number
  title?: string
  parts?: number[]
  descendants?: number
}

export interface HnUser {
  id: string
  created: number
  karma: number
  about?: string
  submitted?: number[]
}

export type FeedType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'jobs'

/** A story/job/poll as shown in lists. Titles are entity-decoded plain text. */
export interface Story {
  id: number
  type: HnItem['type']
  title: string
  url?: string
  by?: string
  time: number
  score?: number
  descendants?: number
  rank?: number
}

export interface CommentNode {
  id: number
  by?: string
  time: number
  /** Sanitized HTML, empty when deleted. */
  text: string
  kids: CommentNode[]
  /** Total descendants. */
  count: number
  deleted?: true
}

export interface FeedPage {
  items: Story[]
  page: number
  pages: number
  fetchedAt: number
}

export interface ItemPage {
  item: Story & { text: string; parent?: number; dead?: boolean }
  /** For comments: the story they belong to. */
  root?: Story
  kids: number[]
  parts?: { id: number; text: string; score: number }[]
  fetchedAt: number
}

export interface CommentsPage {
  comments: CommentNode[]
  /** Offset of the next batch of top-level threads, null when done. */
  next: number | null
  total: number
  fetchedAt: number
}

export interface UserPage {
  user: { id: string; created: number; karma: number; about: string }
  stories: Story[]
}
