// components/feed/ImagePreviewModal.tsx
"use client"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface ImagePreviewModalProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function ImagePreviewModal({ images, initialIndex, isOpen, onClose }: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)

  // Reset index when modal opens with a new initialIndex
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Reset loading state whenever the index changes
  useEffect(() => {
    setIsLoading(true)
  }, [currentIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        // Use functional state to avoid dependency issues
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : prev))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose]) // Removed currentIndex from deps to prevent listener thrashing

  if (!isOpen) return null

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm font-medium z-20 border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous Button */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20 backdrop-blur-md"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next Button */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20 backdrop-blur-md"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Main Image Container */}
      <div 
        className="relative max-w-7xl max-h-[85vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
        )}

        <img
          key={images[currentIndex]} // <--- CRITICAL FIX: Forces React to replace the node
          src={images[currentIndex]}
          alt={`Preview ${currentIndex + 1}`}
          onLoad={() => setIsLoading(false)} // Turn off loader when image is ready
          className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-3 rounded-full max-w-[90vw] overflow-x-auto z-20 border border-white/10">
          {images.map((img, idx) => (
            <button
              key={img + idx} // Use combination of URL and index for unique key
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all relative ${
                idx === currentIndex 
                  ? 'ring-2 ring-white scale-110 z-10' 
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}