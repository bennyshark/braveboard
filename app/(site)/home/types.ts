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
  id: number // Keep as number if posts table isn't set up yet, or change to string later
  author: string
  authorType: string
  content: string
  time: string
  likes: number
  comments: number
  imageUrls: string[]
}

export type EventItem = {
  id: string // CHANGED: UUID from Supabase is a string
  title: string
  organizer: Organizer
  description?: string // Added optional description
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