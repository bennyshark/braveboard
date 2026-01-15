// components/comments/CommentItem.tsx
"use client"
import { ThumbsUp, Reply, Shield, Users, Clock, MoreVertical, CornerDownRight } from "lucide-react"

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
  onReply: (commentId: string, authorName: string) => void
  isReply?: boolean
  isInModal?: boolean
}

export function CommentItem({ comment, onReply, isReply = false, isInModal = false }: CommentItemProps) {
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
                onClick={() => onReply(comment.id, comment.authorName)}
                className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-bold"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nested Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply}
              isReply={true} 
              isInModal={isInModal}
            />
          ))}
        </div>
      )}
    </div>
  )
}