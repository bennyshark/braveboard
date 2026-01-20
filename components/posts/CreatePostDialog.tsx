// components/posts/CreatePostDialog.tsx - UPDATED with TagUserSelector
"use client"

import { useState, useRef, useEffect } from "react"
import { X, Image as ImageIcon, Loader2, Send, Sparkles, Shield, Users, User, ChevronDown } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { TagUserSelector } from "@/components/tags/TagUserSelector"

interface CreatePostDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onPostCreated?: () => void
}

type PostingIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  id?: string
  name: string
  icon: 'user' | 'org' | 'faith'
}

const MAX_IMAGES = 150

export function CreatePostDialog({ isOpen, onClose, eventId, onPostCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false)
  const [taggedUsers, setTaggedUsers] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [availableIdentities, setAvailableIdentities] = useState<PostingIdentity[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<PostingIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    if (!isOpen) return
    
    async function fetchIdentities() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const identities: PostingIdentity[] = []

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('id', user.id)
          .single()

        const userName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'You'
          : 'You'

        identities.push({
          type: 'user',
          name: userName,
          icon: 'user'
        })

        const isFaithAdmin = profile?.role === 'admin'
        if (isFaithAdmin) {
          identities.push({
            type: 'faith_admin',
            name: 'FAITH Administration',
            icon: 'faith'
          })
        }

        const { data: eventData } = await supabase
          .from('events')
          .select('participant_type, participant_orgs')
          .eq('id', eventId)
          .single()

        const participantType = eventData?.participant_type
        const participantOrgIds = eventData?.participant_orgs || []

        const { data: userOrgs } = await supabase
          .from('user_organizations')
          .select(`
            organization_id,
            role,
            organization:organizations!inner(id, name)
          `)
          .eq('user_id', user.id)
          .in('role', ['officer', 'admin'])

        if (userOrgs) {
          let eligibleOrgs: any[]

          if (participantType === 'public') {
            eligibleOrgs = userOrgs
          } 
          else if (participantOrgIds.length > 0) {
            eligibleOrgs = userOrgs.filter((uo: any) => 
              participantOrgIds.includes(uo.organization_id)
            )
          } else {
            eligibleOrgs = []
          }

          eligibleOrgs.forEach((uo: any) => {
            identities.push({
              type: 'organization',
              id: uo.organization.id,
              name: uo.organization.name,
              icon: 'org'
            })
          })
        }

        setAvailableIdentities(identities)
        setSelectedIdentity(identities[0])

      } catch (error) {
        console.error('Error fetching identities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIdentities()
  }, [isOpen, eventId, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIdentityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    if (!content.trim() && images.length === 0) {
      alert("Please add some content or images")
      return
    }

    if (!selectedIdentity) {
      alert("Please select a posting identity")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Upload images
      const imageUrls: string[] = []
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrls.push(publicUrl)
      }

      // Create post
      const { data: postData, error } = await supabase.from('posts').insert({
        event_id: eventId,
        author_id: user.id,
        content: content.trim(),
        image_urls: imageUrls,
        posted_as_type: selectedIdentity.type,
        posted_as_org_id: selectedIdentity.type === 'organization' ? selectedIdentity.id : null
      }).select('id').single()

      if (error) throw error

      // Create tags
      if (taggedUsers.length > 0 && postData) {
        const tagInserts = taggedUsers.map(userId => ({
          content_type: 'post',
          content_id: postData.id,
          tagged_user_id: userId,
          tagged_by_user_id: user.id
        }))

        const { error: tagError } = await supabase
          .from('tags')
          .insert(tagInserts)

        if (tagError) console.error('Error creating tags:', tagError)
      }

      // Reset form
      setContent("")
      setImages([])
      setImagePreviews([])
      setTaggedUsers([])
      
      if (onPostCreated) onPostCreated()
      onClose()
      
    } catch (error: any) {
      console.error("Error creating post:", error)
      alert(`Failed to create post: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIdentityIcon = (icon: string) => {
    switch(icon) {
      case 'faith': return <Shield className="h-5 w-5 text-purple-600" />
      case 'org': return <Users className="h-5 w-5 text-orange-600" />
      default: return <User className="h-5 w-5 text-blue-600" />
    }
  }

  const getIdentityBgColor = (icon: string) => {
    switch(icon) {
      case 'faith': return 'bg-purple-100'
      case 'org': return 'bg-orange-100'
      default: return 'bg-blue-100'
    }
  }

  if (!isOpen) return null

  const charCount = content.length
  const maxChars = 5000

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-10"></div>
          <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Create Post</h3>
                <p className="text-xs text-gray-500 font-medium">Share your thoughts with the community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 duration-300"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Posting Identity Selector */}
          {!loading && availableIdentities.length > 1 && (
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Posting as:
              </label>
              <button
                onClick={() => setShowIdentityDropdown(!showIdentityDropdown)}
                className="w-full flex items-center justify-between gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${getIdentityBgColor(selectedIdentity?.icon || 'user')} rounded-lg`}>
                    {getIdentityIcon(selectedIdentity?.icon || 'user')}
                  </div>
                  <span className="font-bold text-gray-900">{selectedIdentity?.name}</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showIdentityDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showIdentityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                  {availableIdentities.map((identity, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedIdentity(identity)
                        setShowIdentityDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`p-2 ${getIdentityBgColor(identity.icon)} rounded-lg`}>
                        {getIdentityIcon(identity.icon)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{identity.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{identity.type.replace('_', ' ')}</div>
                      </div>
                      {selectedIdentity?.name === identity.name && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Text Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your experience, thoughts, or updates..."
              className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-gray-900 text-lg transition-all placeholder:text-gray-400"
              rows={8}
              maxLength={maxChars}
            />
            
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                charCount > maxChars * 0.9 
                  ? 'bg-red-100 text-red-700' 
                  : charCount > maxChars * 0.7 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* Tag Users */}
          <TagUserSelector
            selectedUsers={taggedUsers}
            onUsersChange={setTaggedUsers}
          />

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
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Button */}
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
              className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl text-gray-700 hover:text-blue-700 font-bold transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span>Add Images ({images.length}/{MAX_IMAGES})</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="relative overflow-hidden border-t border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
          <div className="relative flex gap-4 p-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && images.length === 0) || !selectedIdentity}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <span>Post Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}