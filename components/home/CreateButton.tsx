// components/home/CreateButton.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronDown, Shield, Users } from "lucide-react"
import { Organization } from "@/app/(site)/home/types"

interface CreateButtonProps {
  activeFeedFilter: string
  isFaithAdmin: boolean
  userCreateOrgs: Organization[]
}

export function CreateButton({ activeFeedFilter, isFaithAdmin, userCreateOrgs }: CreateButtonProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Organizations allowed to create announcements (restricted list)
  const announcementAllowedOrgs = ["Student Council", "Lighthouse"]
  
  // For bulletins and events, all officer/admin orgs can create
  const allowedOrgs = activeFeedFilter === 'announcements' 
    ? userCreateOrgs.filter(org => announcementAllowedOrgs.includes(org.name))
    : userCreateOrgs

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
    const canCreateMultiple = isFaithAdmin || allowedOrgs.length > 0
    const hasMultipleOptions = isFaithAdmin && allowedOrgs.length > 0
    
    if (!canCreateMultiple) {
      const message = activeFeedFilter === 'announcements'
        ? 'Only FAITH Administration, Student Council, and Lighthouse can create announcements'
        : 'You need to be an officer or admin of an organization to create content'
      alert(message)
      return
    }
    
    // Determine target page based on active filter
    const basePath = activeFeedFilter === 'announcements' 
      ? '/create-announcement' 
      : activeFeedFilter === 'bulletin'
      ? '/create-bulletin'
      : '/create-event'
    
    // If only one option exists, go directly there with the correct params
    if (!hasMultipleOptions) {
      if (isFaithAdmin) {
        router.push(`${basePath}?type=faith_admin`)
      } else if (allowedOrgs.length > 0) {
        router.push(`${basePath}?type=organization&orgId=${allowedOrgs[0].id}`)
      }
      return
    }
    
    setShowDropdown(!showDropdown)
  }

  const handleOptionClick = (type: 'faith_admin' | 'organization', orgId?: string) => {
    const basePath = activeFeedFilter === 'announcements' 
      ? '/create-announcement' 
      : activeFeedFilter === 'bulletin'
      ? '/create-bulletin'
      : '/create-event'
    
    if (type === 'faith_admin') {
      router.push(`${basePath}?type=faith_admin`)
    } else {
      router.push(`${basePath}?type=organization&orgId=${orgId}`)
    }
  }

  const buttonLabel = activeFeedFilter === 'announcements' 
    ? 'Create Post' 
    : activeFeedFilter === 'bulletin'
    ? 'Create Post'
    : 'Create Event'

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
        {(isFaithAdmin || allowedOrgs.length > 0) && (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border-2 border-gray-200 shadow-xl z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Create as:</div>
            
            {isFaithAdmin && (
              <button 
                onClick={() => handleOptionClick('faith_admin')} 
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

            {allowedOrgs.map(org => (
              <button 
                key={org.id} 
                onClick={() => handleOptionClick('organization', org.id)} 
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