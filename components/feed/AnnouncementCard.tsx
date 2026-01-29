// components/feed/AnnouncementCard.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pin, Clock, MessageCircle, ChevronDown, ChevronUp, Shield, Users, Image } from "lucide-react"
import { AnnouncementOptionsMenu } from "@/components/menus/AnnouncementOptionsMenu"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { RepostButton } from "@/components/reposts/RepostButton"
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay"
import { createBrowserClient } from "@supabase/ssr"

// 1. Define the type to match your data structure
type Announcement = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
  // This expects the parent component to pass the array from DB "image_urls" to this prop
  imageUrls: string[] | null 
  isPinned: boolean
  likes: number
  comments: number
  allowComments: boolean
  createdAt: string
  reactionCount?: number
  repostCount?: number
  createdBy?: string
  taggedUsersCount?: number
}

interface AnnouncementCardProps {
  announcement: Announcement
  onUpdate?: () => void
  onRepostCreated?: (repost: any) => void
}

export function AnnouncementCard({ announcement, onUpdate, onRepostCreated }: AnnouncementCardProps) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(true)
  
  const [reactionCount, setReactionCount] = useState(announcement.reactionCount || 0)
  const [repostCount, setRepostCount] = useState(announcement.repostCount || 0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canEditTags, setCanEditTags] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // 2. Logic to safely get the array of images
  const displayImages = useMemo(() => {
    if (Array.isArray(announcement.imageUrls) && announcement.imageUrls.length > 0) {
      return announcement.imageUrls
    }
    return []
  }, [announcement.imageUrls])

  useEffect(() => {
    loadUserData()
  }, [announcement.id])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      
      if (announcement.createdBy) {
        setCanEditTags(user?.id === announcement.createdBy)
      } else {
        const { data: announcementData } = await supabase
          .from('announcements')
          .select('created_by')
          .eq('id', announcement.id)
          .single()

        if (announcementData) {
          setCanEditTags(user?.id === announcementData.created_by)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadData = async () => {
    try {
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('reaction_count, repost_count')
        .eq('id', announcement.id)
        .single()

      if (announcementData) {
        setReactionCount(announcementData.reaction_count || 0)
        setRepostCount(announcementData.repost_count || 0)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleReactionChange = () => {
    loadData()
    setRefreshTrigger(prev => prev + 1)
  }

  const handleImageClick = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  const getOrganizerColor = (type: string) => {
    switch(type) {
      case "faith": return "from-purple-500 to-indigo-600"
      case "organization": return "from-orange-500 to-red-600"
      default: return "from-gray-500 to-gray-700"
    }
  }

  const getOrganizerIcon = (type: string) => {
    switch(type) {
      case "faith": return <Shield className="h-5 w-5 text-white" />
      case "organization": return <Users className="h-5 w-5 text-white" />
      default: return "📢"
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getOrganizerColor(announcement.organizerType)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              {getOrganizerIcon(announcement.organizerType)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-gray-900">{announcement.organizerName}</h5>
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{announcement.createdAt}</span>
                    {/* 3. Show Image count in metadata */}
                    {displayImages.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          {displayImages.length}
                        </span>
                      </>
                    )}
                    {/* Tagged Users */}
                    <span>•</span>
                    <TaggedUsersDisplay
                      contentType="announcement"
                      contentId={announcement.id}
                      canEdit={canEditTags}
                      onTagsUpdated={loadData}
                      initialCount={announcement.taggedUsersCount || 0}
                    />
                  </div>
                </div>

                <AnnouncementOptionsMenu
                  announcementId={announcement.id}
                  onUpdate={() => {
                    if (onUpdate) onUpdate()
                  }}
                />
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {announcement.header}
          </h3>
          
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
            {announcement.body}
          </p>

          {/* 4. Display Images Grid */}
          {displayImages.length > 0 && (
            <div className={`mb-4 ${
              displayImages.length === 1 ? 'grid grid-cols-1' :
              displayImages.length === 2 ? 'grid grid-cols-2 gap-2' :
              'grid grid-cols-2 gap-2'
            }`}>
              {displayImages.slice(0, 4).map((url, idx) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer group ${
                    displayImages.length === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
                  onClick={() => handleImageClick(idx)}
                >
                  <img 
                    src={url} 
                    alt={`${announcement.header} - Image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {idx === 3 && displayImages.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{displayImages.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <ReactionButton 
                contentType="announcement"
                contentId={announcement.id}
                onReactionChange={handleReactionChange}
              />
              
              {announcement.allowComments && (
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    showComments 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{announcement.comments}</span>
                  {showComments ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}

              <RepostButton
                contentType="announcement"
                contentId={announcement.id}
                onRepostChange={handleReactionChange}
                onRepostCreated={onRepostCreated}
              />
            </div>

            <div className="flex items-center gap-2">
              {repostCount > 0 && (
                <span className="text-xs text-gray-500">{repostCount} reposts</span>
              )}
              <ReactionSummary 
                contentType="announcement"
                contentId={announcement.id}
                totalCount={reactionCount}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>

        {announcement.allowComments && showComments && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CommentSection 
              contentType="announcement"
              contentId={announcement.id}
              initialCount={announcement.comments}
            />
          </div>
        )}
      </div>

      {displayImages.length > 0 && (
        <ImagePreviewModal
          images={displayImages}
          initialIndex={previewIndex}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}