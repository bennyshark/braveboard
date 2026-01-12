// app/(site)/event/[id]/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, Calendar, MapPin, Users, Tag, Pin, 
  MessageCircle, Loader2, AlertCircle, Plus, X, Building2, GraduationCap, BookOpen 
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { PostCard } from "@/components/feed/PostCard"
import { CreatePostDialog } from "@/components/posts/CreatePostDialog"

// --- TYPES ---
type Post = {
  id: string
  author: string
  authorId: string
  authorType: string
  avatarUrl: string
  content: string
  time: string
  likes: number
  comments: number
  imageUrls: string[]
}

type ParticipantData = {
  orgs: string[]
  depts: string[]
  courses: string[]
  type: string
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
  participantDetails: ParticipantData 
}

// --- SUB-COMPONENTS ---

// 1. Modal to show full list if there are too many items
const ParticipantModal = ({ 
  isOpen, 
  onClose, 
  data 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: ParticipantData 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4" /> Invited Participants
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {data.orgs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Organizations
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.orgs.map((name) => (
                  <span key={name} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.depts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Departments
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.depts.map((name) => (
                  <span key={name} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.courses.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Courses
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.courses.map((name) => (
                  <span key={name} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-100 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 2. The summary display component
const ParticipantList = ({ data }: { data: ParticipantData }) => {
  const [showModal, setShowModal] = useState(false)

  if (data.type === 'public') {
    return <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md">Public (All FAITH)</span>
  }

  // Combine all names for the "preview" view
  const allItems = [
    ...data.orgs.map(n => ({ name: n, color: 'bg-blue-100 text-blue-800' })),
    ...data.depts.map(n => ({ name: n, color: 'bg-emerald-100 text-emerald-800' })),
    ...data.courses.map(n => ({ name: n, color: 'bg-purple-100 text-purple-800' }))
  ]

  const PREVIEW_LIMIT = 2;
  const remainingCount = allItems.length - PREVIEW_LIMIT;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center mt-1">
        {allItems.slice(0, PREVIEW_LIMIT).map((item, i) => (
          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold truncate max-w-[120px] ${item.color}`}>
            {item.name}
          </span>
        ))}
        
        {remainingCount > 0 && (
          <button 
            onClick={() => setShowModal(true)}
            className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
      
      <ParticipantModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        data={data} 
      />
    </>
  )
}


// --- MAIN PAGE ---
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

      // --- Collect participant names into arrays ---
      const orgNames: string[] = []
      const deptNames: string[] = []
      const courseNames: string[] = []

      if (eventData.participant_type !== 'public') {
        // Fetch organization names
        if (eventData.participant_orgs?.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('name')
            .in('id', eventData.participant_orgs)
          if (orgs) orgNames.push(...orgs.map((o: any) => o.name))
        }

        // Fetch department names
        if (eventData.participant_depts?.length > 0) {
          const { data: depts } = await supabase
            .from('departments')
            .select('name')
            .in('code', eventData.participant_depts)
          if (depts) deptNames.push(...depts.map((d: any) => d.name))
        }

        // Fetch course names
        if (eventData.participant_courses?.length > 0) {
          const { data: courses } = await supabase
            .from('courses')
            .select('name')
            .in('code', eventData.participant_courses)
          if (courses) courseNames.push(...courses.map((c: any) => c.name))
        }
      }

      setEvent({
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || "",
        organizerType,
        organizerName,
        startDate: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        endDate: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        location: eventData.location || "TBA",
        tags: eventData.tags || [],
        visibility: eventData.participant_type,
        isPinned: eventData.is_pinned,
        participants: eventData.participant_count || 0,
        totalPosts: eventData.post_count || 0,
        participantDetails: {
          orgs: orgNames,
          depts: deptNames,
          courses: courseNames,
          type: eventData.participant_type
        }
      })

      // Fetch posts with author details
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Get unique author IDs
      const authorIds = [...new Set(postsData.map((p: any) => p.author_id))]
      
      // Fetch author profiles with avatar URLs
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      // Create a map of author details
      const authorMap = new Map(
        authorsData?.map(author => [
          author.id, 
          {
            name: `${author.first_name || 'Unknown'} ${author.last_name || 'User'}`,
            avatarUrl: author.avatar_url || ''
          }
        ]) || []
      )

      // Map posts with all required fields
      setPosts(postsData.map((post: any) => {
        const authorData = authorMap.get(post.author_id) || { name: 'Unknown User', avatarUrl: '' }
        
        return {
          id: post.id,
          author: authorData.name,
          authorId: post.author_id,
          authorType: 'user',
          avatarUrl: authorData.avatarUrl,
          content: post.content,
          time: new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          likes: post.likes || 0,
          comments: 0,
          imageUrls: post.image_urls || []
        }
      }))

    } catch (error) {
      console.error("Error loading event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) loadEventData()
  }, [eventId])

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>

  if (!event) return (
    <div className="flex flex-col h-screen items-center justify-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900">Event not found</h2>
      <button onClick={() => router.push('/home')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Back to Home</button>
    </div>
  )

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>

        {/* Event Header */}
        <div className={`rounded-2xl border-2 overflow-hidden mb-6 transition-colors ${
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
                event.organizerType === 'faith' ? 'bg-purple-200 text-purple-900' : 'bg-orange-200 text-orange-900'
              }`}>
                {event.organizerName}
              </span>
            </div>

            {event.description && <p className="text-gray-700 text-lg mb-6 leading-relaxed">{event.description}</p>}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-white/50">
                <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Start</div>
                  <div className="text-sm font-bold text-gray-900">{event.startDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-white/50">
                <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">End</div>
                  <div className="text-sm font-bold text-gray-900">{event.endDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-white/50">
                <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Location</div>
                  <div className="text-sm font-bold text-gray-900">{event.location}</div>
                </div>
              </div>

              <div className="flex gap-3 bg-white/60 p-3 rounded-lg border border-white/50 min-h-[70px]">
                <Users className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <div className="text-xs text-gray-500 font-medium">Event for</div>
                  <ParticipantList data={event.participantDetails} />
                </div>
              </div>
            </div>

            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-white/60 rounded-full text-xs font-bold text-gray-700 border border-gray-200">
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-black text-gray-900">Discussions ({posts.length})</h2>
            </div>
            <button onClick={() => setIsCreatePostOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" /> Add Post
            </button>
          </div>

          <div className="p-6 space-y-4">
            {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-4">No posts yet</p>
                <button onClick={() => setIsCreatePostOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">Be the first to post!</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreatePostDialog isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} eventId={eventId} onPostCreated={loadEventData} />
    </>
  )
}