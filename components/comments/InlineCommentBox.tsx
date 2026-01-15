// components/comments/InlineCommentBox.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { X, Image as ImageIcon, Loader2, Send, User, Shield, Users, ChevronDown } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface InlineCommentBoxProps {
  postId: string
  eventId: string
  parentCommentId?: string | null
  replyingTo?: string | null
  onCancel: () => void
  onCommentCreated?: () => void
}

type CommentingIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  id?: string
  name: string
  icon: 'user' | 'org' | 'faith'
}

export function InlineCommentBox({ 
  postId, 
  eventId,
  parentCommentId = null,
  replyingTo = null,
  onCancel,
  onCommentCreated 
}: InlineCommentBoxProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [availableIdentities, setAvailableIdentities] = useState<CommentingIdentity[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<CommentingIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
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
  }, [eventId, supabase])

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
      onCancel()
      
    } catch (error: any) {
      console.error("Error creating comment:", error)
      alert(`Failed to create comment: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIdentityIcon = (icon: string) => {
    switch(icon) {
      case 'faith': return <Shield className="h-4 w-4 text-purple-600" />
      case 'org': return <Users className="h-4 w-4 text-orange-600" />
      default: return <User className="h-4 w-4 text-blue-600" />
    }
  }

  const getIdentityBgColor = (icon: string) => {
    switch(icon) {
      case 'faith': return 'bg-purple-100'
      case 'org': return 'bg-orange-100'
      default: return 'bg-blue-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-700 font-medium">
            Replying to <span className="font-bold">{replyingTo}</span>
          </p>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
          >
            <X className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      )}

      {/* Identity selector */}
      {availableIdentities.length > 1 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowIdentityDropdown(!showIdentityDropdown)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg hover:border-blue-300 transition-all text-sm"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${getIdentityBgColor(selectedIdentity?.icon || 'user')} rounded`}>
                {getIdentityIcon(selectedIdentity?.icon || 'user')}
              </div>
              <span className="font-medium text-gray-900">{selectedIdentity?.name}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showIdentityDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showIdentityDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-xl z-10 overflow-hidden">
              {availableIdentities.map((identity, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedIdentity(identity)
                    setShowIdentityDropdown(false)
                  }}
                  className="w-full flex items-center gap-2 p-2.5 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className={`p-1.5 ${getIdentityBgColor(identity.icon)} rounded`}>
                    {getIdentityIcon(identity.icon)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{identity.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{identity.type.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        className="w-full px-3 py-2 border border-blue-200 rounded-lg resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 text-sm"
        rows={3}
        maxLength={2000}
      />

      {/* Character count */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{content.length} / 2000</span>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full max-w-[200px] rounded-lg border-2 border-blue-200" 
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-300 rounded-lg text-sm font-medium text-gray-700 transition-all"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Image
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !image) || !selectedIdentity}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                {parentCommentId ? 'Reply' : 'Comment'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}