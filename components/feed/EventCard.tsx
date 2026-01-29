// components/feed/EventCard.tsx - OPTIMIZED with pre-fetched data
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, MessageCircle, Pin, ArrowRight, Eye, EyeOff, Plus, Shield, Lock } from "lucide-react"
import { EventItem } from "@/app/(site)/home/types"
import { PostCard } from "./PostCard"
import { CreatePostDialog } from "@/components/posts/CreatePostDialog"
import { EventOptionsMenu } from "@/components/menus/EventOptionsMenu"

interface EventCardProps {
  event: EventItem
  isPostsHidden: boolean
  onToggleHide: (e: React.MouseEvent) => void
  onPostCreated?: () => void
  onEventDeleted?: () => void
}

export function EventCard({ 
  event, 
  isPostsHidden, 
  onToggleHide, 
  onPostCreated,
  onEventDeleted
}: EventCardProps) {
  const router = useRouter()
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  
  // OPTIMIZED: Use pre-fetched data from props
  const isPostingExpired = event.isPostingExpired ?? false
  const eventOfText = event.eventOfText ?? "Custom Group"
  const visiblePosts = isPostsHidden ? [] : event.posts.slice(0, 3)

  const handleCardClick = () => {
    router.push(`/event/${event.id}`)
  }

  const handleCreatePostClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPostingExpired) return
    setIsCreatePostOpen(true)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        <div 
          className="relative bg-gradient-to-br from-gray-50 to-white cursor-pointer group"
          onClick={handleCardClick}
        >
          {event.isPinned && (
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm z-10">
              <Pin className="h-3 w-3 fill-current" /> Pinned
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-3">
                  <h4 className="text-2xl font-black text-gray-900 leading-tight flex-1">
                    {event.title}
                  </h4>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    event.organizer.type === 'faith' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {event.organizer.type === 'faith' && <Shield className="h-3 w-3" />}
                    {event.organizer.name}
                  </span>

                  {/* OPTIMIZED: Instantly show status without loading */}
                  {isPostingExpired && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                      Ended
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {event.date}
                  </span>
                  <span className="text-gray-300">•</span>
                  {/* OPTIMIZED: Instantly show participant text without loading */}
                  <span className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-gray-400" />
                    Event for: {eventOfText}
                  </span>
                </div>
              </div>

              <EventOptionsMenu 
                eventId={event.id} 
                onUpdate={onPostCreated}
                onDelete={onEventDeleted}
              />
            </div>
            
            {/* View Full Event + Hide/Show Posts buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group/btn">
                View Full Event
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onToggleHide}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                {isPostsHidden ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Show Posts
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Posts
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {!isPostsHidden && (
          <div className="bg-gray-50 border-t-2 border-gray-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <MessageCircle className="h-4 w-4" />
                  Recent Discussions ({event.posts.length} of {event.totalPosts})
                </div>
              </div>

              {visiblePosts.length > 0 ? (
                <div className="space-y-3">
                  {visiblePosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      eventId={event.id}
                      onPostDeleted={onPostCreated}
                      onPostUpdated={onPostCreated}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm bg-white rounded-xl border-2 border-dashed border-gray-200">
                  {isPostingExpired 
                    ? "Event has ended. Posting is closed." 
                    : "No posts yet. Be the first to share!"}
                </div>
              )}

              {/* OPTIMIZED: Instant button state without loading */}
              {isPostingExpired ? (
                <button 
                  disabled 
                  className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed border-2 border-gray-300"
                >
                  <Lock className="h-4 w-4" />
                  Posting Closed (Event Ended)
                </button>
              ) : (
                <button 
                  onClick={handleCreatePostClick}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Your Post
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        eventId={event.id}
        onPostCreated={onPostCreated}
      />
    </>
  )
}