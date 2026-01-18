// app/(site)/create-bulletin/page.tsx
"use client"

import { 
  Globe, 
  Users, 
  GraduationCap, 
  Building2, 
  X,
  Shield, 
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  MessageCircle
} from "lucide-react"
import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

const MAX_IMAGES = 150

function CreateBulletinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // User State
  const [userId, setUserId] = useState<string | null>(null)
  const [userOrgs, setUserOrgs] = useState<Organization[]>([])
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  
  // Reference Data
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  
  // --- FORM STATE ---
  const [creatorType, setCreatorType] = useState<'faith_admin' | 'organization'>('faith_admin')
  const [selectedCreatorOrg, setSelectedCreatorOrg] = useState<string>('')
  
  const [header, setHeader] = useState('')
  const [body, setBody] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  
  // Audience (Visibility)
  const [audienceType, setAudienceType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [audOrgs, setAudOrgs] = useState<string[]>([])
  const [audDepts, setAudDepts] = useState<string[]>([])
  const [audCourses, setAudCourses] = useState<string[]>([])

  // --- 1. FETCH DATA ---
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        // Check Admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const isAdmin = profile?.role === 'admin'
        setIsFaithAdmin(isAdmin)

        // Check Memberships
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

        // Reference Data
        const [deptRes, courseRes, orgRes] = await Promise.all([
          supabase.from('departments').select('code, name'),
          supabase.from('courses').select('code, name'),
          supabase.from('organizations').select('id, code, name')
        ])

        if (deptRes.data) setDepartments(deptRes.data)
        if (courseRes.data) setCourses(courseRes.data)
        if (orgRes.data) setAllOrganizations(orgRes.data.map((o: any) => ({ ...o, role: '' })))
        
        setDataLoaded(true)

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, supabase])

  // --- 2. APPLY SELECTION LOGIC ---
  useEffect(() => {
    if (!dataLoaded) return

    const paramType = searchParams.get('type')
    const paramOrgId = searchParams.get('orgId')
    
    let initialCreatorType: 'faith_admin' | 'organization' = 'faith_admin'
    let initialOrgId = ''
    let initialAudType: any = 'public' 

    if (paramType === 'organization' && paramOrgId && userOrgs.find(o => o.id === paramOrgId)) {
      initialCreatorType = 'organization'
      initialOrgId = paramOrgId
      initialAudType = 'public' 
    } 
    else if (paramType === 'faith_admin' && isFaithAdmin) {
      initialCreatorType = 'faith_admin'
      initialAudType = 'public'
    } 
    else if (!isFaithAdmin && userOrgs.length > 0) {
      initialCreatorType = 'organization'
      initialOrgId = userOrgs[0].id
      initialAudType = 'public' 
    }
    else {
      initialCreatorType = 'faith_admin'
      initialAudType = 'public'
    }

    setCreatorType(initialCreatorType)
    setSelectedCreatorOrg(initialOrgId)
    setAudienceType(initialAudType)

  }, [dataLoaded, searchParams, userOrgs, isFaithAdmin])

  // --- 3. AUDIENCE RESET LOGIC ---
  useEffect(() => {
    if (!dataLoaded) return
    
    if (audienceType === 'public') {
      setAudOrgs([])
      setAudDepts([])
      setAudCourses([])
    } else if (audienceType === 'organization' || audienceType === 'mixed') {
      const keepOrg = (creatorType === 'organization' && selectedCreatorOrg) ? [selectedCreatorOrg] : []
      
      if(audOrgs.length === 0) {
        setAudOrgs(keepOrg)
      }
    } 
  }, [audienceType, creatorType, selectedCreatorOrg, dataLoaded])

  const toggleSelection = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value))
    } else {
      setArray([...array, value])
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > MAX_IMAGES) {
      alert(`You can only upload up to ${MAX_IMAGES} images`)
      return
    }

    setImages([...images, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!userId) return

    // Validation
    if (!header.trim()) { alert('Please enter a header'); return }
    if (!body.trim()) { alert('Please enter the body content'); return }
    if (creatorType === 'organization' && !selectedCreatorOrg) { alert('Please select an organization'); return }
    
    // Check Audience
    if (audienceType !== 'public') {
      const hasAudSelection = audOrgs.length > 0 || audDepts.length > 0 || audCourses.length > 0
      if (!hasAudSelection) { alert('Please select at least one audience group'); return }
    }

    setIsSubmitting(true)
    try {
      const imageUrls: string[] = []

      // Upload images
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrls.push(publicUrl)
      }

      const bulletinData = {
        header: header.trim(),
        body: body.trim(),
        created_by: userId,
        creator_type: creatorType,
        creator_org_id: creatorType === 'organization' ? selectedCreatorOrg : null,
        image_urls: imageUrls,
        audience_type: audienceType,
        audience_orgs: audOrgs,
        audience_depts: audDepts,
        audience_courses: audCourses,
        allow_comments: allowComments,
        is_pinned: isPinned && isFaithAdmin,
      }

      console.log('Submitting:', bulletinData)

      const { error } = await supabase.from('bulletins').insert(bulletinData)
      if (error) throw error

      alert('Bulletin posted successfully!')
      router.replace('/home')

    } catch (error: any) {
      console.error('Error creating bulletin:', error)
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

  const canCreateBulletin = isFaithAdmin || userOrgs.length > 0

  if (!loading && !canCreateBulletin) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">
            Only FAITH Administration and organization officers/admins can create bulletins.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 mb-4"><ArrowLeft className="h-5 w-5" /> Back</button>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Create Bulletin Post</h1>
        <p className="text-gray-600">Share updates and information with your community</p>
      </div>

      <div className="space-y-6">
        
        {/* 1. CREATOR IDENTITY */}
        {(isFaithAdmin || userOrgs.length > 0) && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">Posting as:</label>
            <div className="space-y-2">
              {isFaithAdmin && (
                <label className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50">
                  <input type="radio" checked={creatorType === 'faith_admin'} onChange={() => setCreatorType('faith_admin')} className="w-4 h-4" />
                  <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-purple-600" /><span className="font-bold text-gray-900">FAITH Administration</span></div>
                </label>
              )}
              {userOrgs.map(org => (
                <label key={org.id} className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg cursor-pointer hover:bg-orange-50">
                  <input type="radio" checked={creatorType === 'organization' && selectedCreatorOrg === org.id} 
                    onChange={() => { setCreatorType('organization'); setSelectedCreatorOrg(org.id) }} className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" /><span className="font-bold text-gray-900">{org.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">{org.role}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 2. CONTENT */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Content</h3>
          
          <div>
            <label className="block text-sm font-bold mb-2">Header *</label>
            <input 
              type="text" 
              value={header} 
              onChange={(e) => setHeader(e.target.value)} 
              placeholder="Your headline" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Body *</label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Share your message here..." 
              rows={8} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none" 
            />
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <ImageIcon className="h-4 w-4" />
                Attached Images ({imagePreviews.length}/{MAX_IMAGES})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {imagePreviews.map((preview, idx) => (
                  <div 
                    key={idx} 
                    className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <img 
                      src={preview} 
                      alt={`Preview ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300"></div>
                    <button
                      onClick={() => removeImage(idx)}
                      type="button"
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {images.length < MAX_IMAGES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl text-gray-700 hover:text-blue-700 font-bold transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span>Add Images ({images.length}/{MAX_IMAGES})</span>
            </button>
          )}
        </div>

        {/* 3. SETTINGS */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Settings</h3>
          
          <label className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50">
            <input 
              type="checkbox" 
              checked={allowComments} 
              onChange={(e) => setAllowComments(e.target.checked)} 
              className="w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                Allow Comments
              </div>
              <p className="text-sm text-gray-600 mt-1">Let people comment on this bulletin post</p>
            </div>
          </label>
        </div>

        {/* 4. AUDIENCE */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Audience</h3>
          <p className="text-sm text-gray-500">Post specifically for:</p>

          <div className="flex flex-wrap gap-2">
            {['public', 'organization', 'department', 'course', 'mixed'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAudienceType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  audienceType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {(audienceType === 'organization' || audienceType === 'mixed') && renderSelectionList(allOrganizations, audOrgs, setAudOrgs, 'bg-orange-50 border-orange-200', selectedCreatorOrg)}
          {(audienceType === 'department' || audienceType === 'mixed') && renderSelectionList(departments, audDepts, setAudDepts, 'bg-green-50 border-green-200')}
          {(audienceType === 'course' || audienceType === 'mixed') && renderSelectionList(courses, audCourses, setAudCourses, 'bg-purple-50 border-purple-200')}
        </div>

        {isFaithAdmin && (
          <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6">
            <label className="flex items-center gap-2 font-bold text-purple-900"><input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} /> Pin this bulletin</label>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="flex-1 py-4 bg-white border-2 border-gray-300 rounded-xl font-bold">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold flex justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Post Bulletin</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreateBulletinPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <CreateBulletinForm />
    </Suspense>
  )
}