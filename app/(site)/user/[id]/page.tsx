// app/(site)/user/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useParams, useRouter } from "next/navigation"
import { 
  User, Mail, BookOpen, Building2, Shield, Users, Loader2, AlertCircle,
  Calendar, MessageSquare, Heart, ArrowLeft
} from "lucide-react"

type UserProfile = {
  id: string
  email: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  department_code: string | null
  course_code: string | null
  bio_content: string | null
  avatar_url: string | null
  cover_url: string | null
  role: string
  created_at: string
}

type Department = {
  code: string
  name: string
}

type Course = {
  code: string
  name: string
}

type UserOrganization = {
  organization: {
    id: string
    name: string
    code: string
  }
  role: string
  joined_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [stats, setStats] = useState({
    interactions: 0,
    postsCreated: 0,
    eventsParticipated: 0
  })
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadProfileData()
  }, [userId])

  async function loadProfileData() {
    try {
      setLoading(true)

      // Check if viewing own profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id === userId) {
        setIsCurrentUser(true)
        router.replace('/profile')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      if (profileData.department_code) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('code, name')
          .eq('code', profileData.department_code)
          .single()
        
        setDepartment(deptData)
      }

      if (profileData.course_code) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('code, name')
          .eq('code', profileData.course_code)
          .single()
        
        setCourse(courseData)
      }

      const { data: orgsData } = await supabase
        .from('user_organizations')
        .select(`
          role,
          joined_at,
          organization:organizations (
            id,
            name,
            code
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })

      if (orgsData) {
        setOrganizations(orgsData as any)
      }

      // Calculate stats
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)

      // Count comments + replies by user
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)

      // Count events user is participating in
      const { data: participantEvents } = await supabase
        .from('events')
        .select('id, participant_type, participant_orgs, participant_depts, participant_courses')

      let eventsCount = 0
      if (participantEvents && profileData) {
        for (const event of participantEvents) {
          if (event.participant_type === 'public') {
            eventsCount++
          } else {
            // Check if user is in participant lists
            const userOrgIds = orgsData?.map((o: any) => o.organization.id) || []
            
            if (event.participant_orgs?.some((id: string) => userOrgIds.includes(id))) {
              eventsCount++
            } else if (event.participant_depts?.includes(profileData.department_code)) {
              eventsCount++
            } else if (event.participant_courses?.includes(profileData.course_code)) {
              eventsCount++
            }
          }
        }
      }

      setStats({
        interactions: commentsCount || 0,
        postsCreated: postsCount || 0,
        eventsParticipated: eventsCount
      })

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (!profile) return "U"
    const firstName = profile.first_name || ""
    const lastName = profile.last_name || ""
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    } else if (firstName) {
      return firstName[0].toUpperCase()
    } else if (lastName) {
      return lastName[0].toUpperCase()
    }
    return "U"
  }

  const getFullName = () => {
    if (!profile) return "User"
    const parts = [
      profile.first_name,
      profile.middle_name,
      profile.last_name
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : "User"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Admin</span>
      case 'officer':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Officer</span>
      case 'member':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Member</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{role}</span>
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Profile not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 mb-4">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-3xl font-black text-gray-900 mb-2">{getFullName()}'s Profile</h1>
        <p className="text-gray-600">View user information</p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        {/* Cover Area */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
          {profile.cover_url && (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Profile Info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 mb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={getFullName()}
                  className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className={`h-32 w-32 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-black ${
                  profile.role === 'admin' 
                    ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}>
                  {getInitials()}
                </div>
              )}
              {profile.role === 'admin' && (
                <div className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              )}

              {/* Name & Email */}
              <div className="mb-2">
                <h2 className="text-2xl font-black text-gray-900">{getFullName()}</h2>
                <p className="text-gray-600 text-sm">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {profile.bio_content && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio_content}
              </p>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-blue-900">{stats.interactions}</p>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Interactions</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <Heart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-purple-900">{stats.postsCreated}</p>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Posts Created</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
              <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-900">{stats.eventsParticipated}</p>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Events</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                <p className="text-sm font-semibold text-gray-900">
                  {department ? department.name : profile.department_code || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Course</p>
                <p className="text-sm font-semibold text-gray-900">
                  {course ? course.name : profile.course_code || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations */}
      {organizations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-black text-gray-900">Organizations</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
              {organizations.length}
            </span>
          </div>

          <div className="space-y-3">
            {organizations.map((org, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {org.organization.code.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{org.organization.name}</p>
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(org.joined_at)}
                    </p>
                  </div>
                </div>
                {getRoleBadge(org.role)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}