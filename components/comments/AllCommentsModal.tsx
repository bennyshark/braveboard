// components/comments/AllCommentsModal.tsx
"use client"

import { X } from "lucide-react"
import { CommentItem } from "./CommentItem"
import { InlineCommentBox } from "./InlineCommentBox"
import { useState, useMemo } from "react"

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
  avatarCache?: {
    faithAdmin: string | null
    organizations: Map<string, string | null>
  }
}

export function AllCommentsModal({ 
  isOpen, 
  onClose, 
  comments, 
  totalCount,
  contentType,
  contentId,
  eventId,
  onCommentCreated,
  avatarCache
}: AllCommentsModalProps) {
  const [showCommentBox, setShowCommentBox] = useState(false)
  
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const aTime = a.mostRecentReplyTimestamp || a.createdAtTimestamp
      const bTime = b.mostRecentReplyTimestamp || b.createdAtTimestamp
      return bTime - aTime
    })
  }, [comments])

  const handleCommentCreated = () => {
    setShowCommentBox(false)
    onCommentCreated()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 all-comments-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            All Comments ({totalCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comment Box */}
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowCommentBox(!showCommentBox)}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
              showCommentBox
                ? 'bg-blue-100 text-blue-700'
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            {showCommentBox ? 'Cancel' : 'Add Comment'}
          </button>

          {showCommentBox && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <InlineCommentBox
                contentType={contentType}
                contentId={contentId}
                eventId={eventId}
                onCancel={() => setShowCommentBox(false)}
                onCommentCreated={handleCommentCreated}
              />
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sortedComments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              eventId={eventId}
              onCommentCreated={onCommentCreated}
              isInsideModal={true}
              avatarCache={avatarCache}
            />
          ))}
        </div>
      </div>
    </div>
  )
}