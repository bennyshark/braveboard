"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { EditRepostDialog } from "./EditRepostDialog"

interface RepostOptionsMenuProps {
  repostId: string
  userId: string // This is the ID of the person who created the repost
  comment: string
  onUpdate: () => void
}

export function RepostOptionsMenu({ 
  repostId, 
  userId, 
  comment,
  onUpdate
}: RepostOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
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
        // 1. Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 2. Fetch the current user's profile to check for admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isAdmin = profile?.role === 'admin'
        const isOwner = user.id === userId

        // 3. Set permissions
        // Only the owner can edit the content
        setCanEdit(isOwner)
        
        // Owner OR Admin can delete
        setCanDelete(isOwner || isAdmin)

      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPermissions()
  }, [repostId, userId, supabase])

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
    if (!confirm('Delete this repost? This will also delete all comments and reactions on it.')) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('reposts').delete().eq('id', repostId)
      if (error) throw error
      
      setShowMenu(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting repost:', error)
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // If loading, or if the user has NO permissions, return null
  if (loading || (!canEdit && !canDelete)) return null

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
          {/* Only show Edit if they are the owner */}
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
              Edit Repost
            </button>
          )}

          {/* Show Delete if Owner OR Admin */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={deleting}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors border-t border-gray-100 disabled:opacity-50
                ${canEdit 
                  ? 'hover:bg-red-50 text-red-600 hover:text-red-700' // Styling if it's the owner (standard delete)
                  : 'bg-red-50 text-red-700 hover:bg-red-100' // Styling if it's admin (highlighted action)
                }
              `}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Repost'}
            </button>
          )}
        </div>
      )}

      {showEditDialog && (
        <EditRepostDialog
          repostId={repostId}
          initialComment={comment}
          onClose={() => setShowEditDialog(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}