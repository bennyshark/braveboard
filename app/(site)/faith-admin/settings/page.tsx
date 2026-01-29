// app/(site)/faith-admin/settings/page.tsx
"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Settings,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Camera,
  Edit,
  X,
  Check,
  Shield
} from "lucide-react"

type FaithAdmin = {
  description: string | null
  avatar_url: string | null
  cover_url: string | null
}

type DragType = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

function FaithAdminSettingsContent() {
  const router = useRouter()

  const [faithAdmin, setFaithAdmin] = useState<FaithAdmin>({
    description: null,
    avatar_url: null,
    cover_url: null
  })
  const [isFaithAdmin, setIsFaithAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Edit state
  const [showEditInfo, setShowEditInfo] = useState(false)
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
  }, [])

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      drawCanvas()
    }
  }, [imageSrc, crop])

  async function loadData() {
    try {
      setLoading(true)

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

      const isAdmin = profile?.role === 'admin'
      setIsFaithAdmin(isAdmin)

      if (!isAdmin) {
        router.push('/faith-admin')
        return
      }

      // Load FAITH admin settings
      const { data: settings } = await supabase
        .from('faith_admin_settings')
        .select('*')
        .single()

      if (settings) {
        setFaithAdmin({
          description: settings.description,
          avatar_url: settings.avatar_url,
          cover_url: settings.cover_url
        })
        setEditDescription(settings.description || "")
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateFaithAdmin() {
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('faith_admin_settings')
        .select('id')
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('faith_admin_settings')
          .update({
            description: editDescription
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('faith_admin_settings')
          .insert({
            description: editDescription
          })

        if (error) throw error
      }

      setFaithAdmin({
        ...faithAdmin,
        description: editDescription
      })
      setShowEditInfo(false)
      alert('Settings updated successfully!')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      alert(`Failed to update: ${error.message}`)
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
      ctx.strokeStyle = '#8b5cf6'
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
      ctx.strokeStyle = '#8b5cf6'
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
      const fileName = `faith-admin/${cropType}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      const updateField = cropType === 'avatar' ? 'avatar_url' : 'cover_url'
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from('faith_admin_settings')
        .select('id')
        .single()

      if (existing) {
        const { error: updateError } = await supabase
          .from('faith_admin_settings')
          .update({ [updateField]: publicUrl })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('faith_admin_settings')
          .insert({ [updateField]: publicUrl })

        if (insertError) throw insertError
      }

      setFaithAdmin({ ...faithAdmin, [updateField]: publicUrl })
      setCropModalOpen(false)
      setImageSrc("")

    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  if (!isFaithAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-gray-500">Access denied. FAITH Admin only.</p>
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
                onClick={() => setCropModalOpen(false)}
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
                  onClick={() => setCropModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          onClick={() => router.push('/faith-admin')} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to FAITH Admin
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">FAITH Admin Settings</h1>
            <p className="text-gray-600">Manage official administration profile</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden mb-6">
        
        {/* Cover Photo */}
        <div className="relative h-56 bg-gradient-to-r from-purple-500 to-purple-600 group z-0">
          {faithAdmin.cover_url && (
            <img 
              src={faithAdmin.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <label className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Camera className="h-4 w-4 text-gray-700" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'cover')}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-8 relative z-10">
          
          {/* Avatar and Info Row */}
          <div className="flex items-end justify-between -mt-20 mb-6 gap-4">
             {/* Avatar */}
             <div className="relative group">
                {faithAdmin.avatar_url ? (
                  <img 
                    src={faithAdmin.avatar_url} 
                    alt="FAITH Administration"
                    className="h-40 w-40 rounded-2xl border-[6px] border-white shadow-xl object-cover bg-white"
                  />
                ) : (
                  <div className="h-40 w-40 rounded-2xl border-[6px] border-white shadow-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Shield className="text-white h-16 w-16" />
                  </div>
                )}
                
                {/* Avatar Edit Button */}
                <label className="absolute bottom-2 right-2 p-2 bg-white rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-100">
                  <Camera className="h-4 w-4 text-gray-700" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'avatar')}
                    disabled={uploading}
                  />
                </label>
             </div>

             {/* Edit Toggle */}
             <button
              onClick={() => setShowEditInfo(!showEditInfo)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 mb-2"
            >
              <Edit className="h-4 w-4" />
              {showEditInfo ? 'Cancel' : 'Edit Description'}
            </button>
          </div>

          {!showEditInfo && (
            <div className="mb-4">
                <h2 className="text-3xl font-black text-gray-900">FAITH Administration</h2>
                <p className="text-purple-600 font-bold">Official Administration</p>
            </div>
          )}

          {/* Edit Form */}
          {showEditInfo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none resize-none"
                  placeholder="Describe the FAITH Administration..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditInfo(false)
                    setEditDescription(faithAdmin.description || "")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateFaithAdmin}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            faithAdmin.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 leading-relaxed">{faithAdmin.description}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-purple-900 mb-1">FAITH Admin Settings</h3>
            <p className="text-sm text-purple-800">
              These settings control the public profile for FAITH Administration. Only FAITH administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FaithAdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <FaithAdminSettingsContent />
    </Suspense>
  )
}