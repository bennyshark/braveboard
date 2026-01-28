// components/comments/CommentSection.tsx - OPTIMIZED for faster loading
"use client"
import { useState, useEffect, useMemo } from "react"
import { MessageCircle, Loader2, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { CommentItem } from "./CommentItem"
import { InlineCommentBox } from "./InlineCommentBox"
import { AllCommentsModal } from "./AllCommentsModal"

interface CommentSectionProps {
  contentType: 'post' | 'announcement' | 'bulletin' | 'free_wall_post' | 'repost'
  contentId: string
  eventId?: string
  initialCount?: number
}

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

export function CommentSection({ contentType, contentId, eventId, initialCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [showAllModal, setShowAllModal] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const loadComments = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      
      // Fetch all data in parallel for better performance
      const [commentsResult, authorsResult, orgsResult] = await Promise.all([
        supabase
          .from('comments')
          .select('*')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .order('created_at', { ascending: true }),
        
        // Pre-fetch all potential authors
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url'),
        
        // Pre-fetch all potential organizations
        supabase
          .from('organizations')
          .select('id, name, avatar_url')
      ])

      if (commentsResult.error) throw commentsResult.error
      
      const commentsData = commentsResult.data || []

      // Build lookup maps
      const authorMap = new Map(
        (authorsResult.data || []).map(author => [
          author.id,
          {
            name: `${author.first_name || 'Unknown'} ${author.last_name || 'User'}`,
            avatarUrl: author.avatar_url
          }
        ])
      )

      const orgMap = new Map(
        (orgsResult.data || []).map(org => [
          org.id,
          { name: org.name, avatarUrl: org.avatar_url }
        ])
      )

      // Build comment tree in a single pass
      const commentMap = new Map<string, Comment>()
      const commentNameMap = new Map<string, string>()
      const topLevelComments: Comment[] = []

      // First pass: Create all comment objects
      commentsData.forEach((c: any) => {
        let displayName = 'Unknown User'
        let displayAvatar = null
        
        const isDeleted = c.is_deleted || c.content === '[Comment deleted]'
        
        if (!isDeleted) {
          if (c.posted_as_type === 'faith_admin') {
            displayName = 'FAITH Administration'
          } else if (c.posted_as_type === 'organization' && c.posted_as_org_id) {
            const orgData = orgMap.get(c.posted_as_org_id)
            displayName = orgData?.name || 'Organization'
            displayAvatar = orgData?.avatarUrl || null
          } else {
            const authorData = authorMap.get(c.author_id)
            displayName = authorData?.name || 'Unknown User'
            displayAvatar = authorData?.avatarUrl || null
          }
        }

        commentNameMap.set(c.id, displayName)

        const createdAtDate = new Date(c.created_at)

        const comment: Comment = {
          id: c.id,
          content: c.content,
          imageUrl: c.image_url,
          likes: c.likes || 0,
          reactionCount: c.reaction_count || 0,
          createdAt: createdAtDate.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          }),
          createdAtTimestamp: createdAtDate.getTime(),
          authorId: c.author_id,
          authorName: displayName,
          authorAvatar: displayAvatar,
          postedAsType: c.posted_as_type,
          postedAsOrgId: c.posted_as_org_id,
          parentCommentId: c.parent_comment_id,
          replies: [],
          replyingToName: null,
          isDeleted: isDeleted,
          mostRecentReplyTimestamp: createdAtDate.getTime()
        }

        commentMap.set(c.id, comment)
        
        if (!c.parent_comment_id) {
          topLevelComments.push(comment)
        }
      })

      // Second pass: Build tree structure
      commentMap.forEach(comment => {
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId)
          if (parent) {
            comment.replyingToName = commentNameMap.get(comment.parentCommentId) || 'Unknown'
            parent.replies.push(comment)
            
            // Update parent's most recent reply timestamp
            if (comment.createdAtTimestamp > parent.mostRecentReplyTimestamp!) {
              parent.mostRecentReplyTimestamp = comment.createdAtTimestamp
            }
          }
        }
      })

      // Sort replies by timestamp
      const sortReplies = (comment: Comment) => {
        if (comment.replies.length > 0) {
          comment.replies.sort((a, b) => a.createdAtTimestamp - b.createdAtTimestamp)
          comment.replies.forEach(sortReplies)
          
          // Update mostRecentReplyTimestamp to include nested replies
          const mostRecent = comment.replies.reduce((latest, current) => 
            (current.mostRecentReplyTimestamp || current.createdAtTimestamp) > 
            (latest.mostRecentReplyTimestamp || latest.createdAtTimestamp) ? current : latest
          )
          comment.mostRecentReplyTimestamp = mostRecent.mostRecentReplyTimestamp || mostRecent.createdAtTimestamp
        }
      }

      topLevelComments.forEach(sortReplies)

      setComments(topLevelComments)

    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [contentType, contentId])

  const handleCommentCreated = () => {
    setShowCommentBox(false)
    loadComments(true)
  }

  const getPreviewComments = useMemo(() => {
    if (comments.length === 0) return []
    
    const sortedComments = [...comments].sort((a, b) => {
      const aTime = a.mostRecentReplyTimestamp || a.createdAtTimestamp
      const bTime = b.mostRecentReplyTimestamp || b.createdAtTimestamp
      return bTime - aTime
    })
    
    const top3 = sortedComments.slice(0, 3)
    
    const preview = top3.map(comment => {
      const commentCopy = { ...comment }
      
      if (commentCopy.replies.length > 3) {
        const sortedReplies = [...commentCopy.replies].sort((a, b) => 
          b.createdAtTimestamp - a.createdAtTimestamp
        )
        commentCopy.replies = sortedReplies.slice(0, 3)
      }
      
      return commentCopy
    })
    
    return preview
  }, [comments])

  const totalCommentCount = useMemo(() => {
    let count = 0
    const countReplies = (comment: Comment) => {
      count++
      comment.replies.forEach(reply => countReplies(reply))
    }
    comments.forEach(comment => countReplies(comment))
    return count
  }, [comments])

  const previewComments = getPreviewComments
  const totalCount = totalCommentCount
  const hasMore = totalCount > previewComments.length || 
                  previewComments.some(c => c.replies.length < (comments.find(original => original.id === c.id)?.replies.length || 0))

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <MessageCircle className="h-4 w-4" />
            Comments ({totalCount})
            {refreshing && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            )}
          </h4>
          <button
            onClick={() => setShowCommentBox(!showCommentBox)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              showCommentBox
                ? 'bg-blue-100 text-blue-700'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            {showCommentBox ? 'Cancel' : 'Add Comment'}
          </button>
        </div>

        {showCommentBox && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <InlineCommentBox
              contentType={contentType}
              contentId={contentId}
              eventId={eventId}
              onCancel={() => setShowCommentBox(false)}
              onCommentCreated={handleCommentCreated}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : totalCount > 0 ? (
          <div className="space-y-4">
            {previewComments.map(comment => (
              <div key={comment.id} className="animate-in fade-in duration-300">
                <CommentItem 
                  comment={comment}
                  contentType={contentType}
                  contentId={contentId}
                  eventId={eventId}
                  onCommentCreated={() => loadComments(true)}
                  isInsideModal={false}
                />
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={() => setShowAllModal(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-dashed border-blue-200 hover:border-blue-300 rounded-xl text-blue-700 font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                View All {totalCount} Comments
              </button>
            )}
          </div>
        ) : null}
      </div>

      <AllCommentsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        comments={comments}
        totalCount={totalCount}
        contentType={contentType}
        contentId={contentId}
        eventId={eventId}
        onCommentCreated={() => loadComments(true)}
      />
    </>
  )
}