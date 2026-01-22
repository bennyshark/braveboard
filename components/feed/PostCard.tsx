// components/feed/PostCard.tsx - Complete with TaggedUsersDisplay
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Share2, Clock, Image, Shield, Users, ChevronDown, ChevronUp, Pin } from "lucide-react"
import { PostOptionsMenu } from "@/components/menus/PostOptionsMenu"
import { Post } from "@/app/(site)/home/types"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { RepostButton } from "@/components/reposts/RepostButton"
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay"
import { createBrowserClient } from "@supabase/ssr"

interface PostCardProps {
  post: Post
  eventId?: string
  onPostDeleted?: () => void
  onPostUpdated?: () => void
}

type PostIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  name: string
  avatarUrl: string | null
}

export function PostCard({ post, eventId, onPostDeleted, onPostUpdated }: PostCardProps) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(true)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [reactionCount, setReactionCount] = useState(0)
  const [repostCount, setRepostCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [displayIdentity, setDisplayIdentity] = useState<PostIdentity>({
    type: 'user',
    name: post.author,
    avatarUrl: post.avatarUrl
  })
  const [loading, setLoading] = useState(true)
  const [postEventId, setPostEventId] = useState<string | null>(eventId || null)
  const [editedAt, setEditedAt] = useState<string | null>(null)
  const [pinOrder, setPinOrder] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canEditTags, setCanEditTags] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const loadPostData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data: postData } = await supabase
        .from('posts')
        .select('posted_as_type, posted_as_org_id, event_id, comments, edited_at, pin_order, reaction_count, repost_count, author_id')
        .eq('id', post.id)
        .single()

      if (!postData) {
        setLoading(false)
        return
      }

      setCanEditTags(user?.id === postData.author_id)

      if (!eventId && postData.event_id) {
        setPostEventId(postData.event_id)
      }

      setCommentCount(postData.comments || 0)
      setReactionCount(postData.reaction_count || 0)
      setRepostCount(postData.repost_count || 0)
      setEditedAt(postData.edited_at)
      setPinOrder(postData.pin_order)

      if (postData.posted_as_type === 'user') {
        setDisplayIdentity({
          type: 'user',
          name: post.author,
          avatarUrl: post.avatarUrl
        })
      }
      else if (postData.posted_as_type === 'faith_admin') {
        setDisplayIdentity({
          type: 'faith_admin',
          name: 'FAITH Administration',
          avatarUrl: null
        })
      }
      else if (postData.posted_as_type === 'organization' && postData.posted_as_org_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, avatar_url')
          .eq('id', postData.posted_as_org_id)
          .single()

        if (orgData) {
          setDisplayIdentity({
            type: 'organization',
            name: orgData.name,
            avatarUrl: orgData.avatar_url || null
          })
        }
      }
    } catch (error) {
      console.error('Error fetching post data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPostData()
  }, [post.id, supabase])

  const handlePostUpdate = () => {
    loadPostData()
    if (onPostUpdated) onPostUpdated()
  }

  const handleReactionChange = () => {
    loadPostData()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`)
  }

  const getAuthorColor = (type: string) => {
    switch(type) {
      case "faith_admin": return "from-purple-400 to-purple-600"
      case "organization": return "from-orange-400 to-orange-600"
      default: return "from-blue-400 to-blue-600"
    }
  }

  const getIdentityIcon = (type: string) => {
    switch(type) {
      case "faith_admin": return <Shield className="h-4 w-4 text-white" />
      case "organization": return <Users className="h-4 w-4 text-white" />
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

  const handleImageClick = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-300 p-4 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-300 overflow-hidden hover:border-gray-400 transition-all duration-200">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <button
              onClick={() => displayIdentity.type === 'user' && handleUserClick(post.authorId)}
              disabled={displayIdentity.type !== 'user'}
              className={displayIdentity.type === 'user' ? 'cursor-pointer' : 'cursor-default'}
            >
              {displayIdentity.avatarUrl ? (
                <img 
                  src={displayIdentity.avatarUrl} 
                  alt={displayIdentity.name}
                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0 shadow-sm hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getAuthorColor(displayIdentity.type)} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                  {displayIdentity.type !== 'user' ? (
                    getIdentityIcon(displayIdentity.type)
                  ) : (
                    <span className="text-white font-bold text-xs">{getInitials(displayIdentity.name)}</span>
                  )}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => displayIdentity.type === 'user' && handleUserClick(post.authorId)}
                      disabled={displayIdentity.type !== 'user'}
                      className={`font-bold text-gray-900 ${displayIdentity.type === 'user' ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                    >
                      {displayIdentity.name}
                    </button>
                    {displayIdentity.type === 'faith_admin' && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    {displayIdentity.type === 'organization' && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Users className="h-3 w-3" />
                        Org
                      </span>
                    )}
                    {pinOrder && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned {pinOrder === 1 ? '1st' : pinOrder === 2 ? '2nd' : '3rd'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{post.time}</span>
                    {editedAt && (
                      <>
                        <span>•</span>
                        <span className="text-gray-400 italic">
                          Edited {new Date(editedAt).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </>
                    )}
                    {post.imageUrls.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          {post.imageUrls.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {postEventId && (
                  <PostOptionsMenu
                    postId={post.id}
                    eventId={postEventId}
                    authorId={post.authorId}
                    currentPinOrder={pinOrder}
                    content={post.content}
                    onUpdate={handlePostUpdate}
                    onDelete={onPostDeleted}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Tagged Users - New Component */}
          <div className="mb-3">
            <TaggedUsersDisplay
              contentType="post"
              contentId={post.id}
              canEdit={canEditTags}
              onTagsUpdated={handlePostUpdate}
            />
          </div>

          {/* Content */}
          <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

          {/* Images Grid */}
          {post.imageUrls.length > 0 && (
            <div className={`mb-3 ${
              post.imageUrls.length === 1 ? 'grid grid-cols-1' :
              post.imageUrls.length === 2 ? 'grid grid-cols-2 gap-2' :
              'grid grid-cols-2 gap-2'
            }`}>
              {post.imageUrls.slice(0, 4).map((url, idx) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group ${
                    post.imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
                  onClick={() => handleImageClick(idx)}
                >
                  <img 
                    src={url} 
                    alt="Post" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {idx === 3 && post.imageUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{post.imageUrls.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <ReactionButton 
                contentType="post"
                contentId={post.id}
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
                contentType="post"
                contentId={post.id}
                onRepostChange={handleReactionChange}
              />
              <button className="p-1.5 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              {repostCount > 0 && (
                <span className="text-xs text-gray-500">{repostCount} reposts</span>
              )}
              <ReactionSummary 
                contentType="post"
                contentId={post.id}
                totalCount={reactionCount}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>

        {/* Comment Section */}
        {showComments && postEventId && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 animate-in slide-in-from-top-2 duration-200">
            <CommentSection 
              contentType="post"
              contentId={post.id} 
              eventId={postEventId}
              initialCount={commentCount}
            />
          </div>
        )}
      </div>

      <ImagePreviewModal
        images={post.imageUrls}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}