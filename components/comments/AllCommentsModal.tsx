// components/comments/AllCommentsModal.tsx
"use client"
import { X } from "lucide-react"
import { CommentItem } from "./CommentItem"

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

interface AllCommentsModalProps {
  isOpen: boolean
  onClose: () => void
  comments: Comment[]
  totalCount: number
  contentType: 'post' | 'announcement' | 'bulletin' | 'free_wall_post' | 'repost'
  contentId: string
  eventId?: string
  onCommentCreated: () => void
}

export function AllCommentsModal({
  isOpen,
  onClose,
  comments,
  totalCount,
  contentType,
  contentId,
  eventId,
  onCommentCreated
}: AllCommentsModalProps) {
  if (!isOpen) return null

  // Sort comments by most recent activity
  const sortedComments = [...comments].sort((a, b) => {
    const aTime = a.mostRecentReplyTimestamp || a.createdAtTimestamp
    const bTime = b.mostRecentReplyTimestamp || b.createdAtTimestamp
    return bTime - aTime
  })

  return (
    <div 
      className="all-comments-modal fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h3 className="text-2xl font-black text-gray-900">All Comments</h3>
            <p className="text-sm text-gray-600 mt-1">{totalCount} total comments</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-6 space-y-4">
          {sortedComments.map(comment => (
            <div key={comment.id} className="animate-in fade-in duration-300">
              <CommentItem 
                comment={comment}
                contentType={contentType}
                contentId={contentId}
                eventId={eventId}
                onCommentCreated={onCommentCreated}
                isInsideModal={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}