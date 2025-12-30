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
  ArrowRight,
  Shield,
  ChevronDown
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type Organization = {
  id: string
  code: string
  name: string
  role: string
}

export default function HomePage() {
  const router = useRouter()
  const [activeFeedFilter, setActiveFeedFilter] = useState("feed")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAnnouncementSource, setSelectedAnnouncementSource] = useState<string | null>("all")
  const [hiddenEvents, setHiddenEvents] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  
  // Create Event Dropdown
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [userCreateOrgs, setUserCreateOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load user's organizations where they can create events
  useEffect(() => {
    async function loadUserCreateOrgs() {
      try {
        // TODO: Replace with actual Supabase queries
        
        // Check if user is FAITH admin
        // const { data: profile } = await supabase
        //   .from('profiles')
        //   .select('role')
        //   .eq('id', user.id)
        //   .single()
        // setIsFaithAdmin(profile?.role === 'admin')
        
        setIsFaithAdmin(true) // Mock: user is admin
        
        // Get user's organizations where they're officer/admin
        // const { data: memberships } = await supabase
        //   .from('organization_members')
        //   .select(`
        //     role,
        //     organization:organizations(id, code, name)
        //   `)
        //   .eq('user_id', user.id)
        //   .in('role', ['officer', 'admin'])
        
        // IMPORTANT: Only include organizations where user has officer or admin role
        const allMemberships = [
          { id: 'lighthouse', code: 'LH', name: 'Lighthouse', role: 'admin' },
          { id: 'fec', code: 'FEC', name: 'FAITH Esports Club', role: 'officer' },
          { id: 'sc', code: 'SC', name: 'Student Council', role: '' }, // No role - should be filtered out
          { id: 'dsc', code: 'DSC', name: 'Developer Student Club', role: 'member' }, // Just member - should be filtered out
        ]
        
        // Filter to only include officer/admin roles
        const filteredOrgs = allMemberships.filter(org => 
          org.role === 'officer' || org.role === 'admin'
        )
        
        setUserCreateOrgs(filteredOrgs)
      } catch (error) {
        console.error('Error loading user organizations:', error)
      }
    }
    
    loadUserCreateOrgs()
  }, [])

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
      visibilityType: "public",
      postingRestricted: false, // All participants can post
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
          imageUrls: []
        },
        {
          id: 102,
          author: "Maria Santos",
          authorType: "user",
          content: "Good luck everyone! Study hard and don't forget to bring your IDs.",
          time: "2 hours ago",
          likes: 89,
          comments: 15,
          imageUrls: []
        },
        {
          id: 103,
          author: "John Dela Cruz",
          authorType: "user",
          content: "Does anyone know if we can use calculators for the Math exam?",
          time: "1 hour ago",
          likes: 34,
          comments: 8,
          imageUrls: []
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
      visibilityType: "mixed",
      postingRestricted: true, // Only officers/admins can post
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
          imageUrls: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800']
        },
        {
          id: 202,
          author: "Team Captain",
          authorType: "user",
          content: "Practice sessions today at 4 PM in the Esports Lab. All teams required.",
          time: "5 hours ago",
          likes: 67,
          comments: 12,
          imageUrls: ['https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800']
        },
        {
          id: 203,
          author: "Alex Rivera",
          authorType: "user",
          content: "Will there be prize money for the winners? Super excited for this!",
          time: "4 hours ago",
          likes: 45,
          comments: 7,
          imageUrls: []
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
      visibilityType: "public",
      postingRestricted: false, // All participants can post
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
          imageUrls: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800', 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800']
        },
        {
          id: 302,
          author: "Sarah Chen",
          authorType: "user",
          content: "Can we bring our own eco-bags? I have some extra to share!",
          time: "1 day ago",
          likes: 56,
          comments: 12,
          imageUrls: []
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

  const handleCreateClick = () => {
    // If announcements tab, always create post (no dropdown needed)
    if (activeFeedFilter === 'announcements') {
      console.log('Create announcement post')
      return
    }
    
    // Check if user can create events
    const canCreateMultiple = isFaithAdmin || userCreateOrgs.length > 0
    const hasMultipleOptions = isFaithAdmin && userCreateOrgs.length > 0
    
    if (!canCreateMultiple) {
      // User cannot create events at all
      alert('You need to be an officer or admin of an organization to create events')
      return
    }
    
    // If user has only one option (either FAITH admin OR one org), go directly
    if (!hasMultipleOptions) {
      router.push('/create-event')
      return
    }
    
    // Show dropdown for multiple options
    setShowCreateDropdown(!showCreateDropdown)
  }

  const handleCreateAsOption = (type: 'faith_admin' | 'organization', orgId?: string) => {
    setShowCreateDropdown(false)
    
    // TODO: Pass the selected creator context to the create event page
    // For now, just navigate
    router.push('/create-event')
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

        {/* Main Filter Tabs with Create Button */}
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
          
          {/* Create Button with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              {activeFeedFilter === 'announcements' ? 'Create Post' : 'Create Event'}
              {activeFeedFilter !== 'announcements' && (isFaithAdmin && userCreateOrgs.length > 0) && (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showCreateDropdown && activeFeedFilter !== 'announcements' && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                    Create event as:
                  </div>
                  
                  {isFaithAdmin && (
                    <button
                      onClick={() => handleCreateAsOption('faith_admin')}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-purple-50 rounded-lg transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">FAITH Administration</div>
                        <div className="text-xs text-gray-500">Campus-wide events</div>
                      </div>
                    </button>
                  )}

                  {userCreateOrgs.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleCreateAsOption('organization', org.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-orange-50 rounded-lg transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">{org.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{org.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                  All Organizations
                </button>
                {organizations.slice(0, 3).map(org => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedOrg === org.id ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {org.name}
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
                          {event.participants} participants
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <MessageCircle className="h-3 w-3" />
                          {event.totalPosts} posts
                        </span>
                      </div>

                      {/* Posting Permission Badge */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          event.postingRestricted 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {event.postingRestricted ? '🔒 Officers/Admins Only' : '✅ All Participants Can Post'}
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
                                  {post.imageUrls && post.imageUrls.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Image className="h-3 w-3" />
                                        {post.imageUrls.length}
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

                        {/* Post Images */}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                          <div className={`mb-3 ${
                            post.imageUrls.length === 1 ? 'grid grid-cols-1' :
                            post.imageUrls.length === 2 ? 'grid grid-cols-2 gap-2' :
                            post.imageUrls.length === 3 ? 'grid grid-cols-3 gap-2' :
                            'grid grid-cols-2 gap-2'
                          }`}>
                            {post.imageUrls.slice(0, 4).map((url, idx) => (
                              <div key={idx} className={`relative overflow-hidden rounded-lg bg-gray-100 ${
                                post.imageUrls.length === 1 ? 'aspect-video' :
                                post.imageUrls.length === 3 && idx === 0 ? 'col-span-2 row-span-2 aspect-square' :
                                'aspect-square'
                              }`}>
                                <img 
                                  src={url} 
                                  alt={`Post image ${idx + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                />
                                {idx === 3 && post.imageUrls.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">+{post.imageUrls.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

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

                    {/* Create Post Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log(`Create post in event ${event.id}`)
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your Post
                    </button>

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
      </div>
    </div>
  )
}