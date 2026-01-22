// components/comments/InlineCommentBox.tsx
"use client"
import { useState, useRef } from "react"
import { Send, X, Image, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface InlineCommentBoxProps {
  contentType: 'post' | 'announcement' | 'bulletin' | 'free_wall_post' | 'repost'
  contentId: string
  eventId?: string
  parentCommentId?: string
  replyingTo?: string
  onCancel: () => void
  onCommentCreated: () => void
}

export function InlineCommentBox({
  contentType,
  contentId,
  eventId,
  parentCommentId,
  replyingTo,
  onCancel,
  onCommentCreated
}: InlineCommentBoxProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !image) {
      alert("Please add some content or an image")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let imageUrl: string | null = null

      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('comments')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('comments')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      const { error } = await supabase.from('comments').insert({
        author_id: user.id,
        content_type: contentType,
        content_id: contentId,
        content: content.trim(),
        image_url: imageUrl,
        parent_comment_id: parentCommentId || null,
        posted_as_type: 'user'
      })

      if (error) throw error

      setContent("")
      removeImage()
      onCommentCreated()
    } catch (error: any) {
      console.error("Error creating comment:", error)
      alert(`Failed to create comment: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
      {replyingTo && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <span className="font-medium">Replying to</span>
          <span className="font-bold text-blue-600">{replyingTo}</span>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm"
        rows={3}
        disabled={isSubmitting}
      />

      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-[200px] rounded-lg border border-gray-200"
          />
          <button
            onClick={removeImage}
            disabled={isSubmitting}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Add image"
          >
            <Image className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !image)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}