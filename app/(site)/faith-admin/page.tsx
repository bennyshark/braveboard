// app/(site)/faith-admin/page.tsx
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { ImagePreviewModal } from "@/components/feed/ImagePreviewModal" // Ensure path matches your file structure
import { 
  Shield,
  Calendar, 
  MessageSquare, 
  Megaphone, 
  Newspaper,
  Image as ImageIcon,
  Settings,
  Loader2,
  ArrowLeft,
  Pin,
  Clock,
  Heart,
  PinOff
} from "lucide-react"

type FaithAdmin = {
  name: string
  description: string | null
  avatar_url: string | null
  cover_url: string | null
}

type Post = {
  id: string
  event_id: string
  content: string
  image_urls: string[]
  likes: number
  comments: number
  reaction_count: number
  repost_count: number
  created_at: string
  pin_order: number | null
  posted_as_type: 'user' | 'organization' | 'faith_admin'
  event: {
    id: string
    title: string
  }
}

type Event = {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  location: string | null
  tags: string[]
  is_pinned: boolean
  participant_count: number
  post_count: number
  created_at: string
}

type Announcement = {
  id: string
  header: string
  body: string
  image_url: string | null
  is_pinned: boolean
  likes: number
  comments: number
  reaction_count: number
  created_at: string
}

type Bulletin = {
  id: string
  header: string
  body: string
  image_urls: string[]
  is_pinned: boolean
  likes: number
  comments: number
  reaction_count: number
  created_at: string
}

function FaithAdminContent() {
  const router = useRouter()

  const [faithAdmin, setFaithAdmin] = useState<FaithAdmin>({
    name: "FAITH Administration",
    description: null,
    avatar_url: null,
    cover_url: null
  })
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'announcements' | 'bulletins' | 'pictures'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [pictures, setPictures] = useState<string[]>([])

  // Image Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadFaithAdminData()
  }, [])

  useEffect(() => {
    loadTabContent()
  }, [activeTab])

  // Helper to open image modal
  const openImagePreview = (images: string[], index: number) => {
    setPreviewImages(images)
    setPreviewIndex(index)
    setIsPreviewOpen(true)
  }

  async function loadFaithAdminData() {
    try {
      setLoading(true)

      // Check if user is faith admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsFaithAdmin(profile?.role === 'admin')

      // Load FAITH admin settings from faith_admin_settings table
      const { data: settings } = await supabase
        .from('faith_admin_settings')
        .select('*')
        .single()

      if (settings) {
        setFaithAdmin({
          name: "FAITH Administration",
          description: settings.description,
          avatar_url: settings.avatar_url,
          cover_url: settings.cover_url
        })
      }

    } catch (error) {
      console.error('Error loading FAITH admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTabContent() {
    try {
      if (activeTab === 'posts') {
        await loadPosts()
      } else if (activeTab === 'events') {
        await loadEvents()
      } else if (activeTab === 'announcements') {
        await loadAnnouncements()
      } else if (activeTab === 'bulletins') {
        await loadBulletins()
      } else if (activeTab === 'pictures') {
        await loadPictures()
      }
    } catch (error) {
      console.error('Error loading tab content:', error)
    }
  }

  async function loadPosts() {
    // UPDATED LOGIC: 
    // We strictly look for posts where posted_as_type is 'faith_admin'.
    // We do NOT filter by event creator. This allows FAITH Admin to post on ANY event.
    
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        id,
        event_id,
        content,
        image_urls,
        likes,
        comments,
        reaction_count,
        repost_count,
        created_at,
        pin_order,
        posted_as_type,
        event:events (
          id,
          title
        )
      `)
      .eq('posted_as_type', 'faith_admin')
      .order('pin_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error loading posts:", error)
      return
    }

    const formattedPosts = (postsData || []).map((post: any) => ({
      ...post,
      event: Array.isArray(post.event) ? post.event[0] : post.event,
      reaction_count: post.reaction_count || 0,
      repost_count: post.repost_count || 0
    })) as Post[]

    setPosts(formattedPosts)
  }

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('creator_type', 'faith_admin')
      .order('is_pinned', { ascending: false })
      .order('start_date', { ascending: false })

    setEvents(data || [])
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('creator_type', 'faith_admin')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    setAnnouncements((data || []).map(a => ({
      ...a,
      reaction_count: a.reaction_count || 0
    })))
  }

  async function loadBulletins() {
    const { data } = await supabase
      .from('bulletins')
      .select('*')
      .eq('creator_type', 'faith_admin')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    setBulletins((data || []).map(b => ({
      ...b,
      reaction_count: b.reaction_count || 0
    })))
  }

  async function loadPictures() {
    const allImages: string[] = []

    // UPDATED LOGIC: Get images from posts posted BY faith_admin
    const { data: postsData } = await supabase
      .from('posts')
      .select('image_urls')
      .eq('posted_as_type', 'faith_admin')
      .not('image_urls', 'is', null)

    postsData?.forEach(post => {
      if (post.image_urls && Array.isArray(post.image_urls)) {
        allImages.push(...post.image_urls)
      }
    })

    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('image_url')
      .eq('creator_type', 'faith_admin')

    announcementsData?.forEach(ann => {
      if (ann.image_url) {
        allImages.push(ann.image_url)
      }
    })

    const { data: bulletinsData } = await supabase
      .from('bulletins')
      .select('image_urls')
      .eq('creator_type', 'faith_admin')

    bulletinsData?.forEach(bul => {
      if (bul.image_urls) {
        allImages.push(...bul.image_urls)
      }
    })

    // Filter out empty strings if any
    setPictures(allImages.filter(img => img))
  }

  async function togglePinPost(postId: string, currentPinOrder: number | null) {
    if (!isFaithAdmin) return
    
    try {
      if (currentPinOrder !== null) {
        const { error } = await supabase
          .from('posts')
          .update({ pin_order: null })
          .eq('id', postId)

        if (error) throw error
      } else {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('posted_as_type', 'faith_admin')
          .not('pin_order', 'is', null)

        if ((count || 0) >= 3) {
          alert('Maximum 3 pinned posts allowed')
          return
        }

        const nextOrder = (count || 0) + 1

        const { error } = await supabase
          .from('posts')
          .update({ pin_order: nextOrder })
          .eq('id', postId)

        if (error) throw error
      }

      loadPosts()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  async function togglePinEvent(eventId: string, currentlyPinned: boolean) {
    if (!isFaithAdmin) return
    
    try {
      if (!currentlyPinned) {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('creator_type', 'faith_admin')
          .eq('is_pinned', true)

        if ((count || 0) >= 3) {
          alert('Maximum 3 pinned events allowed')
          return
        }
      }

      const { error } = await supabase
        .from('events')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', eventId)

      if (error) throw error
      loadEvents()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  async function togglePinAnnouncement(announcementId: string, currentlyPinned: boolean) {
    if (!isFaithAdmin) return
    
    try {
      if (!currentlyPinned) {
        const { count } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('creator_type', 'faith_admin')
          .eq('is_pinned', true)

        if ((count || 0) >= 3) {
          alert('Maximum 3 pinned announcements allowed')
          return
        }
      }

      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', announcementId)

      if (error) throw error
      loadAnnouncements()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  async function togglePinBulletin(bulletinId: string, currentlyPinned: boolean) {
    if (!isFaithAdmin) return
    
    try {
      if (!currentlyPinned) {
        const { count } = await supabase
          .from('bulletins')
          .select('*', { count: 'exact', head: true })
          .eq('creator_type', 'faith_admin')
          .eq('is_pinned', true)

        if ((count || 0) >= 3) {
          alert('Maximum 3 pinned bulletins allowed')
          return
        }
      }

      const { error } = await supabase
        .from('bulletins')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', bulletinId)

      if (error) throw error
      loadBulletins()
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'posts', label: 'Posts', icon: MessageSquare, color: 'blue' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'orange' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'purple' },
    { id: 'bulletins', label: 'Bulletins', icon: Newspaper, color: 'green' },
    { id: 'pictures', label: 'Pictures', icon: ImageIcon, color: 'pink' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-500">Loading FAITH Administration...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      {/* Image Preview Modal */}
      <ImagePreviewModal
        images={previewImages}
        initialIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Header */}
      <div className="mb-6">
        <button 
         onClick={() => router.push('/organization')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* FAITH Admin Header */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden mb-6 shadow-sm">
        {/* Cover Photo */}
        <div className="relative h-56 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 z-0">
          {faithAdmin.cover_url ? (
            <img 
              src={faithAdmin.cover_url} 
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 opacity-90"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        
        {/* Content Container */}
        <div className="px-6 sm:px-8 pb-8 bg-white relative">
          
          <div className="flex flex-col sm:flex-row gap-6">
            
            {/* Avatar Column */}
            <div className="flex-shrink-0 -mt-16 sm:-mt-20 z-10 relative mx-auto sm:mx-0">
              {faithAdmin.avatar_url ? (
                <img 
                  src={faithAdmin.avatar_url} 
                  alt={faithAdmin.name}
                  className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl object-cover border-[6px] border-white shadow-xl bg-white"
                />
              ) : (
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-[6px] border-white shadow-xl">
                  <Shield className="h-16 w-16 text-white" />
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex-1 pt-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                
                <div>
                  <h1 className="text-3xl font-black text-gray-900 mb-1">{faithAdmin.name}</h1>
                  <p className="text-purple-600 text-sm font-bold mb-3">Official FAITH Administration</p>
                  
                  {faithAdmin.description && (
                    <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto sm:mx-0 mt-4">
                      {faithAdmin.description}
                    </p>
                  )}
                </div>

                {isFaithAdmin && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => router.push('/faith-admin/settings')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all border border-gray-200"
                    >
                      <Settings className="h-4 w-4" />
                      Manage
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-200/50">
        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${
                        tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        tab.color === 'orange' ? 'from-orange-500 to-orange-600' :
                        tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                        tab.color === 'green' ? 'from-green-500 to-green-600' :
                        'from-pink-500 to-pink-600'
                      } text-white shadow-md transform scale-105`
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <MessageSquare className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No official posts yet</p>
              </div>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-400 transition-all group relative"
                >
                  {isFaithAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePinPost(post.id, post.pin_order)
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
                        post.pin_order !== null
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                      }`}
                      title={post.pin_order !== null ? `Pinned ${post.pin_order === 1 ? '1st' : post.pin_order === 2 ? '2nd' : '3rd'}` : 'Pin post (max 3)'}
                    >
                      {post.pin_order !== null ? (
                        <Pin className="h-4 w-4 fill-current" />
                      ) : (
                        <PinOff className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  <div 
                    onClick={() => router.push(`/event/${post.event_id}?scrollTo=${post.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {faithAdmin.avatar_url ? (
                          <img src={faithAdmin.avatar_url} className="w-8 h-8 rounded-full border border-gray-200 object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div>
                          <span className="block text-sm font-bold text-gray-900 leading-tight">FAITH Administration</span>
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:text-blue-700">
                            <Calendar className="h-3 w-3" />
                            {post.event?.title || 'Event'}
                          </span>
                        </div>
                      </div>
                      
                      {post.pin_order !== null && (
                        <span className="ml-auto bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                          Pinned {post.pin_order === 1 ? '1st' : post.pin_order === 2 ? '2nd' : '3rd'}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 mb-3 line-clamp-3 pl-10">{post.content}</p>

                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className={`mb-3 pl-10 ${
                        post.image_urls.length === 1 ? 'grid grid-cols-1' :
                        post.image_urls.length === 2 ? 'grid grid-cols-2 gap-2' :
                        'grid grid-cols-3 gap-2'
                      }`}>
                        {post.image_urls.slice(0, 3).map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation() // Prevent navigating to event
                                openImagePreview(post.image_urls, idx)
                            }}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                          >
                            <img src={url} alt={`Post ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 2 && post.image_urls.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">+{post.image_urls.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 pl-10">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(post.created_at)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.reaction_count}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comments}
                      </span>
                      {post.repost_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {post.repost_count}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Calendar className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No events yet</p>
              </div>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-orange-400 transition-all group relative"
                >
                  {isFaithAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePinEvent(event.id, event.is_pinned)
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
                        event.is_pinned
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {event.is_pinned ? (
                        <Pin className="h-4 w-4 fill-current" />
                      ) : (
                        <PinOff className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  <div
                    onClick={() => router.push(`/event/${event.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3 pr-10">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                        {event.title}
                      </h3>
                    </div>

                    {event.description && (
                      <p className="text-gray-700 mb-3 line-clamp-2">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </div>
                      {event.location && (
                        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                          📍 {event.location}
                        </div>
                      )}
                    </div>

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {event.post_count || 0} posts
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <>
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Megaphone className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No announcements yet</p>
              </div>
            ) : (
              announcements.map(announcement => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-400 transition-all group relative"
                >
                  {isFaithAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePinAnnouncement(announcement.id, announcement.is_pinned)
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
                        announcement.is_pinned
                          ? 'bg-purple-400 text-purple-900'
                          : 'bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {announcement.is_pinned ? (
                        <Pin className="h-4 w-4 fill-current" />
                      ) : (
                        <PinOff className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  <div
                    onClick={() => router.push(`/home?tab=announcements&scrollTo=${announcement.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3 pr-10">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                        {announcement.header}
                      </h3>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-3">{announcement.body}</p>

                    {announcement.image_url && (
                      <div 
                        className="mb-3 rounded-lg overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation()
                          openImagePreview([announcement.image_url!], 0)
                        }}
                      >
                        <img src={announcement.image_url} alt="Announcement" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(announcement.created_at)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {announcement.reaction_count}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {announcement.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Bulletins Tab */}
        {activeTab === 'bulletins' && (
          <>
            {bulletins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Newspaper className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No bulletins yet</p>
              </div>
            ) : (
              bulletins.map(bulletin => (
                <div
                  key={bulletin.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-400 transition-all group relative"
                >
                  {isFaithAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePinBulletin(bulletin.id, bulletin.is_pinned)
                      }}
                      className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
                        bulletin.is_pinned
                          ? 'bg-green-400 text-green-900'
                          : 'bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {bulletin.is_pinned ? (
                        <Pin className="h-4 w-4 fill-current" />
                      ) : (
                        <PinOff className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  <div
                    onClick={() => router.push(`/home?tab=bulletin&scrollTo=${bulletin.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3 pr-10">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-green-600 transition-colors">
                        {bulletin.header}
                      </h3>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-3">{bulletin.body}</p>

                    {bulletin.image_urls && bulletin.image_urls.length > 0 && (
                      <div className={`mb-3 ${
                        bulletin.image_urls.length === 1 ? 'grid grid-cols-1' :
                        bulletin.image_urls.length === 2 ? 'grid grid-cols-2 gap-2' :
                        'grid grid-cols-3 gap-2'
                      }`}>
                        {bulletin.image_urls.slice(0, 3).map((url, idx) => (
                          <div 
                            key={idx} 
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              openImagePreview(bulletin.image_urls, idx)
                            }}
                          >
                            <img src={url} alt={`Bulletin ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 2 && bulletin.image_urls.length > 3 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">+{bulletin.image_urls.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(bulletin.created_at)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {bulletin.reaction_count}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {bulletin.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Pictures Tab */}
        {activeTab === 'pictures' && (
          <>
            {pictures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No pictures yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pictures.map((url, idx) => (
                  <div 
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:scale-105 transition-transform cursor-pointer group"
                    onClick={() => openImagePreview(pictures, idx)}
                  >
                    <img 
                      src={url} 
                      alt={`Picture ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function FaithAdminPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <FaithAdminContent />
    </Suspense>
  )
}