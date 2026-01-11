// components/feed/AnnouncementCard.tsx
"use client"
import { Pin, Clock, ThumbsUp, MoreVertical, Shield, Users } from "lucide-react"

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
  const getOrganizerColor = (type: string) => {
    switch(type) {
      case "faith": return "from-purple-400 to-purple-600"
      case "organization": return "from-orange-400 to-orange-600"
      default: return "from-gray-400 to-gray-600"
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
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className={`relative overflow-hidden ${
        announcement.organizerType === 'faith' 
          ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50' 
          : 'bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50'
      }`}>
        {announcement.isPinned && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
            <Pin className="h-3 w-3 fill-current" /> Pinned
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getOrganizerColor(announcement.organizerType)} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {getOrganizerIcon(announcement.organizerType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">{announcement.organizerName}</h5>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{announcement.createdAt}</span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <h3 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
            {announcement.header}
          </h3>
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
            {announcement.body}
          </p>
        </div>
      </div>

      {/* Image (if exists) */}
      {announcement.imageUrl && (
        <div className="relative aspect-video bg-gray-100">
          <img 
            src={announcement.imageUrl} 
            alt={announcement.header}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-bold">{announcement.likes}</span>
        </button>
      </div>
    </div>
  )
}