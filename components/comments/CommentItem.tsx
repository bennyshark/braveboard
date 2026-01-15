// components/comments/CommentItem.tsx
"use client"
import { useState } from "react"
import { ThumbsUp, Reply, Shield, Users, Clock, MoreVertical, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react"
import { InlineCommentBox } from "./InlineCommentBox"

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

interface CommentItemProps {
  comment: Comment
  postId: string
  eventId: string
  onCommentCreated: () => void
  isReply?: boolean
  isInModal?: boolean
}

export function CommentItem({ 
  comment, 
  postId,
  eventId,
  onCommentCreated,
  isReply = false, 
  isInModal = false 
}: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const hasReplies = comment.replies.length > 0

  const getIdentityIcon = (type: string) => {
    switch(type) {
      case 'faith_admin': return <Shield className="h-3 w-3 text-purple-600" />
      case 'organization': return <Users className="h-3 w-3 text-orange-600" />
      default: return null
    }
  }

  const getIdentityBadge = (type: string) => {
    switch(type) {
      case 'faith_admin': 
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        )
      case 'organization':
        return (
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
            <Users className="h-3 w-3" />
            Org
          </span>
        )
      default: return null
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarGradient = (type: string) => {
    switch(type) {
      case 'faith_admin': return 'from-purple-400 to-purple-600'
      case 'organization': return 'from-orange-400 to-orange-600'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const handleReplyClick = () => {
    setShowReplyBox(!showReplyBox)
  }

  const handleReplyCreated = () => {
    setShowReplyBox(false)
    onCommentCreated()
  }

  return (
    <div className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <div className="flex items-start gap-2 mb-2">
          {/* Avatar */}
          {comment.authorAvatar ? (
            <img 
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="h-7 w-7 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(comment.postedAsType)} flex items-center justify-center flex-shrink-0`}>
              {comment.postedAsType !== 'user' ? (
                getIdentityIcon(comment.postedAsType)
              ) : (
                <span className="text-white font-bold text-xs">{getInitials(comment.authorName)}</span>
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{comment.authorName}</span>
                {getIdentityBadge(comment.postedAsType)}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {comment.createdAt}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            
            {/* Reply Thread Indicator */}
            {comment.replyingToName && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 bg-blue-50 px-2 py-1 rounded-md inline-flex">
                <CornerDownRight className="h-3 w-3" />
                <span>Replying to <span className="font-bold text-blue-700">{comment.replyingToName}</span></span>
              </div>
            )}
            
            <p className="text-gray-800 text-sm leading-relaxed mb-2">{comment.content}</p>
            
            {/* Image - Smaller size */}
            {comment.imageUrl && (
              <img 
                src={comment.imageUrl} 
                alt="Comment attachment" 
                className="rounded-lg max-w-[240px] w-full mt-2 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(comment.imageUrl!, '_blank')}
              />
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <button className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold">
                <ThumbsUp className="h-3 w-3" />
                {comment.likes}
              </button>
              <button 
                onClick={handleReplyClick}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs font-bold ${
                  showReplyBox 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
              
              {/* Collapse/Expand button for replies */}
              {hasReplies && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-bold ml-auto"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Reply Box */}
      {showReplyBox && (
        <div className="mt-3 ml-8">
          <InlineCommentBox
            postId={postId}
            eventId={eventId}
            parentCommentId={comment.id}
            replyingTo={comment.authorName}
            onCancel={() => setShowReplyBox(false)}
            onCommentCreated={handleReplyCreated}
          />
        </div>
      )}
      
      {/* Nested Replies - Collapsible */}
      {hasReplies && !isCollapsed && (
        <div className="space-y-3 mt-3">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply}
              postId={postId}
              eventId={eventId}
              onCommentCreated={onCommentCreated}
              isReply={true} 
              isInModal={isInModal}
            />
          ))}
        </div>
      )}
    </div>
  )
}