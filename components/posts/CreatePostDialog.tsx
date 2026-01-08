// components/posts/CreatePostDialog.tsx
"use client"
import { useState, useRef } from "react"
import { X, Image as ImageIcon, Loader2, Send, Sparkles } from "lucide-react"
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

  const charCount = content.length
  const maxChars = 5000

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header with Gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-10"></div>
          <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Create Post</h3>
                <p className="text-xs text-gray-500 font-medium">Share your thoughts with the community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 duration-300"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Text Area with enhanced styling */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your experience, thoughts, or updates..."
              className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-gray-900 text-lg transition-all placeholder:text-gray-400"
              rows={8}
              maxLength={maxChars}
            />
            
            {/* Character Counter */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                charCount > maxChars * 0.9 
                  ? 'bg-red-100 text-red-700' 
                  : charCount > maxChars * 0.7 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* Image Previews with improved grid */}
          {imagePreviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <ImageIcon className="h-4 w-4" />
                Attached Images ({imagePreviews.length}/4)
              </div>
              <div className={`grid gap-4 ${
                imagePreviews.length === 1 ? 'grid-cols-1' :
                imagePreviews.length === 2 ? 'grid-cols-2' :
                imagePreviews.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {imagePreviews.map((preview, idx) => (
                  <div 
                    key={idx} 
                    className="relative group aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <img 
                      src={preview} 
                      alt={`Preview ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300"></div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Button - Enhanced */}
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
              className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl text-gray-700 hover:text-blue-700 font-bold transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-all">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span>Add Images ({images.length}/4)</span>
            </button>
          )}
        </div>

        {/* Footer - Enhanced */}
        <div className="relative overflow-hidden border-t border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
          <div className="relative flex gap-4 p-6">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <span>Post Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}