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
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// Define Database Types
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

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize Supabase Client (SSR compliant)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // User State
  const [userId, setUserId] = useState<string | null>(null)
  
  // User's organizations where they can create events (officer/admin)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  
  // Available options
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  
  // Form state
  const [creatorType, setCreatorType] = useState<'faith_admin' | 'organization'>('faith_admin')
  const [selectedCreatorOrg, setSelectedCreatorOrg] = useState<string>('')
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // Participant / Visibility
  const [participantType, setParticipantType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  
  // Posting Settings
  const [whoCanPost, setWhoCanPost] = useState<'everyone' | 'officers'>('everyone')
  
  // Posting Duration
  const [postingOpenUntil, setPostingOpenUntil] = useState('') 
  const [enableExtendedPosting, setEnableExtendedPosting] = useState(false)

  const [isPinned, setIsPinned] = useState(false)

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Get Current User
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login') // Redirect if not logged in
          return
        }
        setUserId(user.id)

        // 2. Check if FAITH Admin (using profiles table)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const isAdmin = profile?.role === 'admin'
        setIsFaithAdmin(isAdmin)

        // 3. Get User's Organizations (Officer/Admin roles only)
        // We use the junction table logic here
        const { data: memberships } = await supabase
          .from('user_organizations')
          .select(`
            role,
            organization:organizations(id, code, name)
          `)
          .eq('user_id', user.id)
          .in('role', ['officer', 'admin'])

        const formattedOrgs: Organization[] = memberships?.map((m: any) => ({
          id: m.organization.id,
          code: m.organization.code,
          name: m.organization.name,
          role: m.role
        })) || []

        setUserOrgs(formattedOrgs)

        // 4. Load Reference Data (Departments, Courses, All Orgs)
        const [deptRes, courseRes, orgRes] = await Promise.all([
          supabase.from('departments').select('code, name'),
          supabase.from('courses').select('code, name'),
          supabase.from('organizations').select('id, code, name')
        ])

        if (deptRes.data) setDepartments(deptRes.data)
        if (courseRes.data) setCourses(courseRes.data)
        if (orgRes.data) setAllOrganizations(orgRes.data.map((o: any) => ({ ...o, role: '' })))

        // 5. Default Defaults
        // If user is NOT admin but HAS orgs, default to the first org
        if (!isAdmin && formattedOrgs.length > 0) {
          setCreatorType('organization')
          setSelectedCreatorOrg(formattedOrgs[0].id)
          setParticipantType('organization')
          setSelectedOrgs([formattedOrgs[0].id])
        }

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [router, supabase])

  // Auto-update participants when creator organization changes
  useEffect(() => {
    if (creatorType === 'organization' && selectedCreatorOrg) {
      if (participantType === 'organization' || participantType === 'mixed') {
        if (!selectedOrgs.includes(selectedCreatorOrg)) {
          setSelectedOrgs(prev => [...prev, selectedCreatorOrg])
        }
      }
    }
  }, [creatorType, selectedCreatorOrg, participantType, selectedOrgs])

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

  const handleSubmit = async () => {
    if (!userId) return

    // --- Validation ---
    if (!title.trim()) {
      alert('Please enter an event title')
      return
    }
    
    if (creatorType === 'organization' && !selectedCreatorOrg) {
      alert('Please select an organization')
      return
    }

    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      alert('Start date must be earlier than the end date')
      return
    }
    
    if (participantType !== 'public') {
      const hasSelection = selectedOrgs.length > 0 || selectedDepts.length > 0 || selectedCourses.length > 0
      if (!hasSelection) {
        alert('Please select at least one organization, department, or course for participation')
        return
      }
    }
    
    let finalPostingDate = null
    if (enableExtendedPosting && postingOpenUntil) {
      const postingEnd = new Date(postingOpenUntil)
      if (postingEnd <= start) {
         alert('Posting deadline must be after the event starts')
         return
      }
      finalPostingDate = postingOpenUntil
    }

    // --- Submission ---
    setIsSubmitting(true)

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        created_by: userId, // Important: explicitly set creator
        creator_type: creatorType,
        creator_org_id: creatorType === 'organization' ? selectedCreatorOrg : null,
        start_date: startDate,
        end_date: endDate,
        location: location.trim() || null,
        tags: tags,
        // Participant Mappings
        participant_type: participantType,
        participant_orgs: selectedOrgs,
        participant_depts: selectedDepts,
        participant_courses: selectedCourses,
        // Permissions
        who_can_post: whoCanPost,
        posting_open_until: finalPostingDate,
        // Meta
        is_pinned: isPinned && isFaithAdmin, 
      }

      console.log('Submitting to DB:', eventData)

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Success
      alert('Event created successfully!')
      router.push('/home') // Or wherever you want to redirect

    } catch (error: any) {
      console.error('Error creating event:', error)
      alert(`Failed to create event: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Create Event</h1>
        <p className="text-gray-600">Organize campus activities and engage your community</p>
      </div>

      <div className="space-y-6">
        
        {/* Creator Selection */}
        {(isFaithAdmin || userOrgs.length > 0) && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Creating event as:
            </label>
            <div className="space-y-2">
              {isFaithAdmin && (
                <label className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                  <input
                    type="radio"
                    name="creator"
                    checked={creatorType === 'faith_admin'}
                    onChange={() => setCreatorType('faith_admin')}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-gray-900">FAITH Administration</span>
                  </div>
                </label>
              )}
              
              {userOrgs.map(org => (
                <label 
                  key={org.id}
                  className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="creator"
                    checked={creatorType === 'organization' && selectedCreatorOrg === org.id}
                    onChange={() => {
                      setCreatorType('organization')
                      setSelectedCreatorOrg(org.id)
                      // Auto-select this org in participants if not public
                      if (participantType !== 'public') {
                        setParticipantType('organization')
                        // Only add if not already there
                        if(!selectedOrgs.includes(org.id)) {
                           setSelectedOrgs(prev => [...prev, org.id])
                        }
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="font-bold text-gray-900">{org.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">
                      {org.role}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Event Details</h3>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm Examinations, Valorant Tournament"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date *
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {/* Validation Feedback */}
          {startDate && endDate && new Date(startDate) >= new Date(endDate) && (
             <div className="text-red-600 text-sm flex items-center gap-1 font-bold">
               <AlertCircle className="h-4 w-4" />
               Start date must be earlier than end date.
             </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Auditorium, Esports Lab"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <h3 className="text-lg font-black text-gray-900 flex-1">Event Participants</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-blue-800">
                  <strong>Definition:</strong> Participants are people who can see the event and potentially post in it (depending on permissions).
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="participant"
                checked={participantType === 'public'}
                onChange={() => setParticipantType('public')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-bold text-gray-900">Public</div>
                  <div className="text-xs text-gray-600">All FAITH students are participants</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="participant"
                checked={participantType === 'organization'}
                onChange={() => setParticipantType('organization')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-bold text-gray-900">By Organization</div>
                  <div className="text-xs text-gray-600">Only members of selected organizations</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="participant"
                checked={participantType === 'department'}
                onChange={() => setParticipantType('department')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-bold text-gray-900">By Department</div>
                  <div className="text-xs text-gray-600">Only students in selected departments</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="participant"
                checked={participantType === 'course'}
                onChange={() => setParticipantType('course')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-bold text-gray-900">By Course</div>
                  <div className="text-xs text-gray-600">Only students in selected courses</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="participant"
                checked={participantType === 'mixed'}
                onChange={() => setParticipantType('mixed')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="font-bold text-gray-900">Mixed (Multiple)</div>
                  <div className="text-xs text-gray-600">Combine orgs, departments, and courses</div>
                </div>
              </div>
            </label>
          </div>

          {/* Organization Selection */}
          {(participantType === 'organization' || participantType === 'mixed') && (
            <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Participant Organizations:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allOrganizations.map(org => (
                  <label key={org.id} className="flex items-center gap-2 p-2 hover:bg-orange-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => toggleSelection(selectedOrgs, setSelectedOrgs, org.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{org.name}</span>
                    {creatorType === 'organization' && selectedCreatorOrg === org.id && (
                        <span className="text-xs bg-orange-200 px-2 rounded-full text-orange-800 font-bold">Host</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Department Selection */}
          {(participantType === 'department' || participantType === 'mixed') && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Departments:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {departments.map(dept => (
                  <label key={dept.code} className="flex items-center gap-2 p-2 hover:bg-green-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(dept.code)}
                      onChange={() => toggleSelection(selectedDepts, setSelectedDepts, dept.code)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Course Selection */}
          {(participantType === 'course' || participantType === 'mixed') && (
            <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Courses:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {courses.map(course => (
                  <label key={course.code} className="flex items-center gap-2 p-2 hover:bg-purple-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.code)}
                      onChange={() => toggleSelection(selectedCourses, setSelectedCourses, course.code)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{course.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posting Duration */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Posting Duration</h3>
          
          <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
             <input 
               type="checkbox"
               checked={!enableExtendedPosting}
               onChange={() => {
                 setEnableExtendedPosting(false)
                 setPostingOpenUntil('') 
               }}
               className="w-5 h-5 mt-0.5"
             />
             <div>
               <div className="font-bold text-gray-900">Standard Duration</div>
               <div className="text-xs text-gray-600">
                  Users can post from the start date until the event <strong>End Date ({endDate ? new Date(endDate).toLocaleString() : '...'})</strong>.
               </div>
             </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer">
             <input 
               type="checkbox"
               checked={enableExtendedPosting}
               onChange={() => setEnableExtendedPosting(true)}
               className="w-5 h-5 mt-0.5"
             />
             <div className="w-full">
               <div className="font-bold text-gray-900">Extended / Custom Posting Window</div>
               <div className="text-xs text-gray-600 mb-3">
                  Allow users to keep posting even after the event has technically finished.
               </div>
               
               {enableExtendedPosting && (
                 <div className="mt-2">
                   <label className="block text-xs font-bold text-gray-700 mb-1">Close posting on:</label>
                   <input
                    type="datetime-local"
                    value={postingOpenUntil}
                    onChange={(e) => setPostingOpenUntil(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded bg-white text-sm"
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     You can update this date or reopen posting at any time in the future.
                   </p>
                 </div>
               )}
             </div>
          </label>
        </div>

        {/* Post Permissions */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Who can post?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex flex-col gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${whoCanPost === 'everyone' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-green-600" />
                     <span className="font-bold text-gray-900">All Participants</span>
                  </div>
                  <input 
                    type="radio" 
                    name="permission" 
                    checked={whoCanPost === 'everyone'}
                    onChange={() => setWhoCanPost('everyone')}
                    className="w-4 h-4"
                  />
               </div>
               <p className="text-xs text-gray-600">
                 Anyone included in the participants list can create posts.
               </p>
            </label>

            <label className={`flex flex-col gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${whoCanPost === 'officers' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}>
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Lock className="h-5 w-5 text-red-600" />
                     <span className="font-bold text-gray-900">Admins & Officers Only</span>
                  </div>
                  <input 
                    type="radio" 
                    name="permission" 
                    checked={whoCanPost === 'officers'}
                    onChange={() => setWhoCanPost('officers')}
                    className="w-4 h-4"
                  />
               </div>
               <p className="text-xs text-gray-600">
                 Participants can view, but only you and your officers can create new posts.
               </p>
            </label>
          </div>
        </div>

        {/* Admin Options */}
        {isFaithAdmin && (
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 mb-4">Admin Options</h3>
            
            <label className="flex items-center gap-3 p-4 border-2 border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-5 h-5"
              />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-bold text-gray-900">Pin this event</div>
                  <div className="text-xs text-gray-600">Pinned events appear at the top of feeds</div>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Create Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}