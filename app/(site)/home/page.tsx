// app/(site)/home/page.tsx
"use client"
import { useState, useEffect } from "react"
import { Globe, Users, Megaphone, Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Organization, EventItem } from "@/app/(site)/home/types"
import { EventCard } from "@/components/feed/EventCard"
import { CreateEventButton } from "@/components/home/CreateEventButton"
import { FeedFilters } from "@/components/home/FeedFilters"

export default function HomePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // --- UI State ---
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  // --- Data State ---
  const [events, setEvents] = useState<EventItem[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]) // For the Filter Bar
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([]) // For the Create Button
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 1. Fetch Data (User, Orgs, Events)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        // --- A. Fetch User Permissions (If logged in) ---
        if (user) {
          // 1. Check Admin Status
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setIsFaithAdmin(profile?.role === 'admin')

          // 2. Fetch User's Officer/Admin Memberships (For Create Button)
          const { data: memberships } = await supabase
            .from('user_organizations')
            .select(`
              role,
              organization:organizations (id, code, name)
            `)
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

        // --- B. Fetch All Organizations (For Filters) ---
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, code, name, member_count')
          .order('name')
        
        if (orgsError) throw orgsError

        // Manually prepend "FAITH Administration" so it appears in the filter list
        const fetchedOrgs: Organization[] = [
          { id: "faith_admin", code: "FAITH", name: "FAITH Administration", role: "admin", members: 0 },
          ...(orgsData?.map((o: any) => ({
            id: o.id,
            code: o.code,
            name: o.name,
            role: '', // Role doesn't matter for the public filter list
            members: o.member_count
          })) || [])
        ]
        setAllOrganizations(fetchedOrgs)

        // --- C. Fetch Events ---
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`*, creator_org:organizations(name)`)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        const mappedEvents: EventItem[] = eventsData.map((row: any) => {
          const start = new Date(row.start_date)
          const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          let organizerName = "Unknown"
          let organizerType = "user"
          
          // Map types
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
        console.error("Error loading home data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
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
        
        // Handle standard Orgs:
        // We find the org object in our fetched list to match the name
        // (Since event.organizer.name is just a string from the join)
        const targetOrgName = allOrganizations.find(o => o.id === selectedOrg)?.name
        return event.organizer.name === targetOrgName
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