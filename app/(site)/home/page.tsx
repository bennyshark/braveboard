// app/(site)/home/page.tsx - UPDATED with scroll to content functionality
"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { Newspaper, Calendar, Megaphone, MessageSquare, Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Organization, EventItem } from "@/app/(site)/home/types"
import { EventCard } from "@/components/feed/EventCard"
import { CreateButton } from "@/components/home/CreateButton"
import { FeedFilters } from "@/components/home/FeedFilters"
import { AnnouncementCard } from "@/components/feed/AnnouncementCard"
import { BulletinCard } from "@/components/feed/BulletinCard"
import { FreeWallCard } from "@/components/feed/FreeWallCard"
import { RepostCard } from "@/components/feed/RepostCard"
import { CreateFreeWallPostDialog } from "@/components/posts/CreateFreeWallPostDialog"
import { useSearchParams } from "next/navigation"

type Announcement = {
  id: string
  header: string
  body: string
  organizerType: string
  organizerName: string
  imageUrl: string | null
  isPinned: boolean
  likes: number
  comments: number
  allowComments: boolean
  createdAt: string
}

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

type FreeWallPost = {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  imageUrls: string[]
  reactionCount: number
  comments: number
  repostCount: number
  createdAt: string
  editedAt: string | null
}

type Repost = {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  contentType: 'post' | 'bulletin' | 'announcement' | 'free_wall_post' | 'repost'
  contentId: string
  repostComment: string | null
  createdAt: string
}

function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
      <p>Loading campus content...</p>
    </div>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [activeFeedFilter, setActiveFeedFilter] = useState("free_wall")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  const [events, setEvents] = useState<EventItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [freeWallPosts, setFreeWallPosts] = useState<FreeWallPost[]>([])
  const [reposts, setReposts] = useState<Repost[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [pendingScrollTo, setPendingScrollTo] = useState<{tab: string, id: string} | null>(null)

  const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // Function to handle navigation to content
  const handleNavigateToContent = (tab: string, contentId: string) => {
    // Switch tab
    setActiveFeedFilter(tab)
    // Set pending scroll
    setPendingScrollTo({ tab, id: contentId })
  }

  const loadEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`*, creator_org:organizations(name)`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

      const eventIds = eventsData.map((e: any) => e.id)
      
      const { data: allPosts, error: postsError } = await supabase
        .from('posts')
        .select('*, posted_as_type, posted_as_org_id, comments')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      const postsByEvent = new Map<string, any[]>()
      allPosts.forEach((post: any) => {
        if (!postsByEvent.has(post.event_id)) {
          postsByEvent.set(post.event_id, [])
        }
        const eventPosts = postsByEvent.get(post.event_id)!
        if (eventPosts.length < 3) {
          eventPosts.push(post)
        }
      })

      const authorIds = [...new Set(allPosts.map((p: any) => p.author_id))]
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      const authorMap = new Map(
        authorsData?.map(author => [
          author.id, 
          {
            name: `${author.first_name || 'Unknown'} ${author.last_name || 'User'}`,
            avatarUrl: author.avatar_url
          }
        ]) || []
      )

      const orgIds = [...new Set(
        allPosts
          .filter((p: any) => p.posted_as_type === 'organization' && p.posted_as_org_id)
          .map((p: any) => p.posted_as_org_id)
      )]
      
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, avatar_url')
        .in('id', orgIds)

      const orgMap = new Map(
        orgsData?.map(org => [
          org.id,
          {
            name: org.name,
            avatarUrl: org.avatar_url
          }
        ]) || []
      )

      const mappedEvents: EventItem[] = eventsData.map((row: any) => {
        const start = new Date(row.start_date)
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        let organizerName = "Unknown"
        let organizerType = "user"
        
        if (row.creator_type === 'faith_admin') {
          organizerName = "FAITH Administration"
          organizerType = "faith" 
        } else if (row.creator_type === 'organization') {
          organizerName = row.creator_org?.name || "Organization"
          organizerType = "organization"
        }

        const visibilityMap: Record<string, string> = {
          'public': 'Public',
          'organization': 'Selected Orgs',
          'department': 'Selected Depts',
          'course': 'Selected Courses',
          'mixed': 'Custom Group'
        }

        const eventPosts = postsByEvent.get(row.id) || []
        const posts = eventPosts.map((p: any) => {
          let displayName = 'Unknown User'
          let displayAvatar = null
          let displayAuthorType = 'user'

          if (p.posted_as_type === 'faith_admin') {
            displayName = 'FAITH Administration'
            displayAvatar = null
            displayAuthorType = 'faith_admin'
          } else if (p.posted_as_type === 'organization' && p.posted_as_org_id) {
            const orgData = orgMap.get(p.posted_as_org_id)
            displayName = orgData?.name || 'Organization'
            displayAvatar = orgData?.avatarUrl || null
            displayAuthorType = 'organization'
          } else {
            const authorData = authorMap.get(p.author_id) || { name: 'Unknown User', avatarUrl: null }
            displayName = authorData.name
            displayAvatar = authorData.avatarUrl
            displayAuthorType = 'user'
          }

          return {
            id: p.id,
            author: displayName,
            authorId: p.author_id,
            authorType: displayAuthorType,
            avatarUrl: displayAvatar,
            content: p.content || "",
            time: new Date(p.created_at).toLocaleString('en-US', { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            }),
            likes: p.likes || 0,
            comments: p.comments || 0,
            imageUrls: p.image_urls || []
          }
        })

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          organizer: { type: organizerType, name: organizerName },
          date: dateStr,
          tags: row.tags || [],
          visibility: visibilityMap[row.participant_type] || 'Restricted',
          visibilityType: row.participant_type,
          postingRestricted: row.who_can_post === 'officers',
          isPinned: row.is_pinned,
          participants: row.participant_count || 0,
          totalPosts: row.post_count || 0,
          posts: posts
        }
      })

      setEvents(mappedEvents)
    } catch (err) {
      console.error("Error loading events:", err)
    }
  }

  const loadAnnouncements = async () => {
    try {
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select(`*, creator_org:organizations(name)`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedAnnouncements: Announcement[] = announcementsData.map((row: any) => {
        let organizerName = "Unknown"
        let organizerType = "user"
        
        if (row.creator_type === 'faith_admin') {
          organizerName = "FAITH Administration"
          organizerType = "faith" 
        } else if (row.creator_type === 'organization') {
          organizerName = row.creator_org?.name || "Organization"
          organizerType = "organization"
        }

        return {
          id: row.id,
          header: row.header,
          body: row.body,
          organizerType,
          organizerName,
          imageUrl: row.image_url,
          isPinned: row.is_pinned,
          likes: row.likes || 0,
          comments: row.comments || 0,
          allowComments: row.allow_comments ?? true,
          createdAt: new Date(row.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      })

      setAnnouncements(mappedAnnouncements)
    } catch (err) {
      console.error("Error loading announcements:", err)
    }
  }

  const loadBulletins = async () => {
    try {
      const { data: bulletinsData, error } = await supabase
        .from('bulletins')
        .select(`*, creator_org:organizations(name)`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedBulletins: Bulletin[] = bulletinsData.map((row: any) => {
        let organizerName = "Unknown"
        let organizerType = "user"
        
        if (row.creator_type === 'faith_admin') {
          organizerName = "FAITH Administration"
          organizerType = "faith" 
        } else if (row.creator_type === 'organization') {
          organizerName = row.creator_org?.name || "Organization"
          organizerType = "organization"
        }

        return {
          id: row.id,
          header: row.header,
          body: row.body,
          organizerType,
          organizerName,
          imageUrls: row.image_urls || [],
          isPinned: row.is_pinned,
          likes: row.likes || 0,
          comments: row.comments || 0,
          allowComments: row.allow_comments ?? true,
          createdAt: new Date(row.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      })

      setBulletins(mappedBulletins)
    } catch (err) {
      console.error("Error loading bulletins:", err)
    }
  }

  const loadFreeWall = async () => {
    try {
      const [postsRes, repostsRes] = await Promise.all([
        supabase
          .from('free_wall_posts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('reposts')
          .select('*')
          .in('content_type', ['post', 'bulletin', 'announcement', 'free_wall_post', 'repost'])
          .order('created_at', { ascending: false })
      ])

      if (postsRes.error) throw postsRes.error
      if (repostsRes.error) throw repostsRes.error

      const authorIds = [...new Set(postsRes.data.map((p: any) => p.author_id))]
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      const authorMap = new Map(
        authorsData?.map(author => [
          author.id,
          {
            name: `${author.first_name || 'Unknown'} ${author.last_name || 'User'}`,
            avatarUrl: author.avatar_url
          }
        ]) || []
      )

      const mappedPosts: FreeWallPost[] = postsRes.data.map((p: any) => {
        const authorData = authorMap.get(p.author_id) || { name: 'Unknown User', avatarUrl: null }
        return {
          id: p.id,
          content: p.content,
          authorId: p.author_id,
          authorName: authorData.name,
          authorAvatar: authorData.avatarUrl,
          imageUrls: p.image_urls || [],
          reactionCount: p.reaction_count || 0,
          comments: p.comments || 0,
          repostCount: p.repost_count || 0,
          createdAt: new Date(p.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          }),
          editedAt: p.edited_at
        }
      })

      const reposterIds = [...new Set(repostsRes.data.map((r: any) => r.user_id))]
      const { data: repostersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', reposterIds)

      const reposterMap = new Map(
        repostersData?.map(user => [
          user.id,
          {
            name: `${user.first_name || 'Unknown'} ${user.last_name || 'User'}`,
            avatarUrl: user.avatar_url
          }
        ]) || []
      )

      const mappedReposts: Repost[] = repostsRes.data.map((r: any) => {
        const reposterData = reposterMap.get(r.user_id) || { name: 'Unknown User', avatarUrl: null }
        return {
          id: r.id,
          userId: r.user_id,
          userName: reposterData.name,
          userAvatar: reposterData.avatarUrl,
          contentType: r.content_type,
          contentId: r.content_id,
          repostComment: r.repost_comment,
          createdAt: new Date(r.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      })

      setFreeWallPosts(mappedPosts)
      setReposts(mappedReposts)
    } catch (err) {
      console.error("Error loading free wall:", err)
    }
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setIsFaithAdmin(profile?.role === 'admin')

          const { data: memberships } = await supabase
            .from('user_organizations')
            .select(`role, organization:organizations (id, code, name)`)
            .eq('user_id', user.id)
            .in('role', ['officer', 'admin'])
          
          const validUserOrgs: Organization[] = memberships?.map((m: any) => ({
            id: m.organization.id,
            code: m.organization.code,
            name: m.organization.name,
            role: m.role
          })) || []
          
          setUserCreateOrgs(validUserOrgs)
        }

        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, code, name, member_count')
          .order('name')
        
        if (orgsError) throw orgsError

        const fetchedOrgs: Organization[] = [
          { id: "faith_admin", code: "FAITH", name: "FAITH Administration", role: "admin", members: 0 },
          ...(orgsData?.map((o: any) => ({
            id: o.id,
            code: o.code,
            name: o.name,
            role: '',
            members: o.member_count
          })) || [])
        ]
        setAllOrganizations(fetchedOrgs)

        await Promise.all([loadEvents(), loadAnnouncements(), loadBulletins(), loadFreeWall()])

      } catch (err) {
        console.error("Error loading home data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    const scrollTo = searchParams.get('scrollTo')
    
    if (tab && ['free_wall', 'bulletin', 'events', 'announcements'].includes(tab)) {
      setActiveFeedFilter(tab)
    }

    // Scroll to content after data loads
    if (scrollTo && !isLoading) {
      setTimeout(() => {
        const element = contentRefs.current.get(scrollTo)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedId(scrollTo)
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedId(null)
          }, 3000)
        }
      }, 500)
    }
  }, [searchParams, isLoading])

  // Handle pending scroll after tab change
  useEffect(() => {
    if (pendingScrollTo && !isLoading) {
      setTimeout(() => {
        const element = contentRefs.current.get(pendingScrollTo.id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedId(pendingScrollTo.id)
          setPendingScrollTo(null)
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedId(null)
          }, 3000)
        } else {
          // If element not found, try again after a short delay
          setTimeout(() => {
            const retryElement = contentRefs.current.get(pendingScrollTo.id)
            if (retryElement) {
              retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              setHighlightedId(pendingScrollTo.id)
              setPendingScrollTo(null)
              
              setTimeout(() => {
                setHighlightedId(null)
              }, 3000)
            }
          }, 300)
        }
      }, 100)
    }
  }, [pendingScrollTo, isLoading, activeFeedFilter])

  const feedFilters = [
    { id: "free_wall", label: "Free Wall", icon: MessageSquare, color: "gray" },
    { id: "bulletin", label: "Bulletin", icon: Newspaper, color: "blue" },
    { id: "events", label: "Events", icon: Calendar, color: "orange" },
    { id: "announcements", label: "Announcements", icon: Megaphone, color: "purple" },
  ]

  const toggleHideEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHiddenEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) newSet.delete(eventId)
      else newSet.add(eventId)
      return newSet
    })
  }

  const handleEventDeleted = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const filteredEvents = events.filter(event => {
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    if (activeFeedFilter === "events") {
      const isOrgOrFaith = event.organizer.type === "organization" || event.organizer.type === "faith"
      if (!isOrgOrFaith) return false

      if (selectedOrg) {
        if (selectedOrg === 'faith_admin') {
           return event.organizer.type === 'faith'
        }
        const targetOrgName = allOrganizations.find(o => o.id === selectedOrg)?.name
        return event.organizer.name === targetOrgName
      }
      return true
    }

    return false
  })

  const filteredAnnouncements = announcements.filter(announcement => {
    if (activeFeedFilter !== "announcements") return false

    if (!selectedAnnouncementSource || selectedAnnouncementSource === "all") {
      return true
    }
    
    const sourceMap: Record<string, string> = {
      "faith": "FAITH Administration",
      "sc": "Student Council",
      "lighthouse": "Lighthouse"
    }
    
    const targetName = sourceMap[selectedAnnouncementSource]
    return announcement.organizerName === targetName
  })

  const filteredBulletins = bulletins.filter(bulletin => {
    if (activeFeedFilter !== "bulletin") return false
    
    if (searchTerm && !bulletin.header.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    const isOrgOrFaith = bulletin.organizerType === "organization" || bulletin.organizerType === "faith"
    if (!isOrgOrFaith) return false

    if (selectedOrg) {
      if (selectedOrg === 'faith_admin') {
         return bulletin.organizerType === 'faith'
      }
      const targetOrgName = allOrganizations.find(o => o.id === selectedOrg)?.name
      return bulletin.organizerName === targetOrgName
    }
    return true
  })

  const freeWallContent = activeFeedFilter === "free_wall" ? 
    [...freeWallPosts.map(p => ({ type: 'post' as const, data: p, timestamp: new Date(p.createdAt).getTime() })),
     ...reposts.map(r => ({ type: 'repost' as const, data: r, timestamp: new Date(r.createdAt).getTime() }))]
      .sort((a, b) => b.timestamp - a.timestamp)
    : []

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">Braveboard</h1>
            <p className="text-gray-600 text-sm">
              {activeFeedFilter === "free_wall" && "Share your thoughts, discover more"}
              {activeFeedFilter === "bulletin" && "Community updates and posts"}
              {activeFeedFilter === "events" && "Organization events and activities"}
              {activeFeedFilter === "announcements" && "Official campus announcements"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide flex-1">
            {feedFilters.map((filter) => {
              const Icon = filter.icon
              const isActive = activeFeedFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFeedFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${
                          filter.color === "gray" ? "from-gray-500 to-gray-600" :
                          filter.color === "blue" ? "from-blue-500 to-blue-600" : 
                          filter.color === "orange" ? "from-orange-500 to-orange-600" : 
                          "from-purple-500 to-purple-600"
                        } text-white shadow-md`
                      : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              )
            })}
          </div>
          
          {activeFeedFilter === "free_wall" ? (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              Create Post
            </button>
          ) : (
            <CreateButton 
              activeFeedFilter={activeFeedFilter}
              isFaithAdmin={isFaithAdmin}
              userCreateOrgs={userCreateOrgs}
            />
          )}
        </div>
      </div>

      <FeedFilters 
        activeFilter={activeFeedFilter}
        organizations={allOrganizations} 
        selectedOrg={selectedOrg}
        setSelectedOrg={setSelectedOrg}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSource={selectedAnnouncementSource}
        setSelectedSource={setSelectedAnnouncementSource}
      />

      <div className="space-y-5">
        {isLoading ? (
          <HomeLoading />
        ) : (
          <>
            {activeFeedFilter === "free_wall" && 
              freeWallContent.map((item, idx) => (
                <div 
                  key={item.type === 'post' ? `post-${item.data.id}` : `repost-${item.data.id}`}
                  ref={(el) => {
                    if (el) {
                      contentRefs.current.set(item.data.id, el)
                    }
                  }}
                  className={`transition-all duration-500 ${
                    highlightedId === item.data.id ? 'ring-4 ring-blue-400 rounded-2xl' : ''
                  }`}
                >
                  {item.type === 'post' ? (
                    <FreeWallCard post={item.data} onUpdate={loadFreeWall} />
                  ) : (
                    <RepostCard 
                      repost={item.data} 
                      onUpdate={loadFreeWall} 
                      onNavigateToContent={handleNavigateToContent}
                    />
                  )}
                </div>
              ))
            }
            
            {activeFeedFilter === "bulletin" && 
              filteredBulletins.map(bulletin => (
                <div
                  key={bulletin.id}
                  ref={(el) => {
                    if (el) {
                      contentRefs.current.set(bulletin.id, el)
                    }
                  }}
                  className={`transition-all duration-500 ${
                    highlightedId === bulletin.id ? 'ring-4 ring-blue-400 rounded-2xl' : ''
                  }`}
                >
                  <BulletinCard bulletin={bulletin} onUpdate={loadBulletins} />
                </div>
              ))
            }
            
            {activeFeedFilter === "announcements" && 
              filteredAnnouncements.map(announcement => (
                <div
                  key={announcement.id}
                  ref={(el) => {
                    if (el) {
                      contentRefs.current.set(announcement.id, el)
                    }
                  }}
                  className={`transition-all duration-500 ${
                    highlightedId === announcement.id ? 'ring-4 ring-blue-400 rounded-2xl' : ''
                  }`}
                >
                  <AnnouncementCard announcement={announcement} onUpdate={loadAnnouncements} />
                </div>
              ))
            }
            
            {activeFeedFilter === "events" && 
              filteredEvents.map(event => (
                <div
                  key={event.id}
                  ref={(el) => {
                    if (el) {
                      contentRefs.current.set(event.id, el)
                      // Also add refs for posts within the event
                      event.posts.forEach(post => {
                        contentRefs.current.set(post.id, el)
                      })
                    }
                  }}
                  className={`transition-all duration-500 ${
                    highlightedId === event.id || event.posts.some(p => p.id === highlightedId) ? 'ring-4 ring-blue-400 rounded-2xl' : ''
                  }`}
                >
                  <EventCard 
                    event={event}
                    isPostsHidden={hiddenEvents.has(event.id)}
                    onToggleHide={(e) => toggleHideEvent(event.id, e)}
                    onPostCreated={loadEvents}
                    onEventDeleted={() => handleEventDeleted(event.id)}
                  />
                </div>
              ))
            }

            {((activeFeedFilter === "free_wall" && freeWallContent.length === 0) ||
              (activeFeedFilter === "events" && filteredEvents.length === 0) ||
              (activeFeedFilter === "announcements" && filteredAnnouncements.length === 0) ||
              (activeFeedFilter === "bulletin" && filteredBulletins.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No content found.</p>
              </div>
            )}
          </>
        )}
      </div>

      <CreateFreeWallPostDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onPostCreated={loadFreeWall}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  )
}