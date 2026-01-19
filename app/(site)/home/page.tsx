"use client"

import { useState, useEffect, Suspense } from "react" // Added Suspense import
import { Newspaper, Calendar, Megaphone, Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Organization, EventItem } from "@/app/(site)/home/types"
import { EventCard } from "@/components/feed/EventCard"
import { CreateButton } from "@/components/home/CreateButton"
import { FeedFilters } from "@/components/home/FeedFilters"
import { AnnouncementCard } from "@/components/feed/AnnouncementCard"
import { BulletinCard } from "@/components/feed/BulletinCard"
import { useSearchParams } from "next/navigation"

// --- TYPES ---
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

// --- LOADING FALLBACK COMPONENT ---
function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
      <p>Loading campus content...</p>
    </div>
  )
}

// --- MAIN CONTENT COMPONENT (Inner) ---
function HomeContent() {
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [activeFeedFilter, setActiveFeedFilter] = useState("bulletin")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  const [events, setEvents] = useState<EventItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

        await Promise.all([loadEvents(), loadAnnouncements(), loadBulletins()])

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
    if (tab && ['bulletin', 'events', 'announcements'].includes(tab)) {
      setActiveFeedFilter(tab)
    }
  }, [searchParams])

  const feedFilters = [
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
    if (activeFeedFilter === "events" || activeFeedFilter === "bulletin") {
      return false
    }

    if (activeFeedFilter === "announcements") {
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
    }

    return false
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

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">Braveboard</h1>
            <p className="text-gray-600 text-sm">
              {activeFeedFilter === "bulletin" && !selectedOrg && "Community updates and posts"}
              {activeFeedFilter === "bulletin" && selectedOrg && "Organization bulletins and updates"}
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
                      ? `bg-gradient-to-r ${filter.color === "blue" ? "from-blue-500 to-blue-600" : filter.color === "orange" ? "from-orange-500 to-orange-600" : "from-purple-500 to-purple-600"} text-white shadow-md`
                      : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              )
            })}
          </div>
          
          <CreateButton 
            activeFeedFilter={activeFeedFilter}
            isFaithAdmin={isFaithAdmin}
            userCreateOrgs={userCreateOrgs}
          />
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
            {activeFeedFilter === "bulletin" && 
              filteredBulletins.map(bulletin => (
                <BulletinCard key={bulletin.id} bulletin={bulletin} onUpdate={loadBulletins} />
              ))
            }
            
            {activeFeedFilter === "announcements" && 
              filteredAnnouncements.map(announcement => (
                <AnnouncementCard key={announcement.id} announcement={announcement} onUpdate={loadAnnouncements} />
              ))
            }
            
            {activeFeedFilter === "events" && 
              filteredEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  isPostsHidden={hiddenEvents.has(event.id)}
                  onToggleHide={(e) => toggleHideEvent(event.id, e)}
                  onPostCreated={loadEvents}
                  onEventDeleted={() => handleEventDeleted(event.id)}
                />
              ))
            }

            {filteredEvents.length === 0 && filteredAnnouncements.length === 0 && filteredBulletins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No content found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// --- EXPORTED DEFAULT COMPONENT ---
export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  )
}