// app/(site)/home/types.ts
export type Organization = {
  id: string
  code: string
  name: string
  role: string
  members?: number
}

export type Organizer = {
  type: string
  name: string
}

export type Post = {
  id: string
  author: string
  authorId: string
  authorType: string
  avatarUrl: string | null
  content: string
  time: string
  likes: number
  comments: number
  imageUrls: string[]
}

export type EventItem = {
  id: string
  title: string
  organizer: Organizer
  description?: string
  date: string
  tags: string[]
  visibility: string
  visibilityType: string
  postingRestricted: boolean
  isPinned: boolean
  participants: number
  totalPosts: number
  posts: Post[]
}