// components/comments/CommentSection.tsx
"use client"
import { useState, useEffect } from "react"
import { MessageCircle, Loader2, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { CreateCommentDialog } from "./CreateCommentDialog"
import { CommentItem } from "./CommentItem"
import { AllCommentsModal } from "./AllCommentsModal"

interface CommentSectionProps {
  postId: string
  eventId: string
  initialCount?: number
}

type Comment = {
  id: string
  content: string
  imageUrl: string | null
  likes: number
  createdAt: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  postedAsType: 'user' | 'organization' | 'faith_admin'
  postedAsOrgId: string | null
  parentCommentId: string | null
  replies: Comment[]
  replyingToName?: string | null
}

export function CommentSection({ postId, eventId, initialCount = 0 }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateCommentOpen, setIsCreateCommentOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const authorIds = [...new Set(commentsData.map((c: any) => c.author_id))]
      
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      const authorMap = new Map(
        authorsData?.map(author => [
          author.id,
          {
            name: `${author.first_name || 'Unknown'} ${author.last_name || 'User'}`,
            avatarUrl: author.avatar_url
          }
        ]) || []
      )

      const orgIds = [...new Set(
        commentsData
          .filter((c: any) => c.posted_as_type === 'organization' && c.posted_as_org_id)
          .map((c: any) => c.posted_as_org_id)
      )]
      
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, avatar_url')
        .in('id', orgIds)

      const orgMap = new Map(
        orgsData?.map(org => [
          org.id,
          { name: org.name, avatarUrl: org.avatar_url }
        ]) || []
      )

      // Create a map to easily find parent comment names
      const commentNameMap = new Map<string, string>()

      const mappedComments: Comment[] = commentsData.map((c: any) => {
        let displayName = 'Unknown User'
        let displayAvatar = null
        
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

        // Store in map for later lookup
        commentNameMap.set(c.id, displayName)

        return {
          id: c.id,
          content: c.content,
          imageUrl: c.image_url,
          likes: c.likes || 0,
          createdAt: new Date(c.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          }),
          authorId: c.author_id,
          authorName: displayName,
          authorAvatar: displayAvatar,
          postedAsType: c.posted_as_type,
          postedAsOrgId: c.posted_as_org_id,
          parentCommentId: c.parent_comment_id,
          replies: [],
          replyingToName: null
        }
      })

      // Build the reply tree and add "replying to" names
      const topLevelComments = mappedComments.filter(c => !c.parentCommentId)
      const repliesMap = new Map<string, Comment[]>()
      
      mappedComments.forEach(comment => {
        if (comment.parentCommentId) {
          // Set the "replying to" name
          comment.replyingToName = commentNameMap.get(comment.parentCommentId) || 'Unknown'
          
          if (!repliesMap.has(comment.parentCommentId)) {
            repliesMap.set(comment.parentCommentId, [])
          }
          repliesMap.get(comment.parentCommentId)!.push(comment)
        }
      })

      // Recursively attach replies
      const attachReplies = (comment: Comment) => {
        const replies = repliesMap.get(comment.id) || []
        comment.replies = replies
        replies.forEach(reply => attachReplies(reply))
      }

      topLevelComments.forEach(comment => attachReplies(comment))

      setComments(topLevelComments)

    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [postId])

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName })
    setIsCreateCommentOpen(true)
  }

  const handleCloseDialog = () => {
    setIsCreateCommentOpen(false)
    setReplyingTo(null)
  }

  // Smart preview logic
  const getPreviewComments = () => {
    if (comments.length === 0) return []
    
    const preview: Comment[] = []
    
    // 1. Get most recent comment with up to 3 of its most recent replies
    const mostRecentComment = { ...comments[comments.length - 1] }
    if (mostRecentComment.replies.length > 0) {
      // Show only the 3 most recent replies
      const recentReplies = mostRecentComment.replies.slice(-3)
      mostRecentComment.replies = recentReplies
    }
    preview.push(mostRecentComment)
    
    // 2. Get 2 more most recent comments (without their full reply chains for brevity)
    if (comments.length > 1) {
      const secondRecent = { ...comments[comments.length - 2] }
      // Don't show nested replies in preview for these
      secondRecent.replies = []
      preview.unshift(secondRecent)
    }
    
    if (comments.length > 2) {
      const thirdRecent = { ...comments[comments.length - 3] }
      thirdRecent.replies = []
      preview.unshift(thirdRecent)
    }
    
    return preview.reverse() // Show in chronological order
  }

  const totalCommentCount = () => {
    let count = 0
    const countReplies = (comment: Comment) => {
      count++
      comment.replies.forEach(reply => countReplies(reply))
    }
    comments.forEach(comment => countReplies(comment))
    return count
  }

  const previewComments = getPreviewComments()
  const totalCount = totalCommentCount()
  const hasMore = totalCount > previewComments.length

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <MessageCircle className="h-4 w-4" />
            Comments ({totalCount})
          </h4>
          <button
            onClick={() => setIsCreateCommentOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Add Comment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : totalCount > 0 ? (
          <div className="space-y-4">
            {previewComments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReply={handleReply}
              />
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
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      <CreateCommentDialog
        isOpen={isCreateCommentOpen}
        onClose={handleCloseDialog}
        postId={postId}
        eventId={eventId}
        parentCommentId={replyingTo?.id || null}
        replyingTo={replyingTo?.name || null}
        onCommentCreated={loadComments}
      />

      <AllCommentsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        comments={comments}
        totalCount={totalCount}
        onReply={handleReply}
      />
    </>
  )
}