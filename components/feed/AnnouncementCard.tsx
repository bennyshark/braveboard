// components/feed/AnnouncementCard.tsx
"use client"
import { useState } from "react"
import { Pin, Clock, ThumbsUp, MoreVertical, Shield, Users } from "lucide-react"
import { ImagePreviewModal } from "./ImagePreviewModal"

type Announcement = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
  imageUrl: string | null
  isPinned: boolean
  likes: number
  createdAt: string
}

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

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
          {/* Header with organizer info - like a post */}
          <div className="flex items-start gap-3 mb-4">
            {/* Profile Picture Style Icon */}
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getOrganizerColor(announcement.organizerType)} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {getOrganizerIcon(announcement.organizerType)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {/* Organizer Name and Pinned Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-gray-900">{announcement.organizerName}</h5>
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned
                      </span>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{announcement.createdAt}</span>
                  </div>
                </div>

                {/* More Options Button */}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content - like a post */}
          <div className="ml-[60px]">
            {/* Header/Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {announcement.header}
            </h3>
            
            {/* Body Text */}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {announcement.body}
            </p>

            {/* Image (if exists) - now clickable */}
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

            {/* Actions - like a post */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm font-bold">{announcement.likes}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
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