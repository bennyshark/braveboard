// components/menus/PostOptionsMenu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit2, Trash2, Pin, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { EditPostDialog } from "./EditPostDialog"

interface PostOptionsMenuProps {
  postId: string
  eventId: string
  authorId: string
  currentPinOrder: number | null
  content: string
  onUpdate: () => void
  onDelete?: () => void
}

type PinStatus = {
  1: boolean
  2: boolean
  3: boolean
}

export function PostOptionsMenu({ 
  postId, 
  eventId, 
  authorId, 
  currentPinOrder,
  content,
  onUpdate,
  onDelete
}: PostOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [canPin, setCanPin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [pinStatus, setPinStatus] = useState<PinStatus>({ 1: false, 2: false, 3: false })
  const menuRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    async function checkPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user can manage (delete) post
        const { data: canManage } = await supabase.rpc('can_user_manage_post', {
          p_post_id: postId,
          p_user_id: user.id
        })

        setCanEdit(user.id === authorId)
        setCanDelete(canManage || false)

        // Check if user can pin posts (admin or org officer)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isFaithAdmin = profile?.role === 'admin'

        // Check if user is an officer/admin of any participating org
        const { data: eventData } = await supabase
          .from('events')
          .select('participant_orgs')
          .eq('id', eventId)
          .single()

        let isOrgOfficer = false
        if (eventData?.participant_orgs && eventData.participant_orgs.length > 0) {
          const { data: userOrgs } = await supabase
            .from('user_organizations')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .in('organization_id', eventData.participant_orgs)
            .in('role', ['officer', 'admin'])

          isOrgOfficer = (userOrgs && userOrgs.length > 0) || false
        }

        setCanPin(isFaithAdmin || isOrgOfficer)

        // Get existing pinned posts
        const { data: pinnedPosts } = await supabase
          .from('posts')
          .select('pin_order')
          .eq('event_id', eventId)
          .not('pin_order', 'is', null)
          .neq('id', postId) // Exclude current post

        const newPinStatus: PinStatus = { 1: false, 2: false, 3: false }
        if (pinnedPosts) {
          pinnedPosts.forEach(post => {
            if (post.pin_order && [1, 2, 3].includes(post.pin_order)) {
              newPinStatus[post.pin_order as 1 | 2 | 3] = true
            }
          })
        }
        setPinStatus(newPinStatus)

      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPermissions()
  }, [postId, eventId, authorId, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    if (!confirm('Delete this post? This will also delete all comments.')) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      
      setShowMenu(false)
      if (onDelete) onDelete()
      else onUpdate()
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handlePin = async (pinOrder: number | null) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pin_order: pinOrder })
        .eq('id', postId)

      if (error) throw error
      
      setShowMenu(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error pinning post:', error)
      alert(`Failed to pin: ${error.message}`)
    }
  }

  if (loading || (!canEdit && !canDelete && !canPin)) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        disabled={deleting}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 overflow-hidden">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowEditDialog(true)
                setShowMenu(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit Post
            </button>
          )}

          {canPin && (
            <>
              {currentPinOrder === null ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!pinStatus[1]) handlePin(1)
                    }}
                    disabled={pinStatus[1]}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                      pinStatus[1]
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-yellow-50 text-gray-700 hover:text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin className="h-4 w-4" />
                      <span>Pin as 1st</span>
                    </div>
                    {pinStatus[1] && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Taken
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!pinStatus[2]) handlePin(2)
                    }}
                    disabled={pinStatus[2]}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                      pinStatus[2]
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-yellow-50 text-gray-700 hover:text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin className="h-4 w-4" />
                      <span>Pin as 2nd</span>
                    </div>
                    {pinStatus[2] && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Taken
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!pinStatus[3]) handlePin(3)
                    }}
                    disabled={pinStatus[3]}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                      pinStatus[3]
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-yellow-50 text-gray-700 hover:text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin className="h-4 w-4" />
                      <span>Pin as 3rd</span>
                    </div>
                    {pinStatus[3] && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Taken
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePin(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium text-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Unpin Post
                </button>
              )}
            </>
          )}

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-sm font-medium text-red-600 hover:text-red-700 transition-colors border-t border-gray-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Post'}
            </button>
          )}
        </div>
      )}

      {showEditDialog && (
        <EditPostDialog
          postId={postId}
          initialContent={content}
          onClose={() => setShowEditDialog(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}