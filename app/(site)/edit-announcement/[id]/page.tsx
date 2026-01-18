"use client"

import { 
  Users, 
  Shield, 
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  X,
  AlertCircle
} from "lucide-react"
import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// Types
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

function EditAnnouncementForm() {
  const router = useRouter()
  const params = useParams()
  const announcementId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string>("")
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  
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
  
  const [audienceType, setAudienceType] = useState<'public' | 'organization' | 'department' | 'course' | 'mixed'>('public')
  const [audOrgs, setAudOrgs] = useState<string[]>([])
  const [audDepts, setAudDepts] = useState<string[]>([])
  const [audCourses, setAudCourses] = useState<string[]>([])

  // --- FETCH DATA ---
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

        // Get Memberships
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

        // Load References
        const [deptRes, courseRes, orgRes] = await Promise.all([
          supabase.from('departments').select('code, name'),
          supabase.from('courses').select('code, name'),
          supabase.from('organizations').select('id, code, name')
        ])

        if (deptRes.data) setDepartments(deptRes.data)
        if (courseRes.data) setCourses(courseRes.data)
        if (orgRes.data) setAllOrganizations(orgRes.data.map((o: any) => ({ ...o, role: '' })))

        // --- Load Announcement Data ---
        const { data: annData, error: annError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single()

        if (annError) throw annError

        // Security Check: Can user edit this?
        const isCreator = annData.created_by === user.id
        const isOrgAdmin = annData.creator_type === 'organization' && formattedOrgs.some(o => o.id === annData.creator_org_id)
        
        if (!isAdmin && !isCreator && !isOrgAdmin) {
            alert("You do not have permission to edit this announcement.")
            router.push('/home')
            return
        }

        // Pre-fill
        setHeader(annData.header)
        setBody(annData.body)
        setCreatorType(annData.creator_type)
        setSelectedCreatorOrg(annData.creator_org_id || '')
        setExistingImageUrl(annData.image_url)
        setIsPinned(annData.is_pinned || false)
        
        setAudienceType(annData.audience_type)
        setAudOrgs(annData.audience_orgs || [])
        setAudDepts(annData.audience_depts || [])
        setAudCourses(annData.audience_courses || [])
        
        setDataLoaded(true)

      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/home')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [announcementId, router, supabase])

  // Reset logic for audience (same as create)
  useEffect(() => {
    if (!dataLoaded) return
    
    if (audienceType === 'public') {
      setAudOrgs([])
      setAudDepts([])
      setAudCourses([])
    } else if (audienceType === 'organization' || audienceType === 'mixed') {
      const keepOrg = (creatorType === 'organization' && selectedCreatorOrg) ? [selectedCreatorOrg] : []
      if(audOrgs.length === 0) setAudOrgs(keepOrg)
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
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Clear existing image if a new one is selected
      setExistingImageUrl(null)
      const reader = new FileReader()
      reader.onloadend = () => setNewImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setNewImagePreview("")
    setExistingImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!userId) return

    if (!header.trim()) { alert('Please enter a header'); return }
    if (!body.trim()) { alert('Please enter the body content'); return }
    
    if (audienceType !== 'public') {
      const hasAudSelection = audOrgs.length > 0 || audDepts.length > 0 || audCourses.length > 0
      if (!hasAudSelection) { alert('Please select at least one audience group'); return }
    }

    setIsSubmitting(true)
    try {
      let finalImageUrl = existingImageUrl

      // If there is a new image file, upload it
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
      }

      const announcementData = {
        header: header.trim(),
        body: body.trim(),
        image_url: finalImageUrl,
        audience_type: audienceType,
        audience_orgs: audOrgs,
        audience_depts: audDepts,
        audience_courses: audCourses,
        is_pinned: isPinned && isFaithAdmin,
        edited_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('announcements')
        .update(announcementData)
        .eq('id', announcementId)

      if (error) throw error

      alert('Announcement updated successfully!')
      router.push('/home')

    } catch (error: any) {
      console.error('Error updating announcement:', error)
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
        <h1 className="text-4xl font-black text-gray-900 mb-2">Edit Announcement</h1>
      </div>

      <div className="space-y-6">
        
        {/* READ ONLY CREATOR INFO */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">Created by:</label>
            <div className="space-y-2">
              {creatorType === 'faith_admin' ? (
                <div className="flex items-center gap-3 p-4 border-2 border-purple-200 bg-purple-50 rounded-lg opacity-75">
                  <Shield className="h-5 w-5 text-purple-600" /><span className="font-bold text-gray-900">FAITH Administration</span>
                </div>
              ) : (
                 <div className="flex items-center gap-3 p-4 border-2 border-orange-200 bg-orange-50 rounded-lg opacity-75">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="font-bold text-gray-900">
                        {allOrganizations.find(o => o.id === selectedCreatorOrg)?.name || 'Organization'}
                    </span>
                 </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Creator cannot be changed.</p>
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900 mb-4">Content</h3>
          
          <div>
            <label className="block text-sm font-bold mb-2">Header *</label>
            <input 
              type="text" 
              value={header} 
              onChange={(e) => setHeader(e.target.value)} 
              placeholder="Headline" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-bold" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Body *</label>
            <textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Details..." 
              rows={8} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none" 
            />
          </div>

          {/* Image Logic */}
          <div>
            <label className="block text-sm font-bold mb-2">Image (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {!existingImageUrl && !newImagePreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl font-bold transition-all"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm"><ImageIcon className="h-5 w-5" /></div>
                <span>Upload Image</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200">
                <div className="absolute top-0 left-0 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-br-lg z-10">
                    {newImagePreview ? "New Image" : "Current Image"}
                </div>
                <img src={newImagePreview || existingImageUrl || ""} alt="Preview" className="w-full h-64 object-cover" />
                <button
                  onClick={removeImage}
                  type="button"
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AUDIENCE */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Audience</h3>
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
            <label className="flex items-center gap-2 font-bold text-purple-900"><input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} /> Pin this announcement</label>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="flex-1 py-4 bg-white border-2 border-gray-300 rounded-xl font-bold">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold flex justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Update Announcement</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditAnnouncementPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>}>
      <EditAnnouncementForm />
    </Suspense>
  )
}