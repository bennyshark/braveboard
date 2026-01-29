// components/tags/TaggedUsersDisplay.tsx - OPTIMIZED with lazy loading
"use client"

import { useState, useEffect, useRef } from "react"
import { UserCheck, Edit2, X, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { TagUserSelector } from "./TagUserSelector"

interface TaggedUsersDisplayProps {
  contentType: 'post' | 'bulletin' | 'announcement' | 'repost' | 'free_wall_post'
  contentId: string
  canEdit: boolean 
  onTagsUpdated?: () => void
  initialCount?: number // OPTIMIZED: Pre-fetched count from parent
}

type TaggedUser = {
  id: string
  name: string
  avatarUrl: string | null
}

export function TaggedUsersDisplay({ 
  contentType, 
  contentId, 
  canEdit,
  onTagsUpdated,
  initialCount = 0 // OPTIMIZED
}: TaggedUsersDisplayProps) {
  // OPTIMIZED: Start with the count, only fetch details when modal opens
  const [tagCount, setTagCount] = useState(initialCount)
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([])
  const [loading, setLoading] = useState(false) // OPTIMIZED: Don't load on mount
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [postedAsType, setPostedAsType] = useState<'user' | 'organization' | 'faith_admin'>('user')
  const [detailsLoaded, setDetailsLoaded] = useState(false) // OPTIMIZED: Track if we've loaded details
  const iconRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // OPTIMIZED: Only load details when modal opens
  useEffect(() => {
    if (showModal && !detailsLoaded) {
      loadTagDetails()
    }
  }, [showModal])

  const loadTagDetails = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch content to get author_id and posted_as_type
      if (contentType === 'post') {
        const { data: postData } = await supabase
          .from('posts')
          .select('author_id, posted_as_type')
          .eq('id', contentId)
          .single()
        
        if (postData) {
          setAuthorId(postData.author_id)
          setPostedAsType(postData.posted_as_type || 'user')
        }
      } else if (contentType === 'bulletin') {
        const { data: bulletinData } = await supabase
          .from('bulletin_boards')
          .select('author_id, posted_as_type')
          .eq('id', contentId)
          .single()
        
        if (bulletinData) {
          setAuthorId(bulletinData.author_id)
          setPostedAsType(bulletinData.posted_as_type || 'user')
        }
      } else if (contentType === 'announcement') {
        const { data: announcementData } = await supabase
          .from('announcements')
          .select('author_id, posted_as_type')
          .eq('id', contentId)
          .single()
        
        if (announcementData) {
          setAuthorId(announcementData.author_id)
          setPostedAsType(announcementData.posted_as_type || 'user')
        }
      } else if (contentType === 'repost') {
        const { data: repostData } = await supabase
          .from('reposts')
          .select('user_id')
          .eq('id', contentId)
          .single()
        
        if (repostData) {
          setAuthorId(repostData.user_id)
          setPostedAsType('user')
        }
      } else if (contentType === 'free_wall_post') {
        const { data: fwData } = await supabase
          .from('free_wall_posts')
          .select('author_id')
          .eq('id', contentId)
          .single()
        
        if (fwData) {
          setAuthorId(fwData.author_id)
          setPostedAsType('user')
        }
      }

      const { data: tags } = await supabase
        .from('tags')
        .select('tagged_user_id')
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (tags && tags.length > 0) {
        const userIds = tags.map(t => t.tagged_user_id)
        const { data: users } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds)

        if (users) {
          const mappedUsers = users.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
            avatarUrl: u.avatar_url
          }))
          mappedUsers.sort((a, b) => a.name.localeCompare(b.name))
          setTaggedUsers(mappedUsers)
          setSelectedUserIds(userIds)
          setTagCount(mappedUsers.length)
        }
      } else {
        setTaggedUsers([])
        setSelectedUserIds([])
        setTagCount(0)
      }
      
      setDetailsLoaded(true)
    } catch (error) {
      console.error('Error loading tag details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('tagged_user_id', userId)

      if (error) throw error

      await loadTagDetails()
      if (onTagsUpdated) onTagsUpdated()
    } catch (error) {
      console.error('Error removing tag:', error)
      alert('Failed to remove tag')
    }
  }

  const handleSaveTags = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const currentIds = taggedUsers.map(u => u.id)
      const removedIds = currentIds.filter(id => !selectedUserIds.includes(id))
      const newIds = selectedUserIds.filter(id => !currentIds.includes(id))

      if (removedIds.length > 0) {
        await supabase
          .from('tags')
          .delete()
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .in('tagged_user_id', removedIds)
      }

      if (newIds.length > 0) {
        const newTags = newIds.map(userId => ({
          content_type: contentType,
          content_id: contentId,
          tagged_user_id: userId,
          tagged_by_user_id: user.id
        }))

        await supabase
          .from('tags')
          .insert(newTags)
      }

      await loadTagDetails()
      setIsEditMode(false)
      if (onTagsUpdated) onTagsUpdated()
    } catch (error) {
      console.error('Error saving tags:', error)
      alert('Failed to save tags')
    } finally {
      setSaving(false)
    }
  }

  const handleUserClick = (userId: string) => {
    window.location.href = `/user/${userId}`
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const isCurrentUserTagged = currentUserId && taggedUsers.some(u => u.id === currentUserId)
  const topThreeUsers = taggedUsers.slice(0, 3)
  const remainingCount = taggedUsers.length - 3

  // OPTIMIZED: No loading spinner on initial render
  return (
    <>
      {/* Trigger Icon - OPTIMIZED: Shows count immediately */}
      <div className="relative inline-block">
        <div
          ref={iconRef}
          onMouseEnter={() => {
            setShowTooltip(true)
            // OPTIMIZED: Pre-load details on hover for instant modal open
            if (!detailsLoaded) loadTagDetails()
          }}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => {
            if (canEdit || isCurrentUserTagged || tagCount > 0) {
              setShowModal(true)
            }
          }}
          className={`inline-flex items-center gap-1.5 p-1.5 px-2 rounded-full transition-all ${
            canEdit || isCurrentUserTagged || tagCount > 0
              ? 'cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-100' 
              : 'cursor-default'
          }`}
        >
          <UserCheck className={`h-4 w-4 ${
            tagCount > 0 ? 'text-blue-600' : 'text-gray-400'
          }`} />
          {tagCount > 0 && (
            <span className="text-xs font-bold text-blue-600">
              {tagCount}
            </span>
          )}
        </div>

        {/* Hover Tooltip */}
        {showTooltip && (
          <div className="absolute left-0 top-full mt-2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap min-w-[120px]">
            {tagCount === 0 ? (
              <span className="text-gray-300">No users tagged</span>
            ) : detailsLoaded ? (
              <div className="space-y-1.5">
                <div className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-1">Tagged:</div>
                {topThreeUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                     {user.name}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="text-gray-400 pl-3.5 italic">and {remainingCount} more...</div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL - Only renders when open */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6"
          onClick={() => {
            setShowModal(false)
            setIsEditMode(false)
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isEditMode ? 'Manage Tagged People' : 'Tagged People'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isEditMode 
                      ? 'Search to add new people or remove existing tags' 
                      : `${taggedUsers.length} people tagged in this content`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setIsEditMode(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : !isEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {taggedUsers.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
                      <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <UserCheck className="h-10 w-10 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-400">No users tagged yet</p>
                    </div>
                  ) : (
                    taggedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group bg-white shadow-sm"
                      >
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-lg">{getInitials(user.name)}</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleUserClick(user.id)}
                            className="text-left w-full"
                          >
                            <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                              {user.name}
                            </h4>
                          </button>
                          {(isCurrentUserTagged && user.id === currentUserId) && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove your tag?`)) handleRemoveTag(user.id)
                              }}
                              className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline mt-0.5"
                            >
                              Remove me
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto py-2">
                   <TagUserSelector
                    selectedUsers={selectedUserIds}
                    onUsersChange={setSelectedUserIds}
                    authorId={authorId || undefined}
                    postedAsType={postedAsType}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              {!isEditMode ? (
                <div className="flex gap-4">
                  {canEdit && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Tags
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className={`${canEdit ? 'flex-1' : 'w-full'} px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm transform active:scale-[0.98]`}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 max-w-xl mx-auto w-full">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm transform active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTags}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}