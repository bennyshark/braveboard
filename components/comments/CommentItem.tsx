// components/comments/CommentItem.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { 
  Reply, 
  Shield, 
  Users, 
  Clock, 
  CornerUpLeft, 
  ChevronDown, 
  ChevronUp,
  Trash2
} from "lucide-react"
import { CommentOptionsMenu } from "@/components/menus/CommentOptionsMenu"
import { InlineCommentBox } from "./InlineCommentBox"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"

type Comment = {
  id: string
  content: string
  imageUrl: string | null
  likes: number
  reactionCount?: number
  createdAt: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  postedAsType: 'user' | 'organization' | 'faith_admin'
  postedAsOrgId: string | null
  parentCommentId: string | null
  replies: Comment[]
  replyingToName?: string | null
  isDeleted?: boolean
}

interface CommentItemProps {
  comment: Comment
  contentType: 'post' | 'announcement' | 'bulletin' | 'free_wall_post' | 'repost'
  contentId: string
  eventId?: string
  onCommentCreated: () => void
  depth?: number
  isInsideModal?: boolean
}

export function CommentItem({ 
  comment, 
  contentType,
  contentId,
  eventId,
  onCommentCreated,
  depth = 0,
  isInsideModal = false
}: CommentItemProps) {
  const router = useRouter() // Initialize router
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [reactionCount, setReactionCount] = useState(comment.reactionCount || 0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const hasReplies = comment.replies.length > 0
  const isDeleted = comment.isDeleted || comment.content === '[Comment deleted]'
  
  const isFirstLevelReply = depth === 1

  const getIdentityIcon = (type: string) => {
    switch(type) {
      case 'faith_admin': return <Shield className="h-3 w-3 text-purple-600" />
      case 'organization': return <Users className="h-3 w-3 text-orange-600" />
      default: return null
    }
  }

  const getIdentityBadge = (type: string) => {
    if (isDeleted) return null
    
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

  // Handle navigation based on author type
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent bubbling
    e.preventDefault()

    if (isDeleted) return

    switch (comment.postedAsType) {
      case 'faith_admin':
        router.push('/faith-admin')
        break
      case 'organization':
        // Ensure we have an Org ID to navigate to
        if (comment.postedAsOrgId) {
          router.push(`/organization/${comment.postedAsOrgId}`)
        } else {
          // Fallback if ID is missing (though it shouldn't be)
          router.push('/organizations')
        }
        break
      case 'user':
      default:
        // Redirect to user profile
        router.push(`/user/${comment.authorId}`)
        break
    }
  }

  const handleReplyClick = () => {
    setShowReplyBox(!showReplyBox)
  }

  const handleReplyCreated = () => {
    setShowReplyBox(false)
    onCommentCreated()
  }

  const handleReactionChange = () => {
    onCommentCreated()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleJumpToParent = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!comment.parentCommentId) return

    const selector = isInsideModal 
      ? `.all-comments-modal #comment-${comment.parentCommentId}`
      : `#comment-${comment.parentCommentId}`
    
    const parentElement = document.querySelector(selector) as HTMLElement
    
    if (parentElement) {
      const scrollContainer = isInsideModal
        ? document.querySelector('.all-comments-modal .overflow-y-auto')
        : window
      
      if (isInsideModal && scrollContainer) {
        const container = scrollContainer as HTMLElement
        const containerTop = container.getBoundingClientRect().top
        const elementTop = parentElement.getBoundingClientRect().top
        const offset = elementTop - containerTop + container.scrollTop - 80
        
        container.scrollTo({ top: offset, behavior: 'smooth' })
      } else {
        parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      const card = parentElement.querySelector('.comment-card') as HTMLElement
      
      if (card) {
        card.classList.remove('border-gray-200')
        card.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50', 'border-blue-400')
        
        setTimeout(() => {
          card.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50', 'border-blue-400')
          card.classList.add('border-gray-200')
        }, 2000)
      }
    }
  }

  return (
    <div 
      id={`comment-${comment.id}`}
      className={`${isFirstLevelReply ? 'ml-8 border-l-2 border-blue-100 pl-4' : ''} transition-all duration-300`}
    >
      <div className={`comment-card rounded-xl p-3 border transition-all duration-300 ${
        isDeleted ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start gap-2 mb-2">
          {/* Avatar Section */}
          <div 
            onClick={handleAuthorClick}
            className={`flex-shrink-0 ${!isDeleted ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            {isDeleted ? (
              <div className="h-7 w-7 rounded-lg bg-gray-300 flex items-center justify-center">
                <Trash2 className="h-3 w-3 text-gray-500" />
              </div>
            ) : comment.authorAvatar ? (
              <img 
                src={comment.authorAvatar}
                alt={comment.authorName}
                className="h-7 w-7 rounded-lg object-cover"
              />
            ) : (
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(comment.postedAsType)} flex items-center justify-center`}>
                {comment.postedAsType !== 'user' ? (
                  getIdentityIcon(comment.postedAsType)
                ) : (
                  <span className="text-white font-bold text-xs">{getInitials(comment.authorName)}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Author Name Section */}
                <span 
                  onClick={handleAuthorClick}
                  className={`font-bold text-sm ${
                    isDeleted 
                      ? 'text-gray-500 italic' 
                      : 'text-gray-900 cursor-pointer hover:underline hover:text-blue-600 transition-colors'
                  }`}
                >
                  {isDeleted ? 'Deleted User' : comment.authorName}
                </span>
                
                {!isDeleted && getIdentityBadge(comment.postedAsType)}
                
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {comment.createdAt}
                </span>
              </div>
              
              {!isDeleted && (
                <CommentOptionsMenu
                  commentId={comment.id}
                  authorId={comment.authorId}
                  hasReplies={hasReplies}
                  onUpdate={onCommentCreated}
                />
              )}
            </div>
            
            {comment.replyingToName && (
              <button 
                onClick={handleJumpToParent}
                className="group flex items-center gap-1.5 text-xs mb-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-2 py-1 rounded-md transition-all shadow-sm w-fit"
                title="Scroll to parent comment"
              >
                <CornerUpLeft className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
                  Replying to <span className="font-bold text-gray-700 group-hover:text-blue-700">
                    {comment.replyingToName === '[Comment deleted]' ? 'Deleted Comment' : comment.replyingToName}
                  </span>
                </span>
              </button>
            )}
            
            <p className={`text-sm leading-relaxed mb-2 ${
              isDeleted ? 'text-gray-500 italic' : 'text-gray-800'
            }`}>
              {comment.content}
            </p>
            
            {!isDeleted && comment.imageUrl && (
              <img 
                src={comment.imageUrl} 
                alt="Comment attachment" 
                className="rounded-lg max-w-[240px] w-full mt-2 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(comment.imageUrl!, '_blank')}
              />
            )}
            
            {!isDeleted && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <ReactionButton 
                    contentType="comment"
                    contentId={comment.id}
                    onReactionChange={handleReactionChange}
                  />
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
                  
                  {hasReplies && (
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-bold"
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

                <ReactionSummary 
                  contentType="comment"
                  contentId={comment.id}
                  totalCount={reactionCount}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!isDeleted && showReplyBox && (
        <div className={`mt-3 ${depth === 0 ? 'ml-8' : ''} animate-in slide-in-from-top-2 duration-200`}>
          <InlineCommentBox
            contentType={contentType}
            contentId={contentId}
            eventId={eventId}
            parentCommentId={comment.id}
            replyingTo={comment.authorName}
            onCancel={() => setShowReplyBox(false)}
            onCommentCreated={handleReplyCreated}
          />
        </div>
      )}
      
      {hasReplies && !isCollapsed && (
        <div className="space-y-3 mt-3">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              eventId={eventId}
              onCommentCreated={onCommentCreated}
              depth={depth + 1}
              isInsideModal={isInsideModal}
            />
          ))}
        </div>
      )}
    </div>
  )
}