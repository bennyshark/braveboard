"use client"

import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Filter,
  X,
  Save,
  Loader2,
  Users,
  GraduationCap,
  Building2,
  Globe,
  Clock,
  MapPin,
  FileText,
  Tag,
  ArrowLeft
} from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

type CalendarEvent = {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  tags?: string[]
  type: 'event' | 'schedule'
  creator_type: 'faith_admin' | 'organization'
  creator_org_id?: string
  visibility_type: string
  visibility_orgs?: string[]
  visibility_depts?: string[]
  visibility_courses?: string[]
  participant_type: string
  participant_orgs?: string[]
  participant_depts?: string[]
  participant_courses?: string[]
  is_pinned?: boolean
}

type Schedule = {
  id?: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  schedule_type: 'course' | 'department' | 'organization' | 'all'
  target_codes: string[]
  color?: string
}

type Organization = {
  id: string
  code: string
  name: string
}

type Department = {
  code: string
  name: string
}

type Course = {
  code: string
  name: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userCourse, setUserCourse] = useState<string | null>(null)
  const [userDept, setUserDept] = useState<string | null>(null)
  const [userOrgs, setUserOrgs] = useState<string[]>([])
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'events' | 'schedules'>('all')
  
  // Reference data
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadData()
  }, [currentDate])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, course_code, department_code')
        .eq('id', user.id)
        .single()

      const adminStatus = profile?.role === 'admin'
      setIsAdmin(adminStatus)
      setUserCourse(profile?.course_code || null)
      setUserDept(profile?.department_code || null)

      // Get user organizations
      const { data: memberships } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)

      setUserOrgs(memberships?.map(m => m.organization_id) || [])

      // Load reference data
      const [deptRes, courseRes, orgRes] = await Promise.all([
        supabase.from('departments').select('code, name'),
        supabase.from('courses').select('code, name'),
        supabase.from('organizations').select('id, code, name')
      ])

      if (deptRes.data) setDepartments(deptRes.data)
      if (courseRes.data) setCourses(courseRes.data)
      if (orgRes.data) setOrganizations(orgRes.data)

      // Load events from events table
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString())

      const formattedEvents: CalendarEvent[] = eventsData?.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start_date: e.start_date,
        end_date: e.end_date,
        location: e.location,
        tags: e.tags,
        type: 'event',
        creator_type: e.creator_type,
        creator_org_id: e.creator_org_id,
        visibility_type: e.visibility_type,
        visibility_orgs: e.visibility_orgs,
        visibility_depts: e.visibility_depts,
        visibility_courses: e.visibility_courses,
        participant_type: e.participant_type,
        participant_orgs: e.participant_orgs,
        participant_depts: e.participant_depts,
        participant_courses: e.participant_courses,
        is_pinned: e.is_pinned
      })) || []

      setEvents(formattedEvents)

      // Load schedules
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString())

      setSchedules(schedulesData || [])

    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on user's visibility permissions
  const canSeeEvent = (event: CalendarEvent) => {
    // Admin can see everything
    if (isAdmin) return true
    
    // Public events are visible to everyone
    if (event.visibility_type === 'public') return true
    
    // Check visibility restrictions
    const visOrgs = event.visibility_orgs || []
    const visDepts = event.visibility_depts || []
    const visCourses = event.visibility_courses || []
    
    // Check if user's org is in visibility list
    if (visOrgs.length > 0 && userOrgs.some(org => visOrgs.includes(org))) {
      return true
    }
    
    // Check if user's department is in visibility list
    if (visDepts.length > 0 && userDept && visDepts.includes(userDept)) {
      return true
    }
    
    // Check if user's course is in visibility list
    if (visCourses.length > 0 && userCourse && visCourses.includes(userCourse)) {
      return true
    }
    
    // If has restrictions but user doesn't match any, can't see
    return false
  }

  // Filter schedules based on user access
  const canSeeSchedule = (schedule: Schedule) => {
    if (schedule.schedule_type === 'all') return true
    if (isAdmin) return true
    
    if (schedule.schedule_type === 'course' && userCourse) {
      return schedule.target_codes.includes(userCourse)
    }
    if (schedule.schedule_type === 'department' && userDept) {
      return schedule.target_codes.includes(userDept)
    }
    if (schedule.schedule_type === 'organization') {
      return schedule.target_codes.some(code => userOrgs.includes(code))
    }
    return false
  }

  const getVisibleItems = () => {
    let items: any[] = []

    if (filterType === 'all' || filterType === 'events') {
      const visibleEvents = events.filter(canSeeEvent)
      items = [...items, ...visibleEvents]
    }

    if (filterType === 'all' || filterType === 'schedules') {
      const visibleSchedules = schedules.filter(canSeeSchedule)
      items = [...items, ...visibleSchedules.map(s => ({ ...s, type: 'schedule' }))]
    }

    return items
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDay = (date: Date) => {
    if (!date) return []
    
    const items = getVisibleItems()
    const dateStr = date.toISOString().split('T')[0]
    
    const filtered = items.filter(item => {
      const startDate = new Date(item.start_date).toISOString().split('T')[0]
      const endDate = new Date(item.end_date).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    })
    
    // Sort by start time
    return filtered.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFCF8]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // If a date is selected, show day view
  if (selectedDate) {
    return <DayView 
      date={selectedDate} 
      items={getEventsForDay(selectedDate)}
      onBack={() => setSelectedDate(null)}
      organizations={organizations}
      departments={departments}
      courses={courses}
    />
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-stone-800 mb-2">Calendar</h1>
              <p className="text-stone-500">View events and schedules</p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Add Schedule
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl p-4 border-2 border-stone-100">
            <div className="flex items-center gap-3">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-stone-800 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={today}
                className="px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 bg-white rounded-2xl p-4 border-2 border-stone-100">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('events')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    filterType === 'events' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Events Only
                </button>
                <button
                  onClick={() => setFilterType('schedules')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    filterType === 'schedules' ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  Schedules Only
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl border-2 border-stone-100 overflow-visible">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b-2 border-stone-100">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center font-bold text-stone-600 text-sm bg-stone-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 relative">
            {getDaysInMonth().map((date, index) => {
              const isToday = date && 
                date.toDateString() === new Date().toDateString()
              
              const dayEvents = date ? getEventsForDay(date) : []

              return (
                <div
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`min-h-[120px] p-2 border-r border-b border-stone-100 ${
                    !date ? 'bg-stone-50' : 'bg-white hover:bg-stone-50 cursor-pointer'
                  } transition-colors relative`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-bold mb-2 ${
                        isToday 
                          ? 'text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center' 
                          : 'text-stone-700'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((item, i) => (
                          <EventBadge key={i} item={item} />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-stone-500 font-bold pl-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span className="text-stone-600 font-medium">Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
            <span className="text-stone-600 font-medium">Schedules</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
            <span className="text-stone-600 font-medium">Pinned Events</span>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onSave={loadData}
          departments={departments}
          courses={courses}
          organizations={organizations}
          supabase={supabase}
        />
      )}
    </div>
  )
}

// Event Badge with Tooltip
function EventBadge({ item }: { item: any }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getTimeString = () => {
    const start = new Date(item.start_date)
    return start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`text-xs px-2 py-1 rounded-lg truncate font-semibold cursor-pointer ${
          item.type === 'event'
            ? item.is_pinned 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              : 'bg-green-100 text-green-800'
            : 'bg-purple-100 text-purple-800'
        }`}
      >
        {item.type === 'schedule' && <span className="mr-1">{getTimeString()}</span>}
        {item.title}
      </div>

      {showTooltip && (
        <div className="absolute z-[100] left-0 top-full mt-1 w-64 bg-stone-900 text-white p-3 rounded-lg shadow-xl text-xs pointer-events-none">
          <div className="font-bold mb-2">{item.title}</div>
          {item.description && (
            <div className="text-stone-300 mb-2">{item.description}</div>
          )}
          <div className="space-y-1 text-stone-400">
            {/* Conditional rendering for time in tooltip */}
            {item.type === 'schedule' && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{new Date(item.start_date).toLocaleString()}</span>
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{item.location}</span>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3" />
                <span>{item.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Day View Component
function DayView({ date, items, onBack, organizations, departments, courses }: any) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Sort items by start time
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )

  // Group by type
  const events = sortedItems.filter(item => item.type === 'event')
  const schedules = sortedItems.filter(item => item.type === 'schedule')

  const getTargetName = (item: any) => {
    if (item.type === 'schedule') {
      if (item.schedule_type === 'all') return 'All Students'
      if (item.schedule_type === 'organization') {
        const orgNames = item.target_codes
          .map((code: string) => organizations.find((o: any) => o.id === code)?.name)
          .filter(Boolean)
        return orgNames.join(', ') || 'Organizations'
      }
      if (item.schedule_type === 'department') {
        const deptNames = item.target_codes
          .map((code: string) => departments.find((d: any) => d.code === code)?.name)
          .filter(Boolean)
        return deptNames.join(', ') || 'Departments'
      }
      if (item.schedule_type === 'course') {
        const courseNames = item.target_codes
          .map((code: string) => courses.find((c: any) => c.code === code)?.name)
          .filter(Boolean)
        return courseNames.join(', ') || 'Courses'
      }
    }
    return item.visibility_type === 'public' ? 'Public Event' : 'Restricted Event'
  }

  const renderItem = (item: any) => (
    <div 
      key={item.id}
      className={`p-4 rounded-xl border-2 ${
        item.type === 'event'
          ? item.is_pinned
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
          : 'bg-purple-50 border-purple-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-black text-stone-800">{item.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
          item.type === 'event' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'
        }`}>
          {item.type === 'event' ? 'Event' : 'Schedule'}
        </span>
      </div>
      
      {item.description && (
        <p className="text-sm text-stone-600 mb-3">{item.description}</p>
      )}

      <div className="space-y-2 text-sm">
        {/* Only show time for schedules, remove for events */}
        {item.type === 'schedule' && (
          <div className="flex items-center gap-2 text-stone-600">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(item.start_date).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })} - {new Date(item.end_date).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}

        {item.location && (
          <div className="flex items-center gap-2 text-stone-600">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-stone-600">
          <FileText className="h-4 w-4" />
          <span>{getTargetName(item)}</span>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-stone-600" />
            {item.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-stone-200 text-stone-700 rounded-full text-xs font-bold">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFCF8] p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-stone-600 hover:text-stone-900 font-bold"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Calendar
        </button>

        <div className="bg-white rounded-2xl border-2 border-stone-100 p-6 mb-6">
          <h1 className="text-3xl font-black text-stone-800 mb-1">{dayName}</h1>
          <p className="text-stone-500">{dateStr}</p>
        </div>

        {sortedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-stone-100 p-12 text-center">
            <p className="text-stone-400 font-medium">No events or schedules for this day</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Events Section */}
            {events.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-black text-stone-700 px-2">
                  {events.length === 1 ? 'Event' : 'Events'}
                </h2>
                {events.map(renderItem)}
              </div>
            )}

            {/* Schedules Section */}
            {schedules.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-black text-stone-700 px-2">
                  {schedules.length === 1 ? 'Schedule' : 'Schedules'}
                </h2>
                {schedules.map(renderItem)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Add Schedule Modal Component
function AddScheduleModal({ 
  onClose, 
  onSave, 
  departments, 
  courses, 
  organizations,
  supabase 
}: any) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [scheduleType, setScheduleType] = useState<'all' | 'course' | 'department' | 'organization'>('all')
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }

    if (scheduleType !== 'all' && selectedTargets.length === 0) {
      alert('Please select at least one target group')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('schedules').insert({
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        location: location.trim() || null,
        schedule_type: scheduleType,
        target_codes: scheduleType === 'all' ? [] : selectedTargets
      })

      if (error) throw error

      alert('Schedule created successfully!')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      alert(`Failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTarget = (code: string) => {
    if (selectedTargets.includes(code)) {
      setSelectedTargets(selectedTargets.filter(c => c !== code))
    } else {
      setSelectedTargets([...selectedTargets, code])
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-stone-100 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-stone-800">Add Schedule</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Schedule Title *"
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Start Date *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">End Date *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg"
          />

          <div>
            <label className="block text-sm font-bold mb-2">Schedule For:</label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => { setScheduleType('all'); setSelectedTargets([]) }}
                className={`px-4 py-2 rounded-lg font-bold ${
                  scheduleType === 'all' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                All Students
              </button>
              <button
                onClick={() => setScheduleType('course')}
                className={`px-4 py-2 rounded-lg font-bold ${
                  scheduleType === 'course' ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                <GraduationCap className="h-4 w-4 inline mr-2" />
                Courses
              </button>
              <button
                onClick={() => setScheduleType('department')}
                className={`px-4 py-2 rounded-lg font-bold ${
                  scheduleType === 'department' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-2" />
                Departments
              </button>
              <button
                onClick={() => setScheduleType('organization')}
                className={`px-4 py-2 rounded-lg font-bold ${
                  scheduleType === 'organization' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Organizations
              </button>
            </div>

            {scheduleType === 'course' && (
              <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                {courses.map((course: Course) => (
                  <label key={course.code} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(course.code)}
                      onChange={() => toggleTarget(course.code)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{course.name}</span>
                  </label>
                ))}
              </div>
            )}

            {scheduleType === 'department' && (
              <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-green-200 rounded-lg p-4 bg-green-50">
                {departments.map((dept: Department) => (
                  <label key={dept.code} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(dept.code)}
                      onChange={() => toggleTarget(dept.code)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{dept.name}</span>
                  </label>
                ))}
              </div>
            )}

            {scheduleType === 'organization' && (
              <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                {organizations.map((org: Organization) => (
                  <label key={org.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(org.id)}
                      onChange={() => toggleTarget(org.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{org.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t-2 border-stone-100 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border-2 border-stone-200 rounded-lg font-bold hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}