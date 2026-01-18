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

        const { data: canManage } = await supabase.rpc('can_user_manage_post', {
          p_post_id: postId,
          p_user_id: user.id
        })

        setCanEdit(user.id === authorId)
        setCanDelete(canManage || false)

        const { data: canPinPost } = await supabase.rpc('can_user_pin_post', {
          p_event_id: eventId,
          p_user_id: user.id
        })
        setCanPin(canPinPost || false)

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
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 overflow-hidden">
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
                      handlePin(1)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-left text-sm font-medium text-gray-700 hover:text-yellow-700 transition-colors"
                  >
                    <Pin className="h-4 w-4" />
                    Pin as 1st
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePin(2)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-left text-sm font-medium text-gray-700 hover:text-yellow-700 transition-colors"
                  >
                    <Pin className="h-4 w-4" />
                    Pin as 2nd
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePin(3)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-left text-sm font-medium text-gray-700 hover:text-yellow-700 transition-colors"
                  >
                    <Pin className="h-4 w-4" />
                    Pin as 3rd
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