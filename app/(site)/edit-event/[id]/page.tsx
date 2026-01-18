// app/(site)/edit-event/[id]/page.tsx
"use client"

import { 
  Globe, 
  Users, 
  GraduationCap, 
  Building2, 
  Calendar, 
  MapPin, 
  Tag,
  X,
  Lock,
  Shield, 
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

type Organization = {
  id: string
  code: string
  name: string
  role: string
}

type Department = {
  code: string
  name: string
}

type Course = {
  code: string
  name: string
}

function EditEventForm() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  
  const [creatorType, setCreatorType] = useState<'faith_admin' | 'organization'>('faith_admin')
  const [selectedCreatorOrg, setSelectedCreatorOrg] = useState<string>('')
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  
  const [participantType, setParticipantType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [partOrgs, setPartOrgs] = useState<string[]>([])
  const [partDepts, setPartDepts] = useState<string[]>([])
  const [partCourses, setPartCourses] = useState<string[]>([])
  const [whoCanPost, setWhoCanPost] = useState<'everyone' | 'officers'>('everyone')

  const [visibilityType, setVisibilityType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [visOrgs, setVisOrgs] = useState<string[]>([])
  const [visDepts, setVisDepts] = useState<string[]>([])
  const [visCourses, setVisCourses] = useState<string[]>([])
  
  const [postingOpenUntil, setPostingOpenUntil] = useState('') 
  const [enableExtendedPosting, setEnableExtendedPosting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const isAdmin = profile?.role === 'admin'
        setIsFaithAdmin(isAdmin)

        const { data: memberships } = await supabase
          .from('user_organizations')
          .select(`role, organization:organizations!inner(id, code, name)`)
          .eq('user_id', user.id)
          .in('role', ['officer', 'admin'])

        const formattedOrgs: Organization[] = memberships?.map((m: any) => ({
          id: m.organization.id,
          code: m.organization.code,
          name: m.organization.name,
          role: m.role
        })) || []

        setUserOrgs(formattedOrgs)

        const [deptRes, courseRes, orgRes] = await Promise.all([
          supabase.from('departments').select('code, name'),
          supabase.from('courses').select('code, name'),
          supabase.from('organizations').select('id, code, name')
        ])

        if (deptRes.data) setDepartments(deptRes.data)
        if (courseRes.data) setCourses(courseRes.data)
        if (orgRes.data) setAllOrganizations(orgRes.data.map((o: any) => ({ ...o, role: '' })))

        // Load event data
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (eventError) throw eventError

        // Pre-fill form with existing data
        setTitle(eventData.title)
        setDescription(eventData.description || '')
        setStartDate(eventData.start_date.slice(0, 16))
        setEndDate(eventData.end_date.slice(0, 16))
        setLocation(eventData.location || '')
        setTags(eventData.tags || [])
        setIsPinned(eventData.is_pinned || false)
        
        setCreatorType(eventData.creator_type)
        setSelectedCreatorOrg(eventData.creator_org_id || '')
        
        setParticipantType(eventData.participant_type)
        setPartOrgs(eventData.participant_orgs || [])
        setPartDepts(eventData.participant_depts || [])
        setPartCourses(eventData.participant_courses || [])
        setWhoCanPost(eventData.who_can_post)
        
        setVisibilityType(eventData.visibility_type)
        setVisOrgs(eventData.visibility_orgs || [])
        setVisDepts(eventData.visibility_depts || [])
        setVisCourses(eventData.visibility_courses || [])
        
        if (eventData.posting_open_until) {
          setEnableExtendedPosting(true)
          setPostingOpenUntil(eventData.posting_open_until.slice(0, 16))
        }

        setDataLoaded(true)

      } catch (error) {
        console.error('Error loading data:', error)
        alert('Failed to load event data')
        router.push('/home')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventId, router, supabase])

  useEffect(() => {
    if (!dataLoaded) return

    if (creatorType === 'organization' && selectedCreatorOrg) {
      if (participantType === 'public' || participantType === 'organization') {
        setParticipantType('organization')
        if (!partOrgs.includes(selectedCreatorOrg)) {
          setPartOrgs([selectedCreatorOrg])
        }
      }
    } else if (creatorType === 'faith_admin') {
      if (participantType === 'organization') {
        setParticipantType('public')
        setPartOrgs([])
      }
    }
  }, [creatorType, selectedCreatorOrg, dataLoaded])

  useEffect(() => {
    if (!dataLoaded) return
    
    if (participantType === 'public') {
      setPartOrgs([])
      setPartDepts([])
      setPartCourses([])
    } else if (participantType === 'organization' || participantType === 'mixed') {
      const keepOrg = (creatorType === 'organization' && selectedCreatorOrg) ? [selectedCreatorOrg] : []
      setPartOrgs(keepOrg)
      setPartDepts([])
      setPartCourses([])
    } else {
      setPartOrgs([])
      setPartDepts([])
      setPartCourses([])
    }
  }, [participantType, dataLoaded])

  useEffect(() => {
    if (!dataLoaded) return
    
    setVisOrgs([])
    setVisDepts([])
    setVisCourses([])
  }, [visibilityType, dataLoaded])

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const toggleSelection = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value))
    } else {
      setArray([...array, value])
    }
  }

// In edit-event/[id]/page.tsx - UPDATE the handleSubmit function

const handleSubmit = async () => {
    if (!userId) return

    if (!title.trim()) { alert('Please enter an event title'); return }
    if (creatorType === 'organization' && !selectedCreatorOrg) { alert('Please select an organization'); return }
    if (!startDate || !endDate) { alert('Please select both start and end dates'); return }
    
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) { alert('Start date must be earlier than the end date'); return }
    
    // NEW: Check for duplicate event title (excluding current event)
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('title', title.trim())
      .neq('id', eventId)
      .single()

    if (existingEvent) {
      alert('An event with this title already exists. Please choose a different title.')
      return
    }
    
    if (participantType !== 'public') {
      const hasPartSelection = partOrgs.length > 0 || partDepts.length > 0 || partCourses.length > 0
      if (!hasPartSelection) { alert('Please select at least one participant group'); return }
    }

    if (visibilityType !== 'public') {
      const hasVisSelection = visOrgs.length > 0 || visDepts.length > 0 || visCourses.length > 0
      if (!hasVisSelection) { alert('Please select at least one visibility group'); return }
    }
    
    let finalPostingDate = null
    if (enableExtendedPosting && postingOpenUntil) {
      const postingEnd = new Date(postingOpenUntil)
      if (postingEnd <= end) { 
        alert('Extended posting period must be AFTER the event end date.'); 
        return 
      }
      finalPostingDate = postingOpenUntil
    }

    setIsSubmitting(true)
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        creator_type: creatorType,
        creator_org_id: creatorType === 'organization' ? selectedCreatorOrg : null,
        start_date: startDate,
        end_date: endDate,
        location: location.trim() || null,
        tags: tags,
        visibility_type: visibilityType,
        visibility_orgs: visOrgs,
        visibility_depts: visDepts,
        visibility_courses: visCourses,
        participant_type: participantType,
        participant_orgs: partOrgs,
        participant_depts: partDepts,
        participant_courses: partCourses,
        who_can_post: whoCanPost,
        posting_open_until: finalPostingDate,
        is_pinned: isPinned && isFaithAdmin,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)

      if (error) throw error

      alert('Event updated successfully!')
      // FIX: Use router.replace to avoid back button issue
      router.replace(`/event/${eventId}`)

    } catch (error: any) {
      console.error('Error updating event:', error)
      alert(`Failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSelectionList = (
    items: { id?: string, code?: string, name: string }[], 
    selectedIds: string[], 
    setSelectedIds: (ids: string[]) => void,
    bgColor: string,
    hostId?: string
  ) => (
    <div className={`mt-4 p-4 ${bgColor} border-2 border-opacity-50 rounded-lg`}>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map(item => {
          const id = item.id || item.code || ''
          return (
            <label key={id} className="flex items-center gap-2 p-2 hover:bg-white hover:bg-opacity-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={() => toggleSelection(selectedIds, setSelectedIds, id)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{item.name}</span>
              {hostId === id && <span className="text-xs bg-black bg-opacity-10 px-2 rounded-full font-bold">Host</span>}
            </label>
          )
        })}
      </div>
    </div>
  )

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 mb-4"><ArrowLeft className="h-5 w-5" /> Back</button>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Edit Event</h1>
      </div>

      <div className="space-y-6">
        
        {(isFaithAdmin || userOrgs.length > 0) && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">Event creator:</label>
            <div className="space-y-2">
              {isFaithAdmin && (
                <label className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50">
                  <input type="radio" checked={creatorType === 'faith_admin'} onChange={() => setCreatorType('faith_admin')} className="w-4 h-4" disabled />
                  <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-purple-600" /><span className="font-bold text-gray-900">FAITH Administration</span></div>
                </label>
              )}
              {userOrgs.map(org => (
                <label key={org.id} className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg cursor-pointer hover:bg-orange-50">
                  <input type="radio" checked={creatorType === 'organization' && selectedCreatorOrg === org.id} 
                    onChange={() => { setCreatorType('organization'); setSelectedCreatorOrg(org.id) }} className="w-4 h-4" disabled />
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" /><span className="font-bold text-gray-900">{org.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">{org.role}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Creator cannot be changed after event is created</p>
          </div>
        )}

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Event Details</h3>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title *" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none" />
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-1">Start Date *</label><input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-bold mb-1">End Date *</label><input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" /></div>
          </div>
          
          <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> By default, posting is only allowed between the <strong>Start Date</strong> and <strong>End Date</strong>. You can extend this in the "Posting Settings" section below.
            </p>
          </div>
          
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
          
          <div>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add Tags" className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <button onClick={addTag} type="button" className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">{tag}<button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button></span>)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-lg font-black text-gray-900 flex-1">Event Participants</h3>
            <div className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-bold">Who can post</div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Select the groups allowed to actively participate (post updates, media, etc).</p>

          <div className="flex flex-wrap gap-2">
            {['public', 'organization', 'department', 'course', 'mixed'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setParticipantType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  participantType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {(participantType === 'organization' || participantType === 'mixed') && renderSelectionList(allOrganizations, partOrgs, setPartOrgs, 'bg-orange-50 border-orange-200', selectedCreatorOrg)}
          {(participantType === 'department' || participantType === 'mixed') && renderSelectionList(departments, partDepts, setPartDepts, 'bg-green-50 border-green-200')}
          {(participantType === 'course' || participantType === 'mixed') && renderSelectionList(courses, partCourses, setPartCourses, 'bg-purple-50 border-purple-200')}
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-gray-900">Audience Visibility</h3>
            {visibilityType === 'public' ? 
              <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full"><Globe className="h-3 w-3" /> Public</span> : 
              <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full"><Lock className="h-3 w-3" /> Restricted</span>
            }
          </div>
          <p className="text-sm text-gray-500 mb-4">By default, events are public. Click below to restrict who can see this.</p>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setVisibilityType('public')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${visibilityType === 'public' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Public</button>
            <button type="button" onClick={() => setVisibilityType('mixed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${visibilityType !== 'public' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Restrict Access</button>
          </div>

          {visibilityType !== 'public' && (
            <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <h4 className="font-bold text-red-900 mb-2">Select Allowed Viewers:</h4>
              <div className="space-y-4">
                {renderSelectionList(allOrganizations, visOrgs, setVisOrgs, 'bg-white', selectedCreatorOrg)}
                {renderSelectionList(departments, visDepts, setVisDepts, 'bg-white')}
                {renderSelectionList(courses, visCourses, setVisCourses, 'bg-white')}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Posting Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`p-4 border-2 rounded-xl cursor-pointer ${whoCanPost === 'everyone' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex justify-between"><span className="font-bold text-gray-900">All Participants</span><input type="radio" checked={whoCanPost === 'everyone'} onChange={() => setWhoCanPost('everyone')} /></div>
              <p className="text-xs text-gray-600 mt-1">Anyone in the participant list can post.</p>
            </label>
            <label className={`p-4 border-2 rounded-xl cursor-pointer ${whoCanPost === 'officers' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex justify-between"><span className="font-bold text-gray-900">Admins/Officers Only</span><input type="radio" checked={whoCanPost === 'officers'} onChange={() => setWhoCanPost('officers')} /></div>
              <p className="text-xs text-gray-600 mt-1">Participants can view only.</p>
            </label>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={enableExtendedPosting} onChange={() => setEnableExtendedPosting(!enableExtendedPosting)} className="w-4 h-4" />
              <span className="text-sm font-bold">Extended Posting Period</span>
            </label>
            {enableExtendedPosting && (
              <div className="mt-2">
                <input type="datetime-local" value={postingOpenUntil} onChange={(e) => setPostingOpenUntil(e.target.value)} className="w-full px-3 py-2 border rounded" />
                <p className="text-xs text-gray-500 mt-1">
                  Users can continue posting until this date, even after the event ends.<br/>
                  <span className="text-red-500 font-bold">* Must be after the event End Date.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {isFaithAdmin && (
          <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6">
            <label className="flex items-center gap-2 font-bold text-purple-900"><input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} /> Pin this event</label>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="flex-1 py-4 bg-white border-2 border-gray-300 rounded-xl font-bold">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold flex justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Update Event</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditEventPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <EditEventForm />
    </Suspense>
  )
}