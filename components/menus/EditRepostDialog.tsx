// components/menus/EditRepostDialog.tsx
"use client"

import { useState } from "react"
import { X, Loader2, Repeat2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface EditRepostDialogProps {
  repostId: string
  initialComment: string
  onClose: () => void
  onUpdate: () => void
}

export function EditRepostDialog({ 
  repostId, 
  initialComment, 
  onClose, 
  onUpdate 
}: EditRepostDialogProps) {
  const [comment, setComment] = useState(initialComment)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('reposts')
        .update({
          repost_comment: comment.trim() || null,
          edited_at: new Date().toISOString()
        })
        .eq('id', repostId)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error: any) {
      console.error('Error updating repost:', error)
      alert(`Failed to update: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-black text-gray-900">Edit Repost</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What do you think?"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            rows={4}
            maxLength={500}
            autoFocus
          />
          <div className="text-xs text-gray-500 mt-1">
            {comment.length} / 500
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Repeat2 className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}