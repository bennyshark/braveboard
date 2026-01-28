// components/comments/InlineCommentBox.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { Send, X, Image, Loader2, ChevronDown, Shield, Users, User } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface InlineCommentBoxProps {
  contentType: 'post' | 'announcement' | 'bulletin' | 'free_wall_post' | 'repost'
  contentId: string
  eventId?: string
  parentCommentId?: string
  replyingTo?: string
  onCancel: () => void
  onCommentCreated: () => void
}

type PostingIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  id?: string
  name: string
  icon: 'user' | 'org' | 'faith'
}

export function InlineCommentBox({
  contentType,
  contentId,
  eventId,
  parentCommentId,
  replyingTo,
  onCancel,
  onCommentCreated
}: InlineCommentBoxProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Identity State
  const [availableIdentities, setAvailableIdentities] = useState<PostingIdentity[]>([])
  const [selectedIdentity, setSelectedIdentity] = useState<PostingIdentity | null>(null)
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false)
  const [isLoadingIdentities, setIsLoadingIdentities] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Fetch Identities on Mount
  useEffect(() => {
    let isMounted = true

    async function fetchIdentities() {
      try {
        setIsLoadingIdentities(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const identities: PostingIdentity[] = []

        // 1. Fetch User Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('id', user.id)
          .single()

        const userName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'You'
          : 'You'

        // Add User Identity
        identities.push({
          type: 'user',
          name: userName,
          icon: 'user'
        })

        // 2. Check for Faith Admin
        const isFaithAdmin = profile?.role === 'admin'
        if (isFaithAdmin) {
          identities.push({
            type: 'faith_admin',
            name: 'FAITH Admin',
            icon: 'faith'
          })
        }

        // 3. Fetch Organizations (Officer/Admin roles)
        // Note: Removed logo_url to match CreatePostDialog logic exactly
        const { data: userOrgs, error: orgsError } = await supabase
          .from('user_organizations')
          .select(`
            organization_id,
            role,
            organization:organizations!inner(id, name)
          `)
          .eq('user_id', user.id)
          .in('role', ['officer', 'admin'])

        if (orgsError) {
          console.error("Error fetching organizations:", orgsError)
        }

        if (userOrgs && userOrgs.length > 0) {
          userOrgs.forEach((uo: any) => {
            // Ensure organization exists and has a name
            if (uo.organization) {
              identities.push({
                type: 'organization',
                id: uo.organization.id,
                name: uo.organization.name,
                icon: 'org'
              })
            }
          })
        }

        if (isMounted) {
          setAvailableIdentities(identities)
          setSelectedIdentity(identities[0])
        }

      } catch (error) {
        console.error('Error fetching identities:', error)
      } finally {
        if (isMounted) {
          setIsLoadingIdentities(false)
        }
      }
    }

    fetchIdentities()

    return () => {
      isMounted = false
    }
  }, [])

  // Handle click outside dropdown
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
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getIdentityIcon = (icon: string) => {
    switch(icon) {
      case 'faith': return <Shield className="h-3.5 w-3.5 text-purple-600" />
      case 'org': return <Users className="h-3.5 w-3.5 text-orange-600" />
      default: return <User className="h-3.5 w-3.5 text-blue-600" />
    }
  }

  const handleSubmit = async () => {
    if ((!content.trim() && !image) || !selectedIdentity) {
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let imageUrl: string | null = null

      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
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
        author_id: user.id,
        content_type: contentType,
        content_id: contentId,
        content: content.trim(),
        image_url: imageUrl,
        parent_comment_id: parentCommentId || null,
        posted_as_type: selectedIdentity.type,
        posted_as_org_id: selectedIdentity.type === 'organization' ? selectedIdentity.id : null
      })

      if (error) throw error

      setContent("")
      removeImage()
      onCommentCreated()
    } catch (error: any) {
      console.error("Error creating comment:", error)
      alert(`Failed to create comment: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm transition-all relative z-10">
      
      {/* Identity Selector Header */}
      <div className="flex items-center justify-between mb-3">
        {availableIdentities.length > 1 ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowIdentityDropdown(!showIdentityDropdown)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-xs font-bold text-gray-700"
            >
              <span className="text-gray-500 font-medium">Commenting as</span>
              <div className="flex items-center gap-1.5">
                {selectedIdentity && getIdentityIcon(selectedIdentity.icon)}
                <span className="truncate max-w-[150px]">{selectedIdentity?.name}</span>
              </div>
              <ChevronDown className={`h-3 w-3 transition-transform ${showIdentityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showIdentityDropdown && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {availableIdentities.map((identity, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIdentity(identity)
                      setShowIdentityDropdown(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`p-1.5 rounded-md ${
                      identity.icon === 'faith' ? 'bg-purple-100' : 
                      identity.icon === 'org' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      {getIdentityIcon(identity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{identity.name}</div>
                      <div className="text-[10px] text-gray-500 capitalize">{identity.type.replace('_', ' ')}</div>
                    </div>
                    {selectedIdentity?.name === identity.name && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 flex items-center gap-2 mb-1">
            {isLoadingIdentities ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Loading...</span>
            ) : (
              <>
                <span>Commenting as</span>
                <span className="font-bold text-gray-700">{selectedIdentity?.name || 'You'}</span>
              </>
            )}
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>Replying to</span>
            <span className="font-bold text-blue-600">{replyingTo}</span>
          </div>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
        rows={3}
        disabled={isSubmitting}
      />

      {imagePreview && (
        <div className="relative mt-3 inline-block animate-in zoom-in-95 duration-200">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 object-cover"
          />
          <button
            onClick={removeImage}
            disabled={isSubmitting}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg disabled:opacity-50 transition-transform hover:scale-110"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Add image"
          >
            <Image className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !image) || isLoadingIdentities}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}