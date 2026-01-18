// components/menus/CommentOptionsMenu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface CommentOptionsMenuProps {
  commentId: string
  authorId: string
  hasReplies?: boolean
  onUpdate: () => void
}

export function CommentOptionsMenu({ 
  commentId, 
  authorId, 
  hasReplies = false,
  onUpdate 
}: CommentOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
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

        // Check if FAITH admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isFaithAdmin = profile?.role === 'admin'
        const isAuthor = user.id === authorId

        setCanDelete(isFaithAdmin || isAuthor)
      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPermissions()
  }, [commentId, authorId, supabase])

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
    const confirmMsg = hasReplies 
      ? 'This comment has replies. It will be marked as deleted but replies will remain visible.'
      : 'Delete this comment permanently?'
    
    if (!confirm(confirmMsg)) return

    try {
      if (hasReplies) {
        // Mark as deleted, keep the comment for reply chain
        const { error } = await supabase
          .from('comments')
          .update({ 
            content: '[Comment deleted]',
            image_url: null,
            is_deleted: true
          })
          .eq('id', commentId)
        
        if (error) throw error
      } else {
        // Actually delete if no replies
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId)
        
        if (error) throw error
      }
      
      setShowMenu(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  if (loading || !canDelete) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}