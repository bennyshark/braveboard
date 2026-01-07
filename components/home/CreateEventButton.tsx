// components/home/CreateEventButton.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronDown, Shield, Users } from "lucide-react"
import { Organization } from "@/app/(site)/home/types"

interface CreateEventButtonProps {
  activeFeedFilter: string
  isFaithAdmin: boolean
  userCreateOrgs: Organization[]
}

export function CreateEventButton({ activeFeedFilter, isFaithAdmin, userCreateOrgs }: CreateEventButtonProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateClick = () => {
    if (activeFeedFilter === 'announcements') return 
    
    const canCreateMultiple = isFaithAdmin || userCreateOrgs.length > 0
    const hasMultipleOptions = isFaithAdmin && userCreateOrgs.length > 0
    
    if (!canCreateMultiple) {
      alert('You need to be an officer or admin of an organization to create events')
      return
    }
    
    // If only one option exists, go directly there with the correct params
    if (!hasMultipleOptions) {
      if (isFaithAdmin) {
        router.push('/create-event?type=faith_admin')
      } else if (userCreateOrgs.length > 0) {
        router.push(`/create-event?type=organization&orgId=${userCreateOrgs[0].id}`)
      }
      return
    }
    
    setShowDropdown(!showDropdown)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="h-4 w-4" />
        {activeFeedFilter === 'announcements' ? 'Create Post' : 'Create Event'}
        {activeFeedFilter !== 'announcements' && (isFaithAdmin || userCreateOrgs.length > 0) && (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && activeFeedFilter !== 'announcements' && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Create event as:</div>
            
            {isFaithAdmin && (
              <button 
                onClick={() => router.push('/create-event?type=faith_admin')} 
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-purple-50 rounded-lg transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm">FAITH Administration</div>
                </div>
              </button>
            )}

            {userCreateOrgs.map(org => (
              <button 
                key={org.id} 
                onClick={() => router.push(`/create-event?type=organization&orgId=${org.id}`)} 
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-orange-50 rounded-lg transition-colors text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{org.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{org.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}