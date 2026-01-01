"use client"
import { useState, useEffect } from "react"
import { Globe, Users, Megaphone } from "lucide-react"
import { Organization, EventItem } from "@/app/(site)/home/types"
import { EventCard } from "@/components/feed/EventCard"
import { CreateEventButton } from "@/components/home/CreateEventButton"
import { FeedFilters } from "@/components/home/FeedFilters"

// --- Mock Data (Ideally fetch this from API/Hooks) ---
const MOCK_ORGS = [
  { id: "fec", code: "FEC", name: "FAITH Esports Club", role: "officer", members: 120 },
  { id: "lighthouse", code: "LH", name: "Lighthouse", role: "admin", members: 85 },
  { id: "sc", code: "SC", name: "Student Council", role: "", members: 45 },
]

// ... (Your events array goes here, kept in parent for now)
const MOCK_EVENTS: EventItem[] = [
    // Paste your 'events' array here
    {
      id: 1,
      title: "Midterm Examinations",
      organizer: { type: "faith", name: "FAITH Administration" },
      date: "Mar 15-20",
      tags: ["Public", "All Students", "Exams"],
      visibility: "All Departments",
      visibilityType: "public",
      postingRestricted: false,
      isPinned: true,
      participants: 245,
      totalPosts: 28,
      posts: [
         // ... posts data
         {
          id: 101,
          author: "FAITH Administration",
          authorType: "department",
          content: "Midterm exams will be held as scheduled.",
          time: "3 hours ago",
          likes: 245,
          comments: 42,
          imageUrls: []
         }
      ]
    },
    // ... other events
]

export default function HomePage() {
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  // Create Event Logic State
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)

  // Simulation of Data Fetching
  useEffect(() => {
    // Simulate fetching user permissions
    setIsFaithAdmin(true)
    const validOrgs = MOCK_ORGS.filter(o => ['officer', 'admin'].includes(o.role))
    setUserCreateOrgs(validOrgs)
  }, [])

  const feedFilters = [
    { id: "feed", label: "Campus Feed", icon: Globe, color: "blue" },
    { id: "org", label: "Organization", icon: Users, color: "orange" },
    { id: "announcements", label: "Announcements", icon: Megaphone, color: "purple" },
  ]

  const toggleHideEvent = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setHiddenEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) newSet.delete(eventId)
      else newSet.add(eventId)
      return newSet
    })
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      {/* Header Section */}
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

        {/* Tabs & Action Button */}
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

      {/* Secondary Filters */}
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

      {/* Events Feed */}
      <div className="space-y-5">
        {MOCK_EVENTS.map(event => (
          <EventCard 
            key={event.id}
            event={event}
            isPostsHidden={hiddenEvents.has(event.id)}
            onToggleHide={(e) => toggleHideEvent(event.id, e)}
          />
        ))}
      </div>
    </div>
  )
}