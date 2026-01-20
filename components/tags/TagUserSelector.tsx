"use client"

import { useState, useEffect } from "react"
import { Search, X, UserPlus, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface TagUserSelectorProps {
  selectedUsers: string[]
  onUsersChange: (userIds: string[]) => void
}

type User = {
  id: string
  name: string
  avatarUrl: string | null
  departmentCode: string | null
  courseCode: string | null
  isSelf?: boolean
}

export function TagUserSelector({ selectedUsers, onUsersChange }: TagUserSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedUsers.includes(user.id)
      )
      setFilteredUsers(filtered.slice(0, 50)) // Increased limit to show more results
      setShowDropdown(true)
    } else {
      setFilteredUsers([])
      setShowDropdown(false)
    }
  }, [searchTerm, users, selectedUsers])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, department_code, course_code')
        .limit(100)

      if (error) throw error

      const mappedUsers: User[] = data.map(u => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
        avatarUrl: u.avatar_url,
        departmentCode: u.department_code,
        courseCode: u.course_code,
        isSelf: u.id === user.id
      }))

      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUser = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      onUsersChange([...selectedUsers, userId])
    }
    setSearchTerm("")
    setShowDropdown(false)
  }

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(id => id !== userId))
  }

  const selectedUserObjects = users.filter(u => selectedUsers.includes(u.id))

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      {/* Selected Users Pills */}
      {selectedUserObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUserObjects.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full shadow-sm"
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">{getInitials(user.name)}</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {user.name}
              </span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-blue-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input Area */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people by name..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 focus:outline-none text-base transition-all"
            autoFocus
          />
        </div>

        {/* Dropdown Results - INCREASED SIZE */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => addUser(user.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 group"
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">{getInitials(user.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user.name}
                      {user.isSelf && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">You</span>}
                    </div>
                    {(user.departmentCode || user.courseCode) && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {user.departmentCode} {user.courseCode ? `• ${user.courseCode}` : ''}
                      </div>
                    )}
                  </div>
                  <UserPlus className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))
            ) : (
              <div className="px-4 py-12 text-gray-500 text-center flex flex-col items-center">
                <div className="p-3 bg-gray-50 rounded-full mb-2">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p>No users found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 ml-1">
        Start typing a name to see suggestions.
      </p>
    </div>
  )
}