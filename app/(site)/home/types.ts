export type Organization = {
    id: string
    code: string
    name: string
    role: string
    members?: number // Added based on your data usage
  }
  
  export type Organizer = {
    type: string
    name: string
  }
  
  export type Post = {
    id: number
    author: string
    authorType: string
    content: string
    time: string
    likes: number
    comments: number
    imageUrls: string[]
  }
  
  export type EventItem = {
    id: number
    title: string
    organizer: Organizer
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