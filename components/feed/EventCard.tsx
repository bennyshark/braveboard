// components/feed/EventCard.tsx - REPLACE ENTIRE FILE
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, MessageCircle, Pin, ArrowRight, Eye, EyeOff, Plus, Shield } from "lucide-react"
import { EventItem } from "@/app/(site)/home/types"
import { PostCard } from "./PostCard"
import { CreatePostDialog } from "@/components/posts/CreatePostDialog"
import { EventOptionsMenu } from "@/components/menus/EventOptionsMenu"
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const visiblePosts = isPostsHidden ? [] : event.posts.slice(0, 3)

  useEffect(() => {
    async function fetchEventOfText() {
      try {
        const { data: eventData, error } = await supabase
          .from('events')
          .select('participant_type, participant_orgs, participant_depts, participant_courses')
          .eq('id', event.id)
          .single()

        if (error) throw error

        if (eventData.participant_type === 'public') {
          setEventOfText("FAITH")
          return
        }

        const names: string[] = []

        if (eventData.participant_orgs && eventData.participant_orgs.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('name')
            .in('id', eventData.participant_orgs)
          
          if (orgs) names.push(...orgs.map(o => o.name))
        }

        if (eventData.participant_depts && eventData.participant_depts.length > 0) {
          const { data: depts } = await supabase
            .from('departments')
            .select('name')
            .in('code', eventData.participant_depts)
          
          if (depts) names.push(...depts.map(d => d.name))
        }

        if (eventData.participant_courses && eventData.participant_courses.length > 0) {
          const { data: courses } = await supabase
            .from('courses')
            .select('name')
            .in('code', eventData.participant_courses)
          
          if (courses) names.push(...courses.map(c => c.name))
        }

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
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {event.date}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-gray-400" />
                    Event for: {eventOfText}
                  </span>
                </div>
              </div>

              <EventOptionsMenu 
                eventId={event.id} 
                onUpdate={() => window.location.reload()}
              />
            </div>

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
                    <PostCard key={post.id} post={post} eventId={event.id} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm bg-white rounded-xl border-2 border-dashed border-gray-200">
                  No posts yet. Be the first to share!
                </div>
              )}

              <button 
                onClick={handleCreatePostClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your Post
              </button>
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