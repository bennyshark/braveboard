// components/menus/FreeWallOptionsMenu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { EditFreeWallPostDialog } from "./EditFreeWallPostDialog"

interface FreeWallOptionsMenuProps {
  postId: string
  authorId: string
  content: string
  onUpdate: () => void
}

export function FreeWallOptionsMenu({ 
  postId, 
  authorId, 
  content,
  onUpdate
}: FreeWallOptionsMenuProps) {
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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // User can edit their own posts
        setCanEdit(user.id === authorId)

        // User can delete their own posts, or admins can delete any
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setCanDelete(user.id === authorId || profile?.role === 'admin')

      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPermissions()
  }, [postId, authorId, supabase])

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
    if (!confirm('Delete this post? This will also delete all comments and reactions.')) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('free_wall_posts').delete().eq('id', postId)
      if (error) throw error
      
      setShowMenu(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

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
        <EditFreeWallPostDialog
          postId={postId}
          initialContent={content}
          onClose={() => setShowEditDialog(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}