// components/feed/AnnouncementCard.tsx - Updated with TruncatedText
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pin, Clock, MessageCircle, ChevronDown, ChevronUp, Shield, Users, Image } from "lucide-react"
import { AnnouncementOptionsMenu } from "@/components/menus/AnnouncementOptionsMenu"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { SingleImageDisplay } from "./SingleImageDisplay"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { RepostButton } from "@/components/reposts/RepostButton"
import { TaggedUsersDisplay } from "@/components/tags/TaggedUsersDisplay"
import { TruncatedText } from "@/components/ui/TruncatedText"
import { createBrowserClient } from "@supabase/ssr"

type Announcement = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
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
  organizerId?: string
}

interface AnnouncementCardProps {
  announcement: Announcement
  onUpdate?: () => void
  onRepostCreated?: (repost: any) => void
  avatarCache?: {
    faithAdmin: string | null
    organizations: Map<string, string | null>
  }
}

export function AnnouncementCard({ announcement, onUpdate, onRepostCreated, avatarCache }: AnnouncementCardProps) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(true)
  
  const [reactionCount, setReactionCount] = useState(announcement.reactionCount || 0)
  const [repostCount, setRepostCount] = useState(announcement.repostCount || 0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canEditTags, setCanEditTags] = useState(false)
  const [organizerId, setOrganizerId] = useState<string | null>(announcement.organizerId || null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Logic to safely get the array of images
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
      
      // Fetch announcement data including creator_org_id
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('created_by, creator_org_id, creator_type')
        .eq('id', announcement.id)
        .single()

      if (announcementData) {
        setCanEditTags(user?.id === announcementData.created_by)
        
        // Set organizer ID if not already set
        if (!organizerId && announcementData.creator_org_id) {
          setOrganizerId(announcementData.creator_org_id)
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
        .select('reaction_count, repost_count, creator_org_id')
        .eq('id', announcement.id)
        .single()

      if (announcementData) {
        setReactionCount(announcementData.reaction_count || 0)
        setRepostCount(announcementData.repost_count || 0)
        
        if (announcementData.creator_org_id) {
          setOrganizerId(announcementData.creator_org_id)
        }
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

  // Handle organizer click navigation
  const handleOrganizerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (announcement.organizerType === 'faith') {
      router.push('/faith-admin')
    } else if (announcement.organizerType === 'organization' && organizerId) {
      router.push(`/organization/${organizerId}`)
    }
  }

  // Get avatar from cache
  const getOrganizerAvatar = () => {
    if (!avatarCache) return null
    
    if (announcement.organizerType === 'faith') {
      return avatarCache.faithAdmin
    } else if (announcement.organizerType === 'organization' && organizerId) {
      return avatarCache.organizations.get(organizerId) || null
    }
    return null
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

  // Check if organizer is clickable
  const isOrganizerClickable = announcement.organizerType === 'faith' || 
                                (announcement.organizerType === 'organization' && organizerId)

  const avatarUrl = getOrganizerAvatar()

  // Optimized multi-image layout renderer
  const renderMultipleImages = () => {
    const count = displayImages.length

    if (count === 2) {
      // 2 images: Side by side
      return (
        <div className="grid grid-cols-2 gap-1 mb-3 -mx-1">
          {displayImages.map((url, idx) => (
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
              src={displayImages[0]} 
              alt="Image 1" 
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* Bottom: 2 equal images */}
          <div className="grid grid-cols-2 gap-1">
            {displayImages.slice(1, 3).map((url, idx) => (
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
          {displayImages.map((url, idx) => (
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
        {displayImages.slice(0, 4).map((url, idx) => {
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

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {/* Clickable Organizer Avatar */}
            <button
              onClick={handleOrganizerClick}
              disabled={!isOrganizerClickable}
              className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${
                avatarUrl ? '' : `bg-gradient-to-br ${getOrganizerColor(announcement.organizerType)}`
              } ${
                isOrganizerClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'
              }`}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={announcement.organizerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                getOrganizerIcon(announcement.organizerType)
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Clickable Organizer Name */}
                    <button
                      onClick={handleOrganizerClick}
                      disabled={!isOrganizerClickable}
                      className={`font-bold text-gray-900 ${
                        isOrganizerClickable ? 'hover:underline cursor-pointer hover:text-blue-600 transition-colors' : 'cursor-default'
                      }`}
                    >
                      {announcement.organizerName}
                    </button>
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
          
          {/* Use TruncatedText component */}
          <TruncatedText 
            text={announcement.body}
            maxLines={2}
            className="text-gray-800 leading-relaxed mb-4"
          />

          {/* Display Images - Optimized Layouts */}
          {displayImages.length === 1 ? (
            <SingleImageDisplay
              imageUrl={displayImages[0]}
              onImageClick={() => handleImageClick(0)}
              alt="Announcement image"
            />
          ) : displayImages.length > 0 ? (
            renderMultipleImages()
          ) : null}

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
              avatarCache={avatarCache}
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