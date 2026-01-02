"use client"
import { useState, useEffect } from "react"
import { Globe, Users, Megaphone, Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Organization, EventItem } from "@/app/(site)/home/types"
import { EventCard } from "@/components/feed/EventCard"
import { CreateEventButton } from "@/components/home/CreateEventButton"
import { FeedFilters } from "@/components/home/FeedFilters"

// --- Mock Data ---
// Added FAITH Admin as the first organization
const MOCK_ORGS = [
  { id: "faith_admin", code: "FAITH", name: "FAITH", role: "admin", members: 0 },
  { id: "fec", code: "FEC", name: "FAITH Esports Club", role: "officer", members: 120 },
  { id: "lighthouse", code: "LH", name: "Lighthouse", role: "admin", members: 85 },
  { id: "sc", code: "SC", name: "Student Council", role: "", members: 45 },
]

export default function HomePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)

  // 1. Fetch User Permissions
  useEffect(() => {
    async function loadUserPermissions() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsFaithAdmin(profile?.role === 'admin')

      // Mock permissions for now
      const validOrgs = MOCK_ORGS.filter(o => ['officer', 'admin'].includes(o.role) && o.id !== 'faith_admin')
      setUserCreateOrgs(validOrgs)
    }
    loadUserPermissions()
  }, [])

  // 2. Fetch Events
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`*, creator_org:organizations(name)`)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) throw error

        const mappedEvents: EventItem[] = data.map((row: any) => {
          const start = new Date(row.start_date)
          const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          let organizerName = "Unknown"
          let organizerType = "user"
          
          // Map types
          if (row.creator_type === 'faith_admin') {
            organizerName = "FAITH Administration"
            organizerType = "faith" // Special type for color coding
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
            posts: []
          }
        })

        setEvents(mappedEvents)
      } catch (err) {
        console.error("Error fetching events:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const feedFilters = [
    { id: "feed", label: "Campus Feed", icon: Globe, color: "blue" },
    { id: "org", label: "Organization", icon: Users, color: "orange" },
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

  // --- FILTER LOGIC ---
  const filteredEvents = events.filter(event => {
    // 1. Search
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // 2. Tabs
    if (activeFeedFilter === "org") {
      // Allow both 'organization' type AND 'faith' type in the Org tab
      const isOrgOrFaith = event.organizer.type === "organization" || event.organizer.type === "faith"
      
      if (!isOrgOrFaith) return false

      // If a specific sub-filter is selected
      if (selectedOrg) {
        // Handle FAITH Admin selection specially
        if (selectedOrg === 'faith_admin') {
           return event.organizer.type === 'faith'
        }
        // Handle standard Orgs by matching name (mock logic)
        return event.organizer.name === MOCK_ORGS.find(o => o.id === selectedOrg)?.name
      }
      
      return true
    }

    if (activeFeedFilter === "announcements") {
       return event.organizer.type === "faith" || event.isPinned
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
              {activeFeedFilter === "feed" && "See what's happening across campus"}
              {activeFeedFilter === "org" && "Organization updates and events"}
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
          
          <CreateEventButton 
            activeFeedFilter={activeFeedFilter}
            isFaithAdmin={isFaithAdmin}
            userCreateOrgs={userCreateOrgs}
          />
        </div>
      </div>

      <FeedFilters 
        activeFilter={activeFeedFilter}
        organizations={MOCK_ORGS}
        selectedOrg={selectedOrg}
        setSelectedOrg={setSelectedOrg}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSource={selectedAnnouncementSource}
        setSelectedSource={setSelectedAnnouncementSource}
      />

      <div className="space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
            <p>Loading campus events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <EventCard 
              key={event.id}
              event={event}
              isPostsHidden={hiddenEvents.has(event.id)}
              onToggleHide={(e) => toggleHideEvent(event.id, e)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">No events found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}