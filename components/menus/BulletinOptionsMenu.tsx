// components/menus/BulletinOptionsMenu.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface BulletinOptionsMenuProps {
  bulletinId: string
  onUpdate: () => void
}

export function BulletinOptionsMenu({ bulletinId, onUpdate }: BulletinOptionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
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

        const { data } = await supabase.rpc('can_user_delete_content', {
          p_content_type: 'bulletin',
          p_content_id: bulletinId,
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
  }, [bulletinId, supabase])

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
    router.push(`/edit-bulletin/${bulletinId}`)
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this bulletin? This will also delete all comments.')) return

    try {
      const { error } = await supabase.from('bulletins').delete().eq('id', bulletinId)
      if (error) throw error
      
      onUpdate()
      setShowMenu(false)
    } catch (error: any) {
      console.error('Error deleting bulletin:', error)
      alert(`Failed to delete: ${error.message}`)
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
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
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
            Edit Bulletin
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-sm font-medium text-red-600 hover:text-red-700 transition-colors border-t border-gray-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete Bulletin
          </button>
        </div>
      )}
    </div>
  )
}


