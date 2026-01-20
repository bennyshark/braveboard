// components/reposts/RepostButton.tsx
"use client"

import { useState, useEffect } from "react"
import { Repeat2, Loader2, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface RepostButtonProps {
  contentType: 'post' | 'bulletin' | 'announcement'
  contentId: string
  onRepostChange?: () => void
}

export function RepostButton({ contentType, contentId, onRepostChange }: RepostButtonProps) {
  const [hasReposted, setHasReposted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    checkRepostStatus()
  }, [contentType, contentId])

  const checkRepostStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      setHasReposted(!!data)
    } catch (error) {
      console.error('Error checking repost status:', error)
    }
  }

  const handleRepost = async () => {
    if (hasReposted) {
      await handleUndoRepost()
      return
    }

    setShowDialog(true)
  }

  const confirmRepost = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('reposts')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          repost_comment: comment.trim() || null
        })

      if (error) throw error

      setHasReposted(true)
      setShowDialog(false)
      setComment("")
      
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

  const handleUndoRepost = async () => {
    if (!confirm('Remove this repost from your profile?')) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('reposts')
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (error) throw error

      setHasReposted(false)
      
      if (onRepostChange) {
        setTimeout(() => onRepostChange(), 100)
      }
    } catch (error: any) {
      console.error('Error deleting repost:', error)
      alert(`Failed to remove repost: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleRepost}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold ${
          hasReposted
            ? 'bg-green-100 text-green-700'
            : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Repeat2 className="h-3.5 w-3.5" />
        )}
        {hasReposted ? 'Reposted' : 'Repost'}
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