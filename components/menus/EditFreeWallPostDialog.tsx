// components/menus/EditFreeWallPostDialog.tsx
"use client"
import { useState } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface EditFreeWallPostDialogProps {
  postId: string
  initialContent: string
  onClose: () => void
  onUpdate: () => void
}

export function EditFreeWallPostDialog({ 
  postId, 
  initialContent, 
  onClose, 
  onUpdate 
}: EditFreeWallPostDialogProps) {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Content cannot be empty")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('free_wall_posts')
        .update({
          content: content.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error: any) {
      console.error('Error updating post:', error)
      alert(`Failed to update: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-black text-gray-900">Edit Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900"
            rows={10}
            maxLength={5000}
          />
          <div className="text-xs text-gray-500 mt-2">
            {content.length} / 5000
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || content === initialContent}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}