// components/feed/PostCard.tsx

import { MessageCircle, Share2, Bookmark, Clock, Image, MoreVertical } from "lucide-react"
import { Post } from "@/app/(site)/home/types"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  // Helper functions moved inside or imported from utils
  const getAuthorIcon = (type: string) => {
    switch(type) {
      case "department": return "🏫"
      case "org": return "👥"
      default: return "👤"
    }
  }

  const getAuthorColor = (type: string) => {
    switch(type) {
      case "department": return "from-purple-400 to-purple-600"
      case "org": return "from-orange-400 to-orange-600"
      case "user": return "from-blue-400 to-blue-600"
      default: return "from-gray-400 to-gray-600"
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-4 hover:border-gray-400 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getAuthorColor(post.authorType)} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
          {getAuthorIcon(post.authorType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h5 className="font-bold text-gray-900">{post.author}</h5>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{post.time}</span>
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
            <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
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
            <div key={idx} className={`relative overflow-hidden rounded-lg bg-gray-100 ${
              post.imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
            }`}>
              <img src={url} alt="Post" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
          <span className="text-base">👍</span>
          <span className="text-xs font-bold">{post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">{post.comments}</span>
        </button>
        <button className="p-1.5 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}