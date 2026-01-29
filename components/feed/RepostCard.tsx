// components/feed/RepostCard.tsx - OPTIMIZED: Direct state update on delete
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Repeat2, MessageCircle, ChevronDown, ChevronUp, Clock, Shield, Users } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { RepostOptionsMenu } from "@/components/menus/RepostOptionsMenu"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { RepostButton } from "@/components/reposts/RepostButton"
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay"

type OriginalContent = {
  type: 'free_wall_post' | 'post' | 'bulletin' | 'announcement' | 'repost'
  id: string
  content?: string
  header?: string
  body?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string | null
  authorType?: string
  creatorName?: string
  creatorAvatar?: string | null
  creatorType?: string
  imageUrls?: string[]
  imageUrl?: string | null
  createdAt: string
  comment?: string
  reposterId?: string
  reposterName?: string
  reposterAvatar?: string | null
  contentType?: string
  contentId?: string
  originalContent?: any
}

type Repost = {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  contentType: 'post' | 'bulletin' | 'announcement' | 'free_wall_post' | 'repost'
  contentId: string
  repostComment: string | null
  createdAt: string
  editedAt?: string | null
  reactionCount?: number
  comments?: number
  repostCount?: number
}

interface RepostCardProps {
  repost: Repost
  originalContent?: OriginalContent | null
  onDelete?: (repostId: string) => void
  onNavigateToContent?: (tab: string, contentId: string) => void
  onRepostCreated?: (repost: any) => void
}

export function RepostCard({ repost, originalContent: propOriginalContent, onDelete, onNavigateToContent, onRepostCreated }: RepostCardProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [originalContent, setOriginalContent] = useState<OriginalContent | null>(propOriginalContent || null)
  const [showComments, setShowComments] = useState(false)
  const [reactionCount, setReactionCount] = useState(repost.reactionCount || 0)
  const [commentCount, setCommentCount] = useState(repost.comments || 0)
  const [repostCount, setRepostCount] = useState(repost.repostCount || 0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [canEditTags, setCanEditTags] = useState(false)

  useEffect(() => {
    loadRepostData()
  }, [repost.id])

  useEffect(() => {
    if (propOriginalContent) {
      setOriginalContent(propOriginalContent)
    }
  }, [propOriginalContent])

  const loadRepostData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: repostData } = await supabase
        .from('reposts')
        .select('*')
        .eq('id', repost.id)
        .maybeSingle()

      if (repostData) {
        setReactionCount(repostData.reaction_count || 0)
        setCommentCount(repostData.comments || 0)
        setRepostCount(repostData.repost_count || 0)
        setCanEditTags(user?.id === repostData.user_id)
      }
    } catch (error) {
      console.error('Error loading repost data:', error)
    }
  }

  const handleReactionChange = () => {
    loadRepostData()
    setRefreshTrigger(prev => prev + 1)
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getCreatorColor = (type: string) => {
    switch(type) {
      case "faith": return "from-purple-400 to-purple-600"
      case "faith_admin": return "from-purple-400 to-purple-600"
      case "organization": return "from-orange-400 to-orange-600"
      default: return "from-blue-400 to-blue-600"
    }
  }

  const getCreatorIcon = (type: string) => {
    switch(type) {
      case "faith": return <Shield className="h-4 w-4 text-white" />
      case "faith_admin": return <Shield className="h-4 w-4 text-white" />
      case "organization": return <Users className="h-4 w-4 text-white" />
      default: return null
    }
  }

  const handleOriginalContentClick = () => {
    if (!originalContent || !onNavigateToContent) return
    
    if (originalContent.type === 'free_wall_post') {
      onNavigateToContent('free_wall', originalContent.id)
    } else if (originalContent.type === 'post') {
      onNavigateToContent('events', originalContent.id)
    } else if (originalContent.type === 'bulletin') {
      onNavigateToContent('bulletin', originalContent.id)
    } else if (originalContent.type === 'announcement') {
      onNavigateToContent('announcements', originalContent.id)
    } else if (originalContent.type === 'repost') {
      onNavigateToContent('free_wall', originalContent.id)
    }
  }

  const renderImageGrid = (images: string[]) => {
    if (!images || images.length === 0) return null

    const count = images.length

    if (count === 1) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={images[0]} 
            alt="" 
            className="w-full h-full object-cover" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={url} 
                alt="" 
                className="w-full h-full object-cover" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )
    }

    if (count === 3) {
      return (
        <div className="space-y-2">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={images[0]} 
              alt="" 
              className="w-full h-full object-cover" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {images.slice(1, 3).map((url, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={url} 
              alt="" 
              className="w-full h-full object-cover" 
              onClick={(e) => e.stopPropagation()}
            />
            {idx === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{count - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-6">
        {/* Repost Header */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={() => router.push(`/user/${repost.userId}`)}
            className="cursor-pointer"
          >
            {repost.userAvatar ? (
              <img 
                src={repost.userAvatar} 
                alt={repost.userName}
                className="h-12 w-12 rounded-xl object-cover flex-shrink-0 shadow-sm hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-lg">{getInitials(repost.userName)}</span>
              </div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/user/${repost.userId}`)}
                    className="font-bold text-gray-900 hover:underline"
                  >
                    {repost.userName}
                  </button>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    <Repeat2 className="h-3 w-3" />
                    Reposted
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{repost.createdAt}</span>
                  {repost.editedAt && (
                    <>
                      <span>•</span>
                      <span className="italic">Edited</span>
                    </>
                  )}
                </div>
              </div>

              <RepostOptionsMenu
                repostId={repost.id}
                userId={repost.userId}
                comment={repost.repostComment || ''}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>

        {/* Tagged Users */}
        <div className="mb-3">
          <TaggedUsersDisplay
            contentType="repost"
            contentId={repost.id}
            canEdit={canEditTags}
            onTagsUpdated={loadRepostData}
          />
        </div>

        {/* Repost Comment */}
        {repost.repostComment && (
          <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
            {repost.repostComment}
          </p>
        )}

        {/* Original Content */}
        {originalContent ? (
          <div 
            onClick={handleOriginalContentClick}
            className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Repeat2 className="h-3 w-3" />
              <span className="font-medium">Original {originalContent.type.replace('_', ' ')}</span>
            </div>
            
            {/* FREE WALL POST or POST */}
            {(originalContent.type === 'free_wall_post' || originalContent.type === 'post') && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (originalContent.authorId) {
                        router.push(`/user/${originalContent.authorId}`)
                      }
                    }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {originalContent.authorAvatar ? (
                      <img 
                        src={originalContent.authorAvatar} 
                        alt={originalContent.authorName}
                        className="h-10 w-10 rounded-lg object-cover shadow-sm" 
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getCreatorColor(originalContent.authorType || 'user')} flex items-center justify-center shadow-sm`}>
                        {originalContent.authorType && originalContent.authorType !== 'user' ? (
                          getCreatorIcon(originalContent.authorType)
                        ) : (
                          <span className="text-white font-bold text-sm">{getInitials(originalContent.authorName || 'U')}</span>
                        )}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">{originalContent.authorName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{originalContent.createdAt}</span>
                      </div>
                    </div>
                  </button>
                </div>
                
                <p className="text-gray-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{originalContent.content}</p>
                
                {originalContent.imageUrls && originalContent.imageUrls.length > 0 && (
                  <div className="mt-3">
                    {renderImageGrid(originalContent.imageUrls)}
                  </div>
                )}
              </div>
            )}

            {/* BULLETIN or ANNOUNCEMENT */}
            {(originalContent.type === 'bulletin' || originalContent.type === 'announcement') && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {originalContent.creatorAvatar ? (
                    <img 
                      src={originalContent.creatorAvatar} 
                      alt={originalContent.creatorName}
                      className="h-10 w-10 rounded-lg object-cover shadow-sm" 
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getCreatorColor(originalContent.creatorType || 'user')} flex items-center justify-center shadow-sm`}>
                      {originalContent.creatorType && originalContent.creatorType !== 'user' ? (
                        getCreatorIcon(originalContent.creatorType)
                      ) : (
                        <span className="text-white font-bold text-sm">{getInitials(originalContent.creatorName || 'U')}</span>
                      )}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">{originalContent.creatorName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{originalContent.createdAt}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 mb-2 text-base">{originalContent.header}</h4>
                <p className="text-gray-700 text-sm leading-relaxed mb-2">{originalContent.body}</p>
                
                {originalContent.imageUrls && originalContent.imageUrls.length > 0 && (
                  <div className="mt-3">
                    {renderImageGrid(originalContent.imageUrls)}
                  </div>
                )}
                
                {originalContent.imageUrl && (
                  <div className="mt-3">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={originalContent.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NESTED REPOST */}
            {originalContent.type === 'repost' && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (originalContent.reposterId) {
                        router.push(`/user/${originalContent.reposterId}`)
                      }
                    }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {originalContent.reposterAvatar ? (
                      <img 
                        src={originalContent.reposterAvatar} 
                        alt={originalContent.reposterName}
                        className="h-10 w-10 rounded-lg object-cover shadow-sm" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">{getInitials(originalContent.reposterName || 'U')}</span>
                      </div>
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{originalContent.reposterName}</p>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
                          <Repeat2 className="h-2.5 w-2.5" />
                          Reposted
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{originalContent.createdAt}</span>
                      </div>
                    </div>
                  </button>
                </div>
                
                {originalContent.comment && (
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{originalContent.comment}</p>
                )}

                {/* Nested original content preview */}
                {originalContent.originalContent && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-300 mt-3">
                    <div className="text-xs text-gray-500 mb-2">
                      <Repeat2 className="h-3 w-3 inline mr-1" />
                      Original {originalContent.originalContent.type?.replace('_', ' ')}
                    </div>
                    <p className="text-gray-600 text-sm italic">
                      {originalContent.originalContent.content || originalContent.originalContent.header || 'Content preview unavailable'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
            <p className="text-gray-500 text-sm italic">Original content unavailable</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <ReactionButton 
              contentType="repost"
              contentId={repost.id}
              onReactionChange={handleReactionChange}
            />
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                showComments 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{commentCount}</span>
              {showComments ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            <RepostButton
              contentType="repost"
              contentId={repost.id}
              onRepostChange={handleReactionChange}
              onRepostCreated={onRepostCreated}
            />
          </div>

          <div className="flex items-center gap-2">
            {repostCount > 0 && (
              <span className="text-xs text-gray-500">{repostCount} reposts</span>
            )}
            <ReactionSummary 
              contentType="repost"
              contentId={repost.id}
              totalCount={reactionCount}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <CommentSection 
            contentType="repost"
            contentId={repost.id}
            initialCount={commentCount}
          />
        </div>
      )}
    </div>
  )
}