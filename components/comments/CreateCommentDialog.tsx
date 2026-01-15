// components/comments/CreateCommentDialog.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { X, Image as ImageIcon, Loader2, Send, User, Shield, Users, ChevronDown } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface CreateCommentDialogProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  eventId: string
  parentCommentId?: string | null
  replyingTo?: string | null
  onCommentCreated?: () => void
}

type CommentingIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  id?: string
  name: string
  icon: 'user' | 'org' | 'faith'
}

export function CreateCommentDialog({ 
  isOpen, 
  onClose, 
  postId, 
  eventId,
  parentCommentId = null,
  replyingTo = null,
  onCommentCreated 
}: CreateCommentDialogProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [availableIdentities, setAvailableIdentities] = useState<CommentingIdentity[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<CommentingIdentity | null>(null)
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

        const identities: CommentingIdentity[] = []

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
          } else if (participantOrgIds.length > 0) {
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
    const file = e.target.files?.[0]
    if (!file) return

    setImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!content.trim() && !image) {
      alert("Please add some content or an image")
      return
    }

    if (!selectedIdentity) {
      alert("Please select a commenting identity")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let imageUrl: string | null = null
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('comments')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('comments')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        parent_comment_id: parentCommentId,
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        posted_as_type: selectedIdentity.type,
        posted_as_org_id: selectedIdentity.type === 'organization' ? selectedIdentity.id : null
      })

      if (error) throw error

      setContent("")
      setImage(null)
      setImagePreview(null)
      
      if (onCommentCreated) onCommentCreated()
      onClose()
      
    } catch (error: any) {
      console.error("Error creating comment:", error)
      alert(`Failed to create comment: ${error.message}`)
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-black text-gray-900">
              {parentCommentId ? 'Reply to Comment' : 'Add Comment'}
            </h3>
            {replyingTo && (
              <p className="text-xs text-gray-500 mt-1">Replying to {replyingTo}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {!loading && availableIdentities.length > 1 && (
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Commenting as:
              </label>
              <button
                onClick={() => setShowIdentityDropdown(!showIdentityDropdown)}
                className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
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
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`p-2 ${getIdentityBgColor(identity.icon)} rounded-lg`}>
                        {getIdentityIcon(identity.icon)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{identity.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{identity.type.replace('_', ' ')}</div>
                      </div>
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
          
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-gray-900"
              rows={4}
              maxLength={2000}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {content.length} / 2000
            </div>
          </div>

          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-w-sm rounded-xl border-2 border-gray-200" 
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {!image && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl text-gray-700 hover:text-blue-700 font-bold transition-all"
            >
              <ImageIcon className="h-4 w-4" />
              Add Image (Optional)
            </button>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !image) || !selectedIdentity}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {parentCommentId ? 'Reply' : 'Comment'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}