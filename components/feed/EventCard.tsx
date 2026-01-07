// components/feed/EventCard.tsx
"use client"
import { Calendar, MapPin, Users, MessageCircle, Pin, ArrowRight, MoreVertical, Eye, EyeOff, Plus } from "lucide-react"
import { EventItem } from "@/app/(site)/home/types"
import { PostCard } from "./PostCard"

interface EventCardProps {
  event: EventItem
  isPostsHidden: boolean
  onToggleHide: (e: React.MouseEvent) => void
}

export function EventCard({ event, isPostsHidden, onToggleHide }: EventCardProps) {
  const visiblePosts = isPostsHidden ? [] : event.posts.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Card Body */}
      <div 
        className={`relative overflow-hidden cursor-pointer transition-all group ${
          event.organizer.type === 'faith' 
            ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 hover:from-purple-100' 
            : 'bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 hover:from-orange-100'
        }`}
        onClick={() => console.log(`Maps to event ${event.id}`)}
      >
        {event.isPinned && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
            <Pin className="h-3 w-3 fill-current" /> Pinned
          </div>
        )}

        <div className="p-5">
          {/* Header Info */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h4 className="text-2xl font-black text-gray-900 leading-tight">{event.title}</h4>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  event.organizer.type === 'faith' ? 'bg-purple-200 text-purple-800' : 'bg-orange-200 text-orange-800'
                }`}>
                  {event.organizer.name}
                </span>
              </div>

              {/* Meta Stats */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1 font-medium"><Calendar className="h-3 w-3" /> {event.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium"><MapPin className="h-3 w-3" /> {event.visibility}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium"><Users className="h-3 w-3" /> {event.participants} participants</span>
              </div>
            </div>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300/50">
            <div className="text-xs text-gray-600 font-medium">Click to view full event page</div>
            <button 
              onClick={onToggleHide}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 hover:bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors"
            >
              {isPostsHidden ? <><Eye className="h-3 w-3" /> Show Posts</> : <><EyeOff className="h-3 w-3" /> Hide Posts</>}
            </button>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      {!isPostsHidden && (
        <div className="bg-gray-50 border-t-2 border-gray-200">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <MessageCircle className="h-3 w-3" />
              Recent Discussions ({event.posts.length} of {event.totalPosts})
            </div>

            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add Your Post
            </button>
          </div>
        </div>
      )}
    </div>
  )
}