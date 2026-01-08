// app/(site)/event/[id]/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, Calendar, MapPin, Users, Tag, Pin, 
  Globe, Lock, Loader2, AlertCircle, Plus, MessageCircle 
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { PostCard } from "@/components/feed/PostCard"
import { CreatePostDialog } from "@/components/posts/CreatePostDialog"

type Post = {
  id: string
  author: string
  authorType: string
  content: string
  time: string
  likes: number
  comments: number
  imageUrls: string[]
}

type EventDetails = {
  id: string
  title: string
  description: string
  organizerType: string
  organizerName: string
  startDate: string
  endDate: string
  location: string
  tags: string[]
  visibility: string
  isPinned: boolean
  participants: number
  totalPosts: number
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`*, creator_org:organizations(name)`)
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      // Map event data
      const start = new Date(eventData.start_date)
      const end = new Date(eventData.end_date)
      
      let organizerName = "Unknown"
      let organizerType = "user"
      
      if (eventData.creator_type === 'faith_admin') {
        organizerName = "FAITH Administration"
        organizerType = "faith" 
      } else if (eventData.creator_type === 'organization') {
        organizerName = eventData.creator_org?.name || "Organization"
        organizerType = "organization"
      }

      const visibilityMap: Record<string, string> = {
        'public': 'Public',
        'organization': 'Selected Orgs',
        'department': 'Selected Depts',
        'course': 'Selected Courses',
        'mixed': 'Custom Group'
      }

      setEvent({
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || "",
        organizerType,
        organizerName,
        startDate: start.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }),
        endDate: end.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }),
        location: eventData.location || "TBA",
        tags: eventData.tags || [],
        visibility: visibilityMap[eventData.participant_type] || 'Restricted',
        isPinned: eventData.is_pinned,
        participants: eventData.participant_count || 0,
        totalPosts: eventData.post_count || 0
      })

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(first_name, last_name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      const mappedPosts: Post[] = postsData.map((post: any) => ({
        id: post.id,
        author: `${post.author?.first_name || 'Unknown'} ${post.author?.last_name || 'User'}`,
        authorType: 'user',
        content: post.content,
        time: new Date(post.created_at).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        likes: post.likes || 0,
        comments: 0,
        imageUrls: post.image_urls || []
      }))

      setPosts(mappedPosts)

    } catch (error) {
      console.error("Error loading event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      loadEventData()
    }
  }, [eventId])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Event not found</h2>
        <button
          onClick={() => router.push('/home')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {/* Event Header */}
        <div className={`rounded-2xl border-2 overflow-hidden mb-6 ${
          event.organizerType === 'faith' 
            ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 border-purple-200' 
            : 'bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 border-orange-200'
        }`}>
          <div className="p-8">
            {event.isPinned && (
              <div className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm mb-4">
                <Pin className="h-4 w-4 fill-current" /> Pinned Event
              </div>
            )}

            <h1 className="text-4xl font-black text-gray-900 mb-4">{event.title}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                event.organizerType === 'faith' 
                  ? 'bg-purple-200 text-purple-900' 
                  : 'bg-orange-200 text-orange-900'
              }`}>
                {event.organizerName}
              </span>
            </div>

            {event.description && (
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{event.description}</p>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Start</div>
                  <div className="text-sm font-bold text-gray-900">{event.startDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">End</div>
                  <div className="text-sm font-bold text-gray-900">{event.endDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Location</div>
                  <div className="text-sm font-bold text-gray-900">{event.location}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg">
                <Users className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Participants</div>
                  <div className="text-sm font-bold text-gray-900">{event.participants}</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-white/60 rounded-full text-xs font-bold text-gray-700"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-black text-gray-900">
                  Discussions ({posts.length})
                </h2>
              </div>
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Post
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-4">No posts yet</p>
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Be the first to post!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        eventId={eventId}
        onPostCreated={loadEventData}
      />
    </>
  )
}