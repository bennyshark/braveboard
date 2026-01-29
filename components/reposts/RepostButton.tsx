// components/reposts/RepostButton.tsx
"use client"

import { useState } from "react"
import { Repeat2, Loader2, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface RepostButtonProps {
  contentType: 'post' | 'bulletin' | 'announcement' | 'free_wall_post' | 'repost'
  contentId: string
  onRepostChange?: () => void
  onRepostCreated?: (repost: any) => void
}

export function RepostButton({ contentType, contentId, onRepostChange, onRepostCreated }: RepostButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleRepost = () => {
    setShowDialog(true)
  }

  const fetchOriginalContent = async (repost: any): Promise<any | null> => {
    try {
      // FREE WALL POST
      if (repost.content_type === 'free_wall_post') {
        const { data } = await supabase
          .from('free_wall_posts')
          .select('*')
          .eq('id', repost.content_id)
          .maybeSingle()

        if (!data) return null

        const { data: authorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', data.author_id)
          .maybeSingle()

        return {
          type: 'free_wall_post',
          id: data.id,
          content: data.content,
          authorId: authorData?.id,
          authorName: authorData ? `${authorData.first_name} ${authorData.last_name}` : 'Unknown User',
          authorAvatar: authorData?.avatar_url || null,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      }
      
      // BULLETIN
      else if (repost.content_type === 'bulletin') {
        const { data } = await supabase
          .from('bulletins')
          .select('*, creator_org:organizations(name, avatar_url)')
          .eq('id', repost.content_id)
          .maybeSingle()

        if (!data) return null

        let creatorName = "Unknown"
        let creatorType = "user"
        let creatorAvatar = null

        if (data.creator_type === 'faith_admin') {
          creatorName = "FAITH Administration"
          creatorType = "faith"
        } else if (data.creator_type === 'organization' && data.creator_org) {
          creatorName = data.creator_org.name
          creatorAvatar = data.creator_org.avatar_url
          creatorType = "organization"
        }

        return {
          type: 'bulletin',
          id: data.id,
          header: data.header,
          body: data.body,
          creatorName,
          creatorType,
          creatorAvatar,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      }
      
      // ANNOUNCEMENT
      else if (repost.content_type === 'announcement') {
        const { data } = await supabase
          .from('announcements')
          .select('*, creator_org:organizations(name, avatar_url)')
          .eq('id', repost.content_id)
          .maybeSingle()

        if (!data) return null

        let creatorName = "Unknown"
        let creatorType = "user"
        let creatorAvatar = null

        if (data.creator_type === 'faith_admin') {
          creatorName = "FAITH Administration"
          creatorType = "faith"
        } else if (data.creator_type === 'organization' && data.creator_org) {
          creatorName = data.creator_org.name
          creatorAvatar = data.creator_org.avatar_url
          creatorType = "organization"
        }

        return {
          type: 'announcement',
          id: data.id,
          header: data.header,
          body: data.body,
          creatorName,
          creatorType,
          creatorAvatar,
          imageUrl: data.image_url,
          createdAt: new Date(data.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      }
      
      // POST (Event posts)
      else if (repost.content_type === 'post') {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .eq('id', repost.content_id)
          .maybeSingle()

        if (!data) return null

        let displayName = 'Unknown User'
        let displayAvatar = null
        let displayType = 'user'

        if (data.posted_as_type === 'faith_admin') {
          displayName = 'FAITH Administration'
          displayType = 'faith_admin'
        } else if (data.posted_as_type === 'organization' && data.posted_as_org_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, avatar_url')
            .eq('id', data.posted_as_org_id)
            .single()
          
          if (orgData) {
            displayName = orgData.name
            displayAvatar = orgData.avatar_url
            displayType = 'organization'
          }
        } else {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', data.author_id)
            .maybeSingle()

          if (authorData) {
            displayName = `${authorData.first_name} ${authorData.last_name}`
            displayAvatar = authorData.avatar_url
          }
        }

        return {
          type: 'post',
          id: data.id,
          content: data.content,
          authorId: data.author_id,
          authorName: displayName,
          authorAvatar: displayAvatar,
          authorType: displayType,
          imageUrls: data.image_urls || [],
          createdAt: new Date(data.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      }
      
      // REPOST (nested repost) - FIXED: Field order matches OriginalContent type
      else if (repost.content_type === 'repost') {
        const { data: nestedRepost } = await supabase
          .from('reposts')
          .select('*')
          .eq('id', repost.content_id)
          .maybeSingle()

        if (!nestedRepost) return null

        const { data: reposterData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', nestedRepost.user_id)
          .maybeSingle()

        // Recursively fetch the original content of the nested repost
        const nestedOriginalContent = await fetchOriginalContent(nestedRepost)

        return {
          type: 'repost',
          id: nestedRepost.id,
          comment: nestedRepost.repost_comment,
          reposterId: reposterData?.id,
          reposterName: reposterData ? `${reposterData.first_name} ${reposterData.last_name}` : 'Unknown User',
          reposterAvatar: reposterData?.avatar_url || null,
          contentType: nestedRepost.content_type,
          contentId: nestedRepost.content_id,
          originalContent: nestedOriginalContent,
          createdAt: new Date(nestedRepost.created_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching original content:', error)
      return null
    }
  }

  const confirmRepost = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: newRepost, error } = await supabase
        .from('reposts')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          repost_comment: comment.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single()

      // Fetch tag count
      const { data: tagCounts } = await supabase
        .from('tags')
        .select('content_id')
        .eq('content_type', 'repost')
        .eq('content_id', newRepost.id)

      const tagCount = tagCounts?.length || 0

      // Fetch original content
      const originalContent = await fetchOriginalContent(newRepost)

      // Build complete repost object
      const completeRepost = {
        id: newRepost.id,
        userId: user.id,
        userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
        userAvatar: profile?.avatar_url || null,
        contentType: newRepost.content_type,
        contentId: newRepost.content_id,
        repostComment: newRepost.repost_comment,
        createdAt: new Date(newRepost.created_at).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        createdAtRaw: newRepost.created_at,
        originalContent,
        taggedUsersCount: tagCount,
        reactionCount: 0,
        comments: 0,
        repostCount: 0
      }

      setShowDialog(false)
      setComment("")
      
      // Call the new callback with complete data
      if (onRepostCreated) {
        onRepostCreated(completeRepost)
      }

      if (onRepostChange) {
        setTimeout(() => onRepostChange(), 100)
      }
    } catch (error: any) {
      console.error('Error creating repost:', error)
      alert(`Failed to repost: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleRepost}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-green-600 ${
          isLoading ? 'opacity-50 cursor-wait' : ''
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Repeat2 className="h-3.5 w-3.5" />
        )}
        Repost
      </button>

      {/* Repost Dialog */}
      {showDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDialog(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-black text-gray-900">Repost</h3>
              <button
                onClick={() => setShowDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Add a comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What do you think?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {comment.length} / 500
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRepost}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reposting...
                  </>
                ) : (
                  <>
                    <Repeat2 className="h-4 w-4" />
                    Repost
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}