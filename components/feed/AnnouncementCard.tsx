// components/feed/AnnouncementCard.tsx - UPDATED with Reactions
"use client"
import { useState, useEffect } from "react"
import { Pin, Clock, MessageCircle, ChevronDown, ChevronUp, Shield, Users } from "lucide-react"
import { AnnouncementOptionsMenu } from "@/components/menus/AnnouncementOptionsMenu"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { CommentSection } from "@/components/comments/CommentSection"
import { ReactionButton } from "@/components/reactions/ReactionButton"
import { ReactionSummary } from "@/components/reactions/ReactionSummary"
import { createBrowserClient } from "@supabase/ssr"

type Announcement = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
  imageUrl: string | null
  isPinned: boolean
  likes: number
  comments: number
  allowComments: boolean
  createdAt: string
}

interface AnnouncementCardProps {
  announcement: Announcement
  onUpdate?: () => void
}

export function AnnouncementCard({ announcement, onUpdate }: AnnouncementCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [reactionCount, setReactionCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadReactionCount()
  }, [announcement.id])

  const loadReactionCount = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('reaction_count')
        .eq('id', announcement.id)
        .single()

      if (data) {
        setReactionCount(data.reaction_count || 0)
      }
    } catch (error) {
      console.error('Error loading reaction count:', error)
    }
  }

  const handleReactionChange = () => {
    loadReactionCount()
    setRefreshTrigger(prev => prev + 1)
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

  const images = announcement.imageUrl ? [announcement.imageUrl] : []

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getOrganizerColor(announcement.organizerType)} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {getOrganizerIcon(announcement.organizerType)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
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

          <div className="ml-[60px]">
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {announcement.header}
            </h3>
            
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {announcement.body}
            </p>

            {announcement.imageUrl && (
              <div 
                className="relative rounded-xl overflow-hidden bg-gray-100 mb-4 cursor-pointer group"
                onClick={() => setPreviewOpen(true)}
              >
                <img 
                  src={announcement.imageUrl} 
                  alt={announcement.header}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
              </div>

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

      {images.length > 0 && (
        <ImagePreviewModal
          images={images}
          initialIndex={0}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}