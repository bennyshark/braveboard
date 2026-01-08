// components/feed/EventCard.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Users, MessageCircle, Pin, ArrowRight, MoreVertical, Eye, EyeOff, Plus } from "lucide-react"
import { EventItem } from "@/app/(site)/home/types"
import { PostCard } from "./PostCard"
import { CreatePostDialog } from "@/components/posts/CreatePostDialog"
import { createBrowserClient } from "@supabase/ssr"

interface EventCardProps {
  event: EventItem
  isPostsHidden: boolean
  onToggleHide: (e: React.MouseEvent) => void
  onPostCreated?: () => void
}

export function EventCard({ event, isPostsHidden, onToggleHide, onPostCreated }: EventCardProps) {
  const router = useRouter()
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [eventOfText, setEventOfText] = useState("Loading...")
  const visiblePosts = isPostsHidden ? [] : event.posts.slice(0, 3)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Fetch and format "Event of" text
  useEffect(() => {
    async function fetchEventOfText() {
      try {
        // Get the raw event data with participant arrays
        const { data: eventData, error } = await supabase
          .from('events')
          .select('participant_type, participant_orgs, participant_depts, participant_courses')
          .eq('id', event.id)
          .single()

        if (error) throw error

        // If public, just show FAITH
        if (eventData.participant_type === 'public') {
          setEventOfText("FAITH")
          return
        }

        const names: string[] = []

        // Fetch organization names
        if (eventData.participant_orgs && eventData.participant_orgs.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('name')
            .in('id', eventData.participant_orgs)
          
          if (orgs) names.push(...orgs.map(o => o.name))
        }

        // Fetch department names
        if (eventData.participant_depts && eventData.participant_depts.length > 0) {
          const { data: depts } = await supabase
            .from('departments')
            .select('name')
            .in('code', eventData.participant_depts)
          
          if (depts) names.push(...depts.map(d => d.name))
        }

        // Fetch course names
        if (eventData.participant_courses && eventData.participant_courses.length > 0) {
          const { data: courses } = await supabase
            .from('courses')
            .select('name')
            .in('code', eventData.participant_courses)
          
          if (courses) names.push(...courses.map(c => c.name))
        }

        // Format the output
        if (names.length === 0) {
          setEventOfText("Custom Group")
        } else if (names.length <= 3) {
          setEventOfText(names.join(", "))
        } else {
          setEventOfText(`${names.slice(0, 3).join(", ")} +${names.length - 3} more`)
        }

      } catch (error) {
        console.error("Error fetching event participants:", error)
        setEventOfText("Custom Group")
      }
    }

    fetchEventOfText()
  }, [event.id, supabase])

  const handleCardClick = () => {
    router.push(`/event/${event.id}`)
  }

  const handleCreatePostClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsCreatePostOpen(true)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
        {/* Card Body */}
        <div 
          className={`relative overflow-hidden cursor-pointer transition-all group ${
            event.organizer.type === 'faith' 
              ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 hover:from-purple-100' 
              : 'bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 hover:from-orange-100'
          }`}
          onClick={handleCardClick}
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
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" /> {event.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3" /> Event for: {eventOfText}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
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

              {visiblePosts.length > 0 ? (
                visiblePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No posts yet. Be the first to share!
                </div>
              )}

              <button 
                onClick={handleCreatePostClick}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Your Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        eventId={event.id}
        onPostCreated={onPostCreated}
      />
    </>
  )
}