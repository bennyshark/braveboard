"use client"

import { 
  Globe, 
  Users, 
  Megaphone, 
  Plus, 
  Image, 
  Calendar, 
  MapPin, 
  Tag,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Bookmark,
  Share2,
  MessageCircle,
  Clock,
  Pin,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  const feedFilters = [
    { id: "feed", label: "Campus Feed", icon: Globe, color: "blue" },
    { id: "org", label: "Organization", icon: Users, color: "orange" },
    { id: "announcements", label: "Announcements", icon: Megaphone, color: "purple" },
  ]

  const organizations = [
    { id: "fec", code: "FEC", name: "FAITH Esports Club", members: 120 },
    { id: "lighthouse", code: "LH", name: "Lighthouse", members: 85 },
    { id: "sc", code: "SC", name: "Student Council", members: 45 },
    { id: "dsc", code: "DSC", name: "Developer Student Club", members: 200 },
    { id: "acm", code: "ACM", name: "ACM Student Chapter", members: 150 },
    { id: "cheerdance", code: "CDC", name: "Cheerdance Club", members: 60 },
    { id: "music", code: "MSC", name: "Music Society", members: 90 },
    { id: "theater", code: "TAG", name: "Theater Arts Guild", members: 70 },
  ]

  const announcementSources = [
    { id: "faith", name: "FAITH Administration" },
    { id: "scouncil", name: "Student Council" },
    { id: "lighthouse", name: "Lighthouse" },
    { id: "all", name: "All Announcements" },
  ]

  const events = [
    {
      id: 1,
      title: "Midterm Examinations",
      organizer: { type: "faith", name: "FAITH Administration" },
      date: "Mar 15-20",
      tags: ["Public", "All Students", "Exams"],
      visibility: "All Departments",
      isPinned: true,
      participants: 245,
      totalPosts: 28,
      posts: [
        {
          id: 101,
          author: "FAITH Administration",
          authorType: "department",
          content: "Midterm exams will be held as scheduled. Check your portal for room assignments.",
          time: "3 hours ago",
          likes: 245,
          comments: 42,
          images: 0
        },
        {
          id: 102,
          author: "Maria Santos",
          authorType: "user",
          content: "Good luck everyone! Study hard and don't forget to bring your IDs.",
          time: "2 hours ago",
          likes: 89,
          comments: 15,
          images: 0
        },
        {
          id: 103,
          author: "John Dela Cruz",
          authorType: "user",
          content: "Does anyone know if we can use calculators for the Math exam?",
          time: "1 hour ago",
          likes: 34,
          comments: 8,
          images: 0
        }
      ]
    },
    {
      id: 2,
      title: "Valorant Tournament Finals",
      organizer: { type: "org", name: "FAITH Esports Club" },
      date: "Tomorrow",
      tags: ["Esports", "FEC", "CCIT Only"],
      visibility: "FEC Members & CCIT Students",
      isPinned: false,
      participants: 89,
      totalPosts: 15,
      posts: [
        {
          id: 201,
          author: "FEC President",
          authorType: "org",
          content: "Finals starting at 6 PM sharp! Live stream available on our YouTube channel.",
          time: "1 day ago",
          likes: 189,
          comments: 28,
          images: 3
        },
        {
          id: 202,
          author: "Team Captain",
          authorType: "user",
          content: "Practice sessions today at 4 PM in the Esports Lab. All teams required.",
          time: "5 hours ago",
          likes: 67,
          comments: 12,
          images: 1
        },
        {
          id: 203,
          author: "Alex Rivera",
          authorType: "user",
          content: "Will there be prize money for the winners? Super excited for this!",
          time: "4 hours ago",
          likes: 45,
          comments: 7,
          images: 0
        }
      ]
    },
    {
      id: 3,
      title: "Campus Cleanup Drive",
      organizer: { type: "org", name: "Student Council" },
      date: "This Saturday",
      tags: ["Volunteer", "Environment", "All Students"],
      visibility: "All Departments",
      isPinned: false,
      participants: 67,
      totalPosts: 8,
      posts: [
        {
          id: 301,
          author: "Student Council",
          authorType: "org",
          content: "Meeting at the main gate at 8 AM. Gloves and bags provided. Refreshments after!",
          time: "2 days ago",
          likes: 134,
          comments: 31,
          images: 2
        },
        {
          id: 302,
          author: "Sarah Chen",
          authorType: "user",
          content: "Can we bring our own eco-bags? I have some extra to share!",
          time: "1 day ago",
          likes: 56,
          comments: 12,
          images: 0
        }
      ]
    }
  ]

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleHideEvent = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setHiddenEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const getAuthorIcon = (authorType: string) => {
    switch(authorType) {
      case "department":
        return "🏫"
      case "org":
        return "👥"
      case "user":
        return "👤"
      default:
        return "👤"
    }
  }

  const getAuthorColor = (authorType: string) => {
    switch(authorType) {
      case "department":
        return "from-purple-400 to-purple-600"
      case "org":
        return "from-orange-400 to-orange-600"
      case "user":
        return "from-blue-400 to-blue-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      
      {/* Header */}
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

        {/* Main Filter Tabs - Compact */}
        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {feedFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFeedFilter === filter.id
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFeedFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${filter.color === "blue" ? "from-blue-500 to-blue-600 text-white shadow-md" : filter.color === "orange" ? "from-orange-500 to-orange-600 text-white shadow-md" : "from-purple-500 to-purple-600 text-white shadow-md"}`
                    : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sub-filter Dropdowns - Compact */}
      {activeFeedFilter === "org" && (
        <div className="mb-4 bg-white rounded-lg border border-gray-300 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="font-bold text-gray-900 text-sm">Filter:</span>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedOrg(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedOrg === null ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All
                </button>
                {organizations.slice(0, 3).map(org => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedOrg === org.id ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {org.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="search"
                placeholder="Search..."
                className="pl-7 pr-2 py-1 border border-gray-300 rounded-lg text-xs w-32 focus:border-orange-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {activeFeedFilter === "announcements" && (
        <div className="mb-4 bg-white rounded-lg border border-gray-300 p-3">
          <div className="flex items-center gap-3">
            <Megaphone className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span className="font-bold text-gray-900 text-sm">Source:</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {announcementSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setSelectedAnnouncementSource(source.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedAnnouncementSource === source.id ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {source.name.replace(" Administration", "").replace("Student ", "")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-5">
        {/* Events */}
        {events.map(event => {
          const postsHidden = hiddenEvents.has(event.id)
          const visiblePosts = postsHidden ? [] : event.posts.slice(0, 3)
          
          return (
            <div key={event.id} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              
              {/* EVENT CARD - Clickable to navigate */}
              <div 
                className={`relative overflow-hidden cursor-pointer transition-all group ${
                  event.organizer.type === 'faith' 
                    ? 'bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 hover:from-purple-100 hover:via-purple-100 hover:to-indigo-100' 
                    : 'bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 hover:from-orange-100 hover:via-orange-100 hover:to-amber-100'
                }`}
                onClick={() => {
                  // In the future, this will navigate to event detail page
                  console.log(`Navigate to event ${event.id}`)
                }}
              >
                {/* Pinned Badge */}
                {event.isPinned && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                    <Pin className="h-3 w-3 fill-current" />
                    Pinned
                  </div>
                )}

                <div className="p-5">
                  {/* Event Title & Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="text-2xl font-black text-gray-900 leading-tight">{event.title}</h4>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          event.organizer.type === 'faith'
                            ? 'bg-purple-200 text-purple-800'
                            : 'bg-orange-200 text-orange-800'
                        }`}>
                          {event.organizer.name}
                        </span>
                      </div>

                      {/* Event Meta - Compact */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {event.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3 w-3" />
                          {event.visibility}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="h-3 w-3" />
                          {event.participants}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <MessageCircle className="h-3 w-3" />
                          {event.totalPosts} posts
                        </span>
                      </div>

                      {/* Tags - Compact */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-0.5 bg-white/60 border border-gray-300 text-gray-700 text-xs font-medium rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Click hint */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300/50">
                    <div className="text-xs text-gray-600 font-medium">
                      Click to view full event page
                    </div>
                    <button 
                      onClick={(e) => toggleHideEvent(event.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 hover:bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      {postsHidden ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Show Posts
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Hide Posts
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* POSTS SECTION - Top 3 Recent Posts */}
              {!postsHidden && (
                <div className="bg-gray-50 border-t-2 border-gray-200">
                  <div className="p-5 space-y-3">
                    {/* Posts Label */}
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      <MessageCircle className="h-3 w-3" />
                      Recent Discussions ({event.posts.length} of {event.totalPosts})
                    </div>

                    {visiblePosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl border border-gray-300 p-4 hover:border-gray-400 transition-all">
                        {/* Post Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getAuthorColor(post.authorType)} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                            {getAuthorIcon(post.authorType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-gray-900">{post.author}</h5>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  <span>{post.time}</span>
                                  {post.images > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Image className="h-3 w-3" />
                                        {post.images}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-gray-800 text-sm leading-relaxed mb-3">
                          {post.content}
                        </p>

                        {/* Post Actions */}
                        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <span className="text-base">👍</span>
                            <span className="text-xs font-bold">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{post.comments}</span>
                          </button>
                          <button className="p-1.5 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors">
                            <Bookmark className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* View More in Event Page */}
                    {event.totalPosts > 3 && (
                      <button 
                        onClick={() => console.log(`Navigate to event ${event.id}`)}
                        className="w-full py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        View all {event.totalPosts} posts in event page
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Quick Create Event (Admin Only) */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-blue-200 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-black text-gray-900 mb-0.5">Create New Event</h4>
              <p className="text-xs text-gray-600">Organize campus activities and start discussions</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-3 rounded-lg border border-gray-300 hover:border-blue-400 transition-all cursor-pointer">
              <div className="font-bold text-gray-900 mb-0.5">Organization</div>
              <div className="text-gray-600">Club activities</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-300 hover:border-blue-400 transition-all cursor-pointer">
              <div className="font-bold text-gray-900 mb-0.5">Department</div>
              <div className="text-gray-600">Class seminars</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-300 hover:border-blue-400 transition-all cursor-pointer">
              <div className="font-bold text-gray-900 mb-0.5">Announcement</div>
              <div className="text-gray-600">Official updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}