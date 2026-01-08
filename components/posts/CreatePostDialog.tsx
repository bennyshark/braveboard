// components/posts/CreatePostDialog.tsx
"use client"
import { useState, useRef } from "react"
import { X, Image as ImageIcon, Loader2, Send } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface CreatePostDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onPostCreated?: () => void
}

export function CreatePostDialog({ isOpen, onClose, eventId, onPostCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 4) {
      alert("You can only upload up to 4 images")
      return
    }

    setImages([...images, ...files])
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert("Please add some content or images")
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Upload images to Supabase Storage
      const imageUrls: string[] = []
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `post-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        imageUrls.push(publicUrl)
      }

      // Create post
      const { error } = await supabase.from('posts').insert({
        event_id: eventId,
        author_id: user.id,
        content: content.trim(),
        image_urls: imageUrls
      })

      if (error) throw error

      // Reset form
      setContent("")
      setImages([])
      setImagePreviews([])
      
      // Callback and close
      if (onPostCreated) onPostCreated()
      onClose()
      
    } catch (error: any) {
      console.error("Error creating post:", error)
      alert(`Failed to create post: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-black text-gray-900">Create Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Text Area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none text-gray-900"
            rows={6}
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className={`grid gap-3 ${
              imagePreviews.length === 1 ? 'grid-cols-1' :
              imagePreviews.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {images.length < 4 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              Add Images ({images.length}/4)
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}