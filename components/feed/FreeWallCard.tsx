// components/feed/FreeWallCard.tsx - Complete
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Clock, Image, ChevronDown, ChevronUp } from "lucide-react"
import { FreeWallOptionsMenu } from "@/components/menus/FreeWallOptionsMenu"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { RepostButton } from "@/components/reposts/RepostButton"
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay"
import { createBrowserClient } from "@supabase/ssr"

type FreeWallPost = {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  imageUrls: string[]
  reactionCount: number
  comments: number
  repostCount: number
  createdAt: string
  editedAt: string | null
}

interface FreeWallCardProps {
  post: FreeWallPost
  onUpdate?: () => void
}

export function FreeWallCard({ post, onUpdate }: FreeWallCardProps) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(true)
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [repostCount, setRepostCount] = useState(post.repostCount)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [canEditTags, setCanEditTags] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadData()
  }, [post.id])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: postData } = await supabase
        .from('free_wall_posts')
        .select('reaction_count, repost_count, author_id')
        .eq('id', post.id)
        .single()

      if (postData) {
        setReactionCount(postData.reaction_count || 0)
        setRepostCount(postData.repost_count || 0)
        setCanEditTags(user?.id === postData.author_id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleReactionChange = () => {
    loadData()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`)
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

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <button
              onClick={() => handleUserClick(post.authorId)}
              className="cursor-pointer"
            >
              {post.authorAvatar ? (
                <img 
                  src={post.authorAvatar} 
                  alt={post.authorName}
                  className="h-12 w-12 rounded-xl object-cover flex-shrink-0 shadow-sm hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-lg">{getInitials(post.authorName)}</span>
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => handleUserClick(post.authorId)}
                    className="font-bold text-gray-900 hover:underline"
                  >
                    {post.authorName}
                  </button>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{post.createdAt}</span>
                    {post.editedAt && (
                      <>
                        <span>•</span>
                        <span className="italic">Edited</span>
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
                      contentType="free_wall_post"
                      contentId={post.id}
                      canEdit={canEditTags}
                      onTagsUpdated={loadData}
                    />
                  </div>
                </div>

                <FreeWallOptionsMenu
                  postId={post.id}
                  authorId={post.authorId}
                  content={post.content}
                  onUpdate={() => {
                    if (onUpdate) onUpdate()
                  }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </p>

          {/* Images Grid */}
          {post.imageUrls.length > 0 && (
            <div className={`mb-4 ${
              post.imageUrls.length === 1 ? 'grid grid-cols-1' :
              post.imageUrls.length === 2 ? 'grid grid-cols-2 gap-2' :
              'grid grid-cols-2 gap-2'
            }`}>
              {post.imageUrls.slice(0, 4).map((url, idx) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer group ${
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
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <ReactionButton 
                contentType="free_wall_post"
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
                <span className="text-xs font-bold">{post.comments}</span>
                {showComments ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              <RepostButton
                contentType="free_wall_post"
                contentId={post.id}
                onRepostChange={handleReactionChange}
              />
            </div>

            <div className="flex items-center gap-2">
              {repostCount > 0 && (
                <span className="text-xs text-gray-500">{repostCount} reposts</span>
              )}
              <ReactionSummary 
                contentType="free_wall_post"
                contentId={post.id}
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
              contentType="free_wall_post"
              contentId={post.id}
              initialCount={post.comments}
            />
          </div>
        )}
      </div>

      {post.imageUrls.length > 0 && (
        <ImagePreviewModal
          images={post.imageUrls}
          initialIndex={previewIndex}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}