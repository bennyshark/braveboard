// app/(site)/organization/[id]/settings/page.tsx
"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Users, 
  Settings,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Shield,
  UserPlus,
  Search,
  X,
  ChevronDown,
  Trash2,
  Check,
  Filter,
  Camera,
  Edit,
  Image as ImageIcon
} from "lucide-react"

type Organization = {
  id: string
  code: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_url: string | null
  member_count: number
}

type Member = {
  user_id: string
  role: string
  joined_at: string
  name: string
  profile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

type SearchUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type DragType = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

function OrganizationSettingsContent() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Members state
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'officer' | 'admin'>('all')
  const [memberSearch, setMemberSearch] = useState("")
  
  // Add member state
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<'member' | 'officer' | 'admin'>('member')

  // Edit org state
  const [showEditOrg, setShowEditOrg] = useState(false)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [imageSrc, setImageSrc] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [dragType, setDragType] = useState<DragType>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadData()
  }, [orgId])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  // Filter members based on role filter and search
  useEffect(() => {
    let filtered = [...allMembers]
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === roleFilter)
    }
    
    // Apply search filter
    if (memberSearch) {
      const searchLower = memberSearch.toLowerCase()
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchLower) ||
        m.profile?.email?.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredMembers(filtered)
  }, [allMembers, roleFilter, memberSearch])

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      drawCanvas()
    }
  }, [imageSrc, crop])

  async function loadData() {
    try {
      setLoading(true)

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (orgError) throw orgError
      setOrganization(orgData)
      setEditName(orgData.name)
      setEditCode(orgData.code)
      setEditDescription(orgData.description || "")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsFaithAdmin(profile?.role === 'admin')

      const { data: memberData } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single()

      if (!memberData && profile?.role !== 'admin') {
        router.push(`/organization/${orgId}`)
        return
      }

      setCurrentUserRole(memberData?.role || null)

      const canManage = profile?.role === 'admin' || ['admin', 'officer'].includes(memberData?.role || '')
      if (!canManage) {
        router.push(`/organization/${orgId}`)
        return
      }

      await loadMembers()

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMembers() {
    try {
      // First, get user_organizations data
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('user_id, role, joined_at, name')
        .eq('organization_id', orgId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true })

      if (userOrgsError) {
        console.error('Error loading user_organizations:', userOrgsError)
        return
      }

      if (!userOrgs || userOrgs.length === 0) {
        setAllMembers([])
        return
      }

      // Get all user IDs
      const userIds = userOrgs.map(uo => uo.user_id)

      // Fetch profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        return
      }

      // Combine the data
      const members = userOrgs.map(uo => {
        const profile = profiles?.find(p => p.id === uo.user_id) || {
          id: uo.user_id,
          email: 'Unknown',
          first_name: null,
          last_name: null,
          avatar_url: null
        }

        return {
          user_id: uo.user_id,
          role: uo.role,
          joined_at: uo.joined_at,
          name: uo.name,
          profile: profile
        }
      })

      setAllMembers(members as Member[])
      console.log('Loaded members:', members.length)
    } catch (error) {
      console.error('Error in loadMembers:', error)
    }
  }

  async function searchUsers() {
    if (searchTerm.length < 2) return

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error

      const memberIds = allMembers.map(m => m.user_id)
      const filtered = data?.filter(u => !memberIds.includes(u.id)) || []
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  async function addMember() {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: selectedUser.id,
          organization_id: orgId,
          role: selectedRole
        })

      if (error) throw error

      alert('Member added successfully!')
      setShowAddMember(false)
      setSearchTerm("")
      setSelectedUser(null)
      setSelectedRole('member')
      loadMembers()
      
    } catch (error: any) {
      console.error('Error adding member:', error)
      alert(`Failed to add member: ${error.message}`)
    }
  }

  async function updateMemberRole(userId: string, newRole: string) {
    if (!confirm(`Are you sure you want to change this member's role to ${newRole}?`)) return

    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('organization_id', orgId)

      if (error) throw error

      alert('Role updated successfully!')
      loadMembers()
      
    } catch (error: any) {
      console.error('Error updating role:', error)
      alert(`Failed to update role: ${error.message}`)
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', orgId)

      if (error) throw error

      alert('Member removed successfully!')
      loadMembers()
      
    } catch (error: any) {
      console.error('Error removing member:', error)
      alert(`Failed to remove member: ${error.message}`)
    }
  }

  function clearCropModal() {
    setCropModalOpen(false)
    setImageSrc("")
    setCrop({ x: 0, y: 0, width: 200, height: 200 })
    setDragType(null)
  }

  async function updateOrganization() {
    if (!organization) return

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: editName,
          code: editCode,
          description: editDescription
        })
        .eq('id', orgId)

      if (error) throw error

      setOrganization({
        ...organization,
        name: editName,
        code: editCode,
        description: editDescription
      })
      setShowEditOrg(false)
      alert('Organization updated successfully!')
    } catch (error: any) {
      console.error('Error updating organization:', error)
      alert(`Failed to update: ${error.message}`)
    }
  }

  async function removeImage(type: 'avatar' | 'cover') {
    if (!organization) return
    
    const message = type === 'avatar' 
      ? 'Are you sure you want to remove the avatar?' 
      : 'Are you sure you want to remove the cover photo?'
    
    if (!confirm(message)) return

    try {
      const updateField = type === 'avatar' ? 'avatar_url' : 'cover_url'
      const { error } = await supabase
        .from('organizations')
        .update({ [updateField]: null })
        .eq('id', orgId)

      if (error) throw error

      setOrganization({ ...organization, [updateField]: null })
      alert(`${type === 'avatar' ? 'Avatar' : 'Cover photo'} removed successfully!`)
    } catch (error: any) {
      console.error('Error removing image:', error)
      alert(`Failed to remove image: ${error.message}`)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        setImageSrc(img.src)
        setCropType(type)
        
        if (type === 'avatar') {
          const size = Math.min(img.width, img.height) * 0.8
          setCrop({
            x: (img.width - size) / 2,
            y: (img.height - size) / 2,
            width: size,
            height: size
          })
        } else {
          const height = Math.min(img.width / 4, img.height * 0.8)
          setCrop({
            x: 0,
            y: (img.height - height) / 2,
            width: img.width,
            height: height
          })
        }
        setCropModalOpen(true)
      }
    }

    reader.readAsDataURL(file)
  }

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      setImageSize({ width: img.width, height: img.height })

      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.clearRect(crop.x, crop.y, crop.width, crop.height)
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, crop.x, crop.y, crop.width, crop.height)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)

      const handleSize = 20
      const handles = [
        { x: crop.x, y: crop.y },
        { x: crop.x + crop.width, y: crop.y },
        { x: crop.x, y: crop.y + crop.height },
        { x: crop.x + crop.width, y: crop.y + crop.height },
      ]

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3

      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
      })

      const edgeHandles = [
        { x: crop.x + crop.width/2, y: crop.y },
        { x: crop.x + crop.width/2, y: crop.y + crop.height },
        { x: crop.x, y: crop.y + crop.height/2 },
        { x: crop.x + crop.width, y: crop.y + crop.height/2 },
      ]

      edgeHandles.forEach(handle => {
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, handleSize/2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    }
  }

  function getCursorPosition(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function getHandleAtPosition(x: number, y: number): DragType {
    const handleSize = 20
    const edgeThreshold = 15

    if (Math.abs(x - crop.x) < handleSize && Math.abs(y - crop.y) < handleSize) return 'nw'
    if (Math.abs(x - (crop.x + crop.width)) < handleSize && Math.abs(y - crop.y) < handleSize) return 'ne'
    if (Math.abs(x - crop.x) < handleSize && Math.abs(y - (crop.y + crop.height)) < handleSize) return 'sw'
    if (Math.abs(x - (crop.x + crop.width)) < handleSize && Math.abs(y - (crop.y + crop.height)) < handleSize) return 'se'
    if (Math.abs(x - (crop.x + crop.width/2)) < handleSize && Math.abs(y - crop.y) < edgeThreshold) return 'n'
    if (Math.abs(x - (crop.x + crop.width/2)) < handleSize && Math.abs(y - (crop.y + crop.height)) < edgeThreshold) return 's'
    if (Math.abs(x - crop.x) < edgeThreshold && Math.abs(y - (crop.y + crop.height/2)) < handleSize) return 'w'
    if (Math.abs(x - (crop.x + crop.width)) < edgeThreshold && Math.abs(y - (crop.y + crop.height/2)) < handleSize) return 'e'

    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
      return 'move'
    }

    return null
  }

  function getCursor(dragType: DragType): string {
    switch(dragType) {
      case 'nw':
      case 'se':
        return 'nwse-resize'
      case 'ne':
      case 'sw':
        return 'nesw-resize'
      case 'n':
      case 's':
        return 'ns-resize'
      case 'e':
      case 'w':
        return 'ew-resize'
      case 'move':
        return 'move'
      default:
        return 'default'
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCursorPosition(e)
    const handle = getHandleAtPosition(pos.x, pos.y)
    
    if (handle) {
      setDragType(handle)
      setDragStart({
        x: pos.x,
        y: pos.y,
        cropX: crop.x,
        cropY: crop.y,
        cropWidth: crop.width,
        cropHeight: crop.height
      })
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const pos = getCursorPosition(e)

    if (!dragType) {
      const handle = getHandleAtPosition(pos.x, pos.y)
      canvas.style.cursor = getCursor(handle)
      return
    }

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y

    let newCrop = { ...crop }

    if (dragType === 'move') {
      newCrop.x = dragStart.cropX + dx
      newCrop.y = dragStart.cropY + dy
      newCrop.x = Math.max(0, Math.min(newCrop.x, imageSize.width - crop.width))
      newCrop.y = Math.max(0, Math.min(newCrop.y, imageSize.height - crop.height))
    } else {
      const aspectRatio = cropType === 'avatar' ? 1 : 4

      if (dragType === 'se') {
        if (cropType === 'avatar') {
          const size = Math.max(50, Math.min(
            dragStart.cropWidth + dx,
            dragStart.cropHeight + dy,
            imageSize.width - dragStart.cropX,
            imageSize.height - dragStart.cropY
          ))
          newCrop.width = size
          newCrop.height = size
        } else {
          newCrop.width = Math.max(100, Math.min(dragStart.cropWidth + dx, imageSize.width - dragStart.cropX))
          newCrop.height = newCrop.width / aspectRatio
          if (newCrop.y + newCrop.height > imageSize.height) {
            newCrop.height = imageSize.height - newCrop.y
            newCrop.width = newCrop.height * aspectRatio
          }
        }
      }

      if (newCrop.x + newCrop.width > imageSize.width) {
        newCrop.width = imageSize.width - newCrop.x
        if (cropType === 'avatar') newCrop.height = newCrop.width
        else newCrop.height = newCrop.width / aspectRatio
      }
      if (newCrop.y + newCrop.height > imageSize.height) {
        newCrop.height = imageSize.height - newCrop.y
        if (cropType === 'avatar') newCrop.width = newCrop.height
        else newCrop.width = newCrop.height * aspectRatio
      }
    }

    setCrop(newCrop)
  }

  function handleMouseUp() {
    setDragType(null)
  }

  async function handleCropConfirm() {
    if (!organization) return

    const canvas = canvasRef.current
    if (!canvas) return

    setUploading(true)

    try {
      const croppedCanvas = document.createElement('canvas')
      const ctx = croppedCanvas.getContext('2d')
      if (!ctx) return

      if (cropType === 'avatar') {
        croppedCanvas.width = 400
        croppedCanvas.height = 400
      } else {
        croppedCanvas.width = 1200
        croppedCanvas.height = 300
      }

      const img = new Image()
      img.src = imageSrc
      await new Promise((resolve) => { img.onload = resolve })

      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, croppedCanvas.width, croppedCanvas.height
      )

      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95)
      })

      const fileExt = 'jpg'
      const fileName = `orgs/${orgId}/${cropType}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      const updateField = cropType === 'avatar' ? 'avatar_url' : 'cover_url'
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ [updateField]: publicUrl })
        .eq('id', orgId)

      if (updateError) throw updateError

      setOrganization({ ...organization, [updateField]: publicUrl })
      clearCropModal()

    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  const getFullName = (profile: any) => {
    if (!profile) return "Unknown User"
    const parts = [profile.first_name, profile.last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : profile.email
  }

  const getInitials = (profile: any) => {
    if (!profile) return "U"
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    } else if (profile.first_name) {
      return profile.first_name[0].toUpperCase()
    } else if (profile.email) {
      return profile.email[0].toUpperCase()
    }
    return "U"
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

  const canModifyMember = (memberRole: string) => {
    if (isFaithAdmin) return true
    if (currentUserRole === 'admin') return true
    if (currentUserRole === 'officer' && memberRole === 'member') return true
    return false
  }

  const roleFilterOptions = [
    { value: 'all', label: 'All Members', count: allMembers.length },
    { value: 'admin', label: 'Admins', count: allMembers.filter(m => m.role === 'admin').length },
    { value: 'officer', label: 'Officers', count: allMembers.filter(m => m.role === 'officer').length },
    { value: 'member', label: 'Members', count: allMembers.filter(m => m.role === 'member').length }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-gray-500">Organization not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4">
      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Crop {cropType === 'avatar' ? 'Avatar' : 'Cover Photo'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {cropType === 'avatar' ? 'Drag corners to resize (1:1 ratio)' : 'Drag corners to resize (4:1 ratio)'}
                </p>
              </div>
              <button 
                onClick={clearCropModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 overflow-auto max-h-[60vh] bg-gray-100 rounded-xl">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: dragType ? getCursor(dragType) : 'default' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCropModal}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm & Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => router.push(`/organization/${orgId}`)} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Organization
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Organization Settings</h1>
            <p className="text-gray-600">{organization.name}</p>
          </div>
        </div>
      </div>

      {/* Organization Profile Section - Fixed Layout */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden mb-6">
        
        {/* Cover Photo */}
        <div className="relative h-56 bg-gradient-to-r from-orange-500 to-orange-600 group z-0">
          {organization.cover_url && (
            <img 
              src={organization.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <label className="p-2 bg-white/90 hover:bg-white rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Camera className="h-4 w-4 text-gray-700" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'cover')}
                disabled={uploading}
              />
            </label>
            {organization.cover_url && (
              <button
                onClick={() => removeImage('cover')}
                className="p-2 bg-white/90 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area - Fixed Overlap */}
        <div className="px-8 pb-8 relative z-10">
          
          {/* Avatar and Info Row */}
          <div className="flex items-end justify-between -mt-20 mb-6 gap-4">
             {/* Avatar */}
             <div className="relative group">
                {organization.avatar_url ? (
                  <img 
                    src={organization.avatar_url} 
                    alt={organization.name}
                    className="h-40 w-40 rounded-2xl border-[6px] border-white shadow-xl object-cover bg-white"
                  />
                ) : (
                  <div className="h-40 w-40 rounded-2xl border-[6px] border-white shadow-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-black">
                      {organization.code.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Avatar Edit/Remove Buttons */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="p-2 bg-white rounded-lg cursor-pointer shadow-lg border border-gray-100">
                    <Camera className="h-4 w-4 text-gray-700" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'avatar')}
                      disabled={uploading}
                    />
                  </label>
                  {organization.avatar_url && (
                    <button
                      onClick={() => removeImage('avatar')}
                      className="p-2 bg-white rounded-lg shadow-lg border border-gray-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
             </div>

             {/* Edit Toggle */}
             <button
              onClick={() => {
                setShowEditOrg(!showEditOrg)
                // Clear crop modal if open
                if (cropModalOpen) {
                  clearCropModal()
                }
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 mb-2"
            >
              <Edit className="h-4 w-4" />
              {showEditOrg ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {!showEditOrg && (
            <div className="mb-4">
                <h2 className="text-3xl font-black text-gray-900">{organization.name}</h2>
                <p className="text-gray-600 font-bold">{organization.code}</p>
            </div>
          )}

          {/* Edit Form */}
          {showEditOrg ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Organization Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Organization Code</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none resize-none"
                  placeholder="Describe your organization..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditOrg(false)
                    setEditName(organization.name)
                    setEditCode(organization.code)
                    setEditDescription(organization.description || "")
                    // Clear crop modal if open
                    if (cropModalOpen) {
                      clearCropModal()
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateOrganization}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            organization.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 leading-relaxed">{organization.description}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-black text-gray-900">Members</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
              {allMembers.length}
            </span>
          </div>
          
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add New Member</h3>
            
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-2">Search User</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {searching && (
                  <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-blue-500" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border-2 border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchTerm("")
                        setSearchResults([])
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={getFullName(user)}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {getInitials(user)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{getFullName(user)}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="mb-3 p-3 bg-white border-2 border-blue-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar_url ? (
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={getFullName(selectedUser)}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {getInitials(selectedUser)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900">{getFullName(selectedUser)}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-2">Role</label>
              <div className="flex gap-2">
                {(['member', 'officer', 'admin'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 px-3 py-2 rounded-lg font-bold text-sm capitalize transition-all ${
                      selectedRole === role
                        ? role === 'admin' ? 'bg-purple-500 text-white' :
                          role === 'officer' ? 'bg-blue-500 text-white' :
                          'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddMember(false)
                  setSelectedUser(null)
                  setSearchTerm("")
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addMember}
                disabled={!selectedUser}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Add Member
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Role Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {roleFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setRoleFilter(option.value as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                  roleFilter === option.value
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-4 w-4" />
                {option.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  roleFilter === option.value
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {memberSearch && (
              <button
                onClick={() => setMemberSearch("")}
                className="absolute right-3 top-2.5"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No members found</p>
              <p className="text-sm">Try adjusting your filters or search</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.user_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {member.profile?.avatar_url ? (
                    <img 
                      src={member.profile.avatar_url} 
                      alt={member.name || getFullName(member.profile)}
                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      member.role === 'admin' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                      member.role === 'officer' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-600'
                    }`}>
                      {getInitials(member.profile)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {member.name || getFullName(member.profile)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.profile?.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                  
                  {canModifyMember(member.role) && (
                    <div className="relative group">
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </button>
                      
                      <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[150px]">
                        {member.role !== 'admin' && (
                          <button
                            onClick={() => updateMemberRole(member.user_id, 'admin')}
                            className="w-full px-4 py-2 text-left hover:bg-purple-50 text-sm font-bold text-purple-700 flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Make Admin
                          </button>
                        )}
                        {member.role !== 'officer' && (
                          <button
                            onClick={() => updateMemberRole(member.user_id, 'officer')}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm font-bold text-blue-700"
                          >
                            Make Officer
                          </button>
                        )}
                        {member.role !== 'member' && (
                          <button
                            onClick={() => updateMemberRole(member.user_id, 'member')}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm font-bold text-gray-700"
                          >
                            Make Member
                          </button>
                        )}
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={() => removeMember(member.user_id)}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm font-bold text-red-700 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <OrganizationSettingsContent />
    </Suspense>
  )
}