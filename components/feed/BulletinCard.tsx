// components/feed/BulletinCard.tsx
"use client"
import { useState } from "react"
import { Pin, Clock, ThumbsUp, MoreVertical, Shield, Users, MessageCircle, ChevronDown, ChevronUp } from "lucide-react"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { CommentSection } from "@/components/comments/CommentSection"

type Bulletin = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
  imageUrls: string[]
  isPinned: boolean
  likes: number
  comments: number
  allowComments: boolean
  createdAt: string
}

interface BulletinCardProps {
  bulletin: Bulletin
  onUpdate?: () => void
}

export function BulletinCard({ bulletin, onUpdate }: BulletinCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showComments, setShowComments] = useState(true)

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

  const handleImageClick = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="p-6">
          {/* Header with organizer info */}
          <div className="flex items-start gap-3 mb-4">
            {/* Profile Picture Style Icon */}
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getOrganizerColor(bulletin.organizerType)} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {getOrganizerIcon(bulletin.organizerType)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {/* Organizer Name and Pinned Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-bold text-gray-900">{bulletin.organizerName}</h5>
                    {bulletin.isPinned && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" />
                        Pinned
                      </span>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{bulletin.createdAt}</span>
                    {bulletin.imageUrls.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{bulletin.imageUrls.length} {bulletin.imageUrls.length === 1 ? 'image' : 'images'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* More Options Button */}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="ml-[60px]">
            {/* Header/Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {bulletin.header}
            </h3>
            
            {/* Body Text */}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {bulletin.body}
            </p>

            {/* Images Grid - Same as PostCard */}
            {bulletin.imageUrls.length > 0 && (
              <div className={`mb-3 ${
                bulletin.imageUrls.length === 1 ? 'grid grid-cols-1' :
                bulletin.imageUrls.length === 2 ? 'grid grid-cols-2 gap-2' :
                'grid grid-cols-2 gap-2'
              }`}>
                {bulletin.imageUrls.slice(0, 4).map((url, idx) => (
                  <div 
                    key={idx} 
                    className={`relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group ${
                      bulletin.imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                    onClick={() => handleImageClick(idx)}
                  >
                    <img 
                      src={url} 
                      alt="Bulletin" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {idx === 3 && bulletin.imageUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{bulletin.imageUrls.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                <span className="text-base">👍</span>
                <span className="text-xs font-bold">{bulletin.likes}</span>
              </button>
              
              {bulletin.allowComments && (
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    showComments 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{bulletin.comments}</span>
                  {showComments ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comment Section */}
        {bulletin.allowComments && showComments && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <CommentSection 
              contentType="bulletin"
              contentId={bulletin.id}
              initialCount={bulletin.comments}
            />
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {bulletin.imageUrls.length > 0 && (
        <ImagePreviewModal
          images={bulletin.imageUrls}
          initialIndex={previewIndex}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}