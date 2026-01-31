// components/feed/PostCard.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MessageCircle, Share2, Clock, Image, Shield, Users, ChevronDown, ChevronUp, Pin } from "lucide-react"
import { PostOptionsMenu } from "@/components/menus/PostOptionsMenu"
import { Post } from "@/app/(site)/home/types"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { SingleImageDisplay } from "./SingleImageDisplay"
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
  onRepostCreated?: (repost: any) => void
  avatarCache?: {
    faithAdmin: string | null
    organizations: Map<string, string | null>
  }
}

type PostIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  name: string
  avatarUrl: string | null
  id: string | null
}

export function PostCard({ 
  post, 
  eventId, 
  onPostDeleted, 
  onPostUpdated, 
  onRepostCreated,
  avatarCache 
}: PostCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(false)
  
  const [commentCount, setCommentCount] = useState(post.comments)
  const [reactionCount, setReactionCount] = useState(post.reactionCount || 0)
  const [repostCount, setRepostCount] = useState(post.repostCount || 0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editedAt, setEditedAt] = useState<string | null>(post.editedAt || null)
  const [pinOrder, setPinOrder] = useState<number | null>(post.pinOrder || null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canEditTags, setCanEditTags] = useState(false)
  
  const [displayIdentity, setDisplayIdentity] = useState<PostIdentity>(() => {
    if (post.postedAsType === 'faith_admin') {
      return {
        type: 'faith_admin',
        name: 'FAITH Administration',
        avatarUrl: avatarCache?.faithAdmin || null,
        id: null
      }
    } else if (post.postedAsType === 'organization') {
      const orgAvatar = avatarCache?.organizations.get((post as any).postedAsOrgId) || post.avatarUrl || null
      return {
        type: 'organization',
        name: post.author,
        avatarUrl: orgAvatar,
        id: (post as any).postedAsOrgId || null
      }
    }
    return {
      type: 'user',
      name: post.author,
      avatarUrl: post.avatarUrl,
      id: post.authorId
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [postEventId, setPostEventId] = useState<string | null>(eventId || null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const isOnEventPage = pathname?.startsWith('/event/')

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

      // Handle identity based on posted_as_type with cached avatars
      if (postData.posted_as_type === 'user') {
        setDisplayIdentity({
          type: 'user',
          name: post.author,
          avatarUrl: post.avatarUrl,
          id: postData.author_id
        })
      }
      else if (postData.posted_as_type === 'faith_admin') {
        setDisplayIdentity({
          type: 'faith_admin',
          name: 'FAITH Administration',
          avatarUrl: avatarCache?.faithAdmin || null,
          id: null
        })
      }
      else if (postData.posted_as_type === 'organization' && postData.posted_as_org_id) {
        // Use cached avatar instead of fetching
        const orgAvatar = avatarCache?.organizations.get(postData.posted_as_org_id) || null
        
        // Only fetch name, not avatar
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', postData.posted_as_org_id)
          .single()

        if (orgData) {
          setDisplayIdentity({
            type: 'organization',
            name: orgData.name,
            avatarUrl: orgAvatar,
            id: postData.posted_as_org_id
          })
        } else {
          setDisplayIdentity(prev => ({
            ...prev,
            avatarUrl: orgAvatar,
            id: postData.posted_as_org_id
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching post data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const needsFetch = !post.postedAsType || !eventId || 
                       (post.postedAsType === 'organization' && !displayIdentity.id)
    
    if (needsFetch) {
      setLoading(true)
      loadPostData()
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUserId(user?.id || null)
        setCanEditTags(user?.id === post.authorId)
      })
    }
  }, [post.id])

  const handlePostUpdate = () => {
    loadPostData()
    if (onPostUpdated) onPostUpdated()
  }

  const handleReactionChange = () => {
    loadPostData()
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle author/organizer click navigation
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    switch (displayIdentity.type) {
      case 'faith_admin':
        router.push('/faith-admin')
        break
      case 'organization':
        if (displayIdentity.id) {
          router.push(`/organization/${displayIdentity.id}`)
        }
        break
      case 'user':
      default:
        if (displayIdentity.id) {
          router.push(`/user/${displayIdentity.id}`)
        }
        break
    }
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
      case "faith_admin": return <Shield className="h-5 w-5 text-white" />
      case "organization": return <Users className="h-5 w-5 text-white" />
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

  // Check if author is clickable (must have an ID or be faith_admin)
  const isAuthorClickable = displayIdentity.type === 'faith_admin' || 
                            (displayIdentity.id !== null && displayIdentity.id !== undefined)

  // Optimized Multi-Image Layout Renderer
  const renderMultipleImages = () => {
    const count = post.imageUrls.length

    if (count === 2) {
      // 2 images: Side by side
      return (
        <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
          {post.imageUrls.map((url, idx) => (
            <div 
              key={idx} 
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: '4/3' }}
              onClick={() => handleImageClick(idx)}
            >
              <img 
                src={url} 
                alt={`Image ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          ))}
        </div>
      )
    }

    if (count === 3) {
      // 3 images: 1 on top (larger), 2 on bottom (equal size)
      return (
        <div className="mb-3 -mx-1">
          {/* Top: Single large image */}
          <div 
            className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group mb-1"
            style={{ aspectRatio: '16/9' }}
            onClick={() => handleImageClick(0)}
          >
            <img 
              src={post.imageUrls[0]} 
              alt="Image 1" 
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* Bottom: 2 equal images */}
          <div className="grid grid-cols-2 gap-1">
            {post.imageUrls.slice(1, 3).map((url, idx) => (
              <div 
                key={idx + 1} 
                className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
                style={{ aspectRatio: '4/3' }}
                onClick={() => handleImageClick(idx + 1)}
              >
                <img 
                  src={url} 
                  alt={`Image ${idx + 2}`} 
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (count === 4) {
      // 4 images: 2x2 grid
      return (
        <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
          {post.imageUrls.map((url, idx) => (
            <div 
              key={idx} 
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: '1/1' }}
              onClick={() => handleImageClick(idx)}
            >
              <img 
                src={url} 
                alt={`Image ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          ))}
        </div>
      )
    }

    // 5+ images: Show first 4 in 2x2 grid with "+N more" overlay on last image
    const remaining = count - 4
    return (
      <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
        {post.imageUrls.slice(0, 4).map((url, idx) => {
          const isLast = idx === 3
          
          return (
            <div 
              key={idx} 
              className="relative overflow-hidden rounded-md bg-gray-100 cursor-pointer group"
              style={{ aspectRatio: '1/1' }}
              onClick={() => handleImageClick(idx)}
            >
              <img 
                src={url} 
                alt={`Image ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
              />
              
              {!isLast && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              )}
              
              {isLast && remaining > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold drop-shadow-lg">+{remaining}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading && !post.postedAsType) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {/* Clickable Avatar */}
            <button
              onClick={handleAuthorClick}
              disabled={!isAuthorClickable}
              className={isAuthorClickable ? 'cursor-pointer' : 'cursor-default'}
            >
              {displayIdentity.avatarUrl ? (
                <img 
                  src={displayIdentity.avatarUrl} 
                  alt={displayIdentity.name}
                  className={`h-12 w-12 rounded-xl object-cover flex-shrink-0 shadow-sm ${
                    isAuthorClickable ? 'hover:opacity-80 transition-opacity' : ''
                  }`}
                />
              ) : (
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getAuthorColor(displayIdentity.type)} flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isAuthorClickable ? 'hover:opacity-80 transition-opacity' : ''
                }`}>
                  {displayIdentity.type !== 'user' ? (
                    getIdentityIcon(displayIdentity.type)
                  ) : (
                    <span className="text-white font-bold text-lg">{getInitials(displayIdentity.name)}</span>
                  )}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Clickable Author Name */}
                    <button
                      onClick={handleAuthorClick}
                      disabled={!isAuthorClickable}
                      className={`font-bold text-gray-900 ${
                        isAuthorClickable ? 'hover:underline cursor-pointer hover:text-blue-600 transition-colors' : 'cursor-default'
                      }`}
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
                    {isOnEventPage && pinOrder && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned {pinOrder === 1 ? '1st' : pinOrder === 2 ? '2nd' : '3rd'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{post.time}</span>
                    {editedAt && (
                      <>
                        <span>•</span>
                        <span className="italic">
                          Edited
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
                    {/* Tagged Users */}
                    <span>•</span>
                    <TaggedUsersDisplay
                      contentType="post"
                      contentId={post.id}
                      canEdit={canEditTags}
                      onTagsUpdated={handlePostUpdate}
                      initialCount={post.taggedUsersCount || 0}
                    />
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

          {/* Content */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

          {/* Images with Optimized Layouts */}
          {post.imageUrls.length === 1 ? (
            <SingleImageDisplay
              imageUrl={post.imageUrls[0]}
              onImageClick={() => handleImageClick(0)}
              alt="Post image"
            />
          ) : post.imageUrls.length > 0 ? (
            renderMultipleImages()
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
                onRepostCreated={onRepostCreated}
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
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CommentSection 
              contentType="post"
              contentId={post.id} 
              eventId={postEventId}
              initialCount={commentCount}
              avatarCache={avatarCache}
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