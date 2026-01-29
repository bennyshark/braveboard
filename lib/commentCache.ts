// lib/commentCache.ts - Global comment cache
type Comment = {
    id: string
    content: string
    imageUrl: string | null
    likes: number
    reactionCount?: number
    createdAt: string
    createdAtTimestamp: number
    authorId: string
    authorName: string
    authorAvatar: string | null
    postedAsType: 'user' | 'organization' | 'faith_admin'
    postedAsOrgId: string | null
    parentCommentId: string | null
    replies: Comment[]
    replyingToName?: string | null
    isDeleted?: boolean
    mostRecentReplyTimestamp?: number
  }
  
  type CacheEntry = {
    comments: Comment[]
    timestamp: number
    totalCount: number
  }
  
  class CommentCache {
    private cache: Map<string, CacheEntry> = new Map()
    private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  
    private getCacheKey(contentType: string, contentId: string): string {
      return `${contentType}:${contentId}`
    }
  
    get(contentType: string, contentId: string): CacheEntry | null {
      const key = this.getCacheKey(contentType, contentId)
      const entry = this.cache.get(key)
      
      if (!entry) return null
      
      // Check if cache is still valid
      if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key)
        return null
      }
      
      return entry
    }
  
    set(contentType: string, contentId: string, comments: Comment[], totalCount: number): void {
      const key = this.getCacheKey(contentType, contentId)
      this.cache.set(key, {
        comments,
        timestamp: Date.now(),
        totalCount
      })
    }
  
    invalidate(contentType: string, contentId: string): void {
      const key = this.getCacheKey(contentType, contentId)
      this.cache.delete(key)
    }
  
    clear(): void {
      this.cache.clear()
    }
  }
  
  // Export singleton instance
  export const commentCache = new CommentCache()