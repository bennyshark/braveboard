"use client"

import { 
  Globe, 
  Users, 
  GraduationCap,
  Building2,
  Plus, 
  Image, 
  Calendar, 
  MapPin, 
  Tag,
  X,
  Check,
  Lock,
  Unlock,
  Shield,
  ArrowLeft,
  Save,
  AlertCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  
  // User's organizations where they can create events (officer/admin)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  
  // Available options for visibility
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
  
  const [visibilityType, setVisibilityType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  
  const [restrictPosting, setRestrictPosting] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Simulated data fetch - Replace with actual Supabase calls
  useEffect(() => {
    async function loadData() {
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
        
        setUserOrgs(filteredOrgs)
        
        // Load departments
        // const { data: depts } = await supabase.from('departments').select('*')
        setDepartments([
          { code: 'CCIT', name: 'College of Computer and Information Technology' },
          { code: 'CBA', name: 'College of Business Administration' },
          { code: 'COE', name: 'College of Engineering' },
          { code: 'CAS', name: 'College of Arts and Sciences' }
        ])
        
        // Load courses
        // const { data: crses } = await supabase.from('courses').select('*')
        setCourses([
          { code: 'BSCS', name: 'BS Computer Science' },
          { code: 'BSIT', name: 'BS Information Technology' },
          { code: 'BSA', name: 'BS Accountancy' },
          { code: 'BSBA', name: 'BS Business Administration' },
          { code: 'BSCE', name: 'BS Civil Engineering' },
          { code: 'BSPsych', name: 'BS Psychology' }
        ])
        
        // Load all organizations
        // const { data: allOrgs } = await supabase.from('organizations').select('*')
        setAllOrganizations([
          { id: 'fec', code: 'FEC', name: 'FAITH Esports Club', role: '' },
          { id: 'lighthouse', code: 'LH', name: 'Lighthouse', role: '' },
          { id: 'sc', code: 'SC', name: 'Student Council', role: '' },
          { id: 'dsc', code: 'DSC', name: 'Developer Student Club', role: '' },
          { id: 'acm', code: 'ACM', name: 'ACM Student Chapter', role: '' }
        ])
        
        // Set default creator org if user has orgs
        if (filteredOrgs.length > 0) {
          setSelectedCreatorOrg(filteredOrgs[0].id)
          setCreatorType('organization')
        }
        
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

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
    // Validation
    if (!title.trim()) {
      alert('Please enter an event title')
      return
    }
    
    if (creatorType === 'organization' && !selectedCreatorOrg) {
      alert('Please select an organization')
      return
    }
    
    if (visibilityType !== 'public') {
      const hasSelection = selectedOrgs.length > 0 || selectedDepts.length > 0 || selectedCourses.length > 0
      if (!hasSelection) {
        alert('Please select at least one organization, department, or course')
        return
      }
    }
    
    // Prepare event data
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      creator_type: creatorType,
      creator_org_id: creatorType === 'organization' ? selectedCreatorOrg : null,
      start_date: startDate || null,
      end_date: endDate || null,
      location: location.trim() || null,
      tags,
      visibility_type: visibilityType,
      visibility_orgs: selectedOrgs,
      visibility_depts: selectedDepts,
      visibility_courses: selectedCourses,
      posting_restricted: restrictPosting, // If true, only officers/admins can post
      is_pinned: isPinned && isFaithAdmin, // Only admins can pin
    }
    
    console.log('Creating event:', eventData)
    
    // TODO: Replace with actual Supabase insert
    // const { data, error } = await supabase
    //   .from('events')
    //   .insert(eventData)
    //   .select()
    //   .single()
    
    // if (error) {
    //   alert('Error creating event: ' + error.message)
    //   return
    // }
    
    alert('Event created successfully!')
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center">Loading...</div>
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
        
        {/* Creator Selection - Show dropdown if user has multiple organizations OR is FAITH admin */}
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
                Start Date
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
                End Date
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

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

        {/* Visibility Settings */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <h3 className="text-lg font-black text-gray-900 flex-1">Event Visibility</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-blue-800">
                  <strong>Note:</strong> Selected users/groups will be able to see and participate in this event
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={visibilityType === 'public'}
                onChange={() => setVisibilityType('public')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-bold text-gray-900">Public</div>
                  <div className="text-xs text-gray-600">All FAITH students can see and participate</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={visibilityType === 'organization'}
                onChange={() => setVisibilityType('organization')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-bold text-gray-900">By Organization</div>
                  <div className="text-xs text-gray-600">Select specific organizations</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={visibilityType === 'department'}
                onChange={() => setVisibilityType('department')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-bold text-gray-900">By Department</div>
                  <div className="text-xs text-gray-600">Select specific departments</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={visibilityType === 'course'}
                onChange={() => setVisibilityType('course')}
                className="w-4 h-4"
              />
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-bold text-gray-900">By Course</div>
                  <div className="text-xs text-gray-600">Select specific courses</div>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={visibilityType === 'mixed'}
                onChange={() => setVisibilityType('mixed')}
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
          {(visibilityType === 'organization' || visibilityType === 'mixed') && (
            <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Organizations:
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
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Department Selection */}
          {(visibilityType === 'department' || visibilityType === 'mixed') && (
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
          {(visibilityType === 'course' || visibilityType === 'mixed') && (
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

        {/* Post Permissions */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Post Permissions</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>By default:</strong> All participants (users who can see this event) can create posts. You can restrict this below.
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={restrictPosting}
              onChange={(e) => setRestrictPosting(e.target.checked)}
              className="w-5 h-5 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-5 w-5 text-red-600" />
                <div className="font-bold text-gray-900">Restrict posting to officers/admins only</div>
              </div>
              <div className="text-xs text-gray-600">
                When checked, only officers and admins of the organizing entity can create posts. Regular participants can still view and comment.
              </div>
            </div>
          </label>

          {!restrictPosting && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Unlock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Open posting enabled:</strong> All event participants can create posts and engage in discussions.
              </div>
            </div>
          )}

          {restrictPosting && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Restricted posting:</strong> Only you and other officers/admins can create posts. Regular participants can view and comment only.
              </div>
            </div>
          )}
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
            className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}