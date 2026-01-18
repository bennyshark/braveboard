// components/menus/EventOptionsMenu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface EventOptionsMenuProps {
  eventId: string
  onUpdate: () => void
  onDelete?: () => void
}

export function EventOptionsMenu({ eventId, onUpdate, onDelete }: EventOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    async function checkPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase.rpc('can_user_manage_event', {
          p_event_id: eventId,
          p_user_id: user.id
        })

        setCanManage(data || false)
      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setLoading(false)
      }
    }
    checkPermissions()
  }, [eventId, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEdit = () => {
    router.push(`/edit-event/${eventId}`)
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event? This will permanently delete all posts and comments within this event.')) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) throw error
      
      setShowMenu(false)
      if (onDelete) onDelete()
      else onUpdate()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !canManage) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={deleting}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit Event
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={deleting}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-sm font-medium text-red-600 hover:text-red-700 transition-colors border-t border-gray-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Event'}
          </button>
        </div>
      )}
    </div>
  )
}