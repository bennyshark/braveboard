// components/feed/SingleImageDisplay.tsx
"use client"

import { useState, useEffect, useRef } from "react"

interface SingleImageDisplayProps {
  imageUrl: string
  onImageClick: () => void
  alt?: string
}

export function SingleImageDisplay({ imageUrl, onImageClick, alt = "Post image" }: SingleImageDisplayProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
      setIsLoaded(true)
    }
  }, [imageUrl])

  // Calculate aspect ratio and display strategy based on Facebook's approach
  const getDisplayStrategy = () => {
    if (!isLoaded) return 'loading'

    const aspectRatio = imageDimensions.width / imageDimensions.height
    
    // Facebook-inspired thresholds
    const SQUARE = 1.0
    const PORTRAIT_LIMIT = 0.8      // 4:5 (more portrait than this gets special treatment)
    const LANDSCAPE_LIMIT = 1.91    // 1.91:1 (Facebook's landscape standard)
    const EXTREME_TALL = 0.5625     // 9:16 (vertical video/story ratio)
    const EXTREME_WIDE = 2.5        // Beyond this is panoramic
    const SUPER_EXTREME_TALL = 0.4  // Really extreme portrait
    const SUPER_EXTREME_WIDE = 3.0  // Really extreme landscape

    if (aspectRatio < SUPER_EXTREME_TALL) {
      return 'super-tall' // Extreme portrait with blur background
    } else if (aspectRatio < EXTREME_TALL) {
      return 'very-tall' // Very tall portrait, crop to manageable height
    } else if (aspectRatio < PORTRAIT_LIMIT) {
      return 'tall' // Portrait, constrain height
    } else if (aspectRatio <= LANDSCAPE_LIMIT) {
      return 'normal' // Normal range (4:5 to 1.91:1) - includes square
    } else if (aspectRatio < EXTREME_WIDE) {
      return 'wide' // Wider landscape
    } else if (aspectRatio < SUPER_EXTREME_WIDE) {
      return 'very-wide' // Very wide, crop to manageable
    } else {
      return 'super-wide' // Panoramic with blur background
    }
  }

  const strategy = getDisplayStrategy()

  // Rendering strategies
  const renderImage = () => {
    switch (strategy) {
      case 'super-tall':
        // Super extreme portrait: blur background with contained image
        return (
          <div className="relative w-full bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 rounded-xl overflow-hidden" style={{ height: '600px' }}>
            {/* Blurred background */}
            <div 
              className="absolute inset-0 blur-3xl opacity-40 scale-110"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            {/* Actual image centered */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                ref={imgRef}
                src={imageUrl}
                alt={alt}
                className="max-h-full w-auto object-contain cursor-pointer shadow-2xl rounded-lg"
                onClick={onImageClick}
              />
            </div>
          </div>
        )

      case 'very-tall':
        // Very tall portrait: crop to max height with object-cover
        return (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ maxHeight: '600px' }}>
            <div className="w-full h-full bg-gray-50">
              <img
                ref={imgRef}
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={onImageClick}
                style={{ maxHeight: '600px' }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </div>
        )

      case 'tall':
        // Portrait (4:5 and taller): constrain height, show full image
        return (
          <div className="relative w-full rounded-xl overflow-hidden" style={{ maxHeight: '680px' }}>
            <div className="w-full h-full flex items-center justify-center bg-[#FAF9F5]">
              <img
                ref={imgRef}
                src={imageUrl}
                alt={alt}
                className="w-full h-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                onClick={onImageClick}
                style={{ maxHeight: '680px' }}
              />
            </div>
          </div>
        )

      case 'normal':
        // Normal range (4:5 to 1.91:1): display naturally
        // This is the "sweet spot" - square (1:1), portrait (4:5), landscape (16:9, 1.91:1)
        return (
          <div className="relative w-full rounded-xl overflow-hidden group">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={alt}
              className="w-full h-auto cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
              onClick={onImageClick}
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer rounded-xl" onClick={onImageClick} />
          </div>
        )

      case 'wide':
        // Wide landscape: slight crop if needed
        return (
          <div className="relative w-full rounded-xl overflow-hidden group">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={alt}
              className="w-full h-auto cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
              onClick={onImageClick}
              style={{ 
                maxHeight: '450px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer" onClick={onImageClick} />
          </div>
        )

      case 'very-wide':
        // Very wide: crop to manageable height
        return (
          <div className="relative w-full rounded-xl overflow-hidden">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={alt}
              className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
              onClick={onImageClick}
              style={{ 
                maxHeight: '380px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />
          </div>
        )

      case 'super-wide':
        // Panoramic: blur background with contained image
        return (
          <div className="relative w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-xl overflow-hidden" style={{ height: '360px' }}>
            {/* Blurred background */}
            <div 
              className="absolute inset-0 blur-3xl opacity-40 scale-110"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            {/* Actual image centered */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                ref={imgRef}
                src={imageUrl}
                alt={alt}
                className="w-full h-auto max-h-full object-contain cursor-pointer shadow-2xl rounded-lg"
                onClick={onImageClick}
              />
            </div>
          </div>
        )

      case 'loading':
      default:
        return (
          <div className="w-full bg-gray-100 rounded-xl animate-pulse" style={{ height: '400px' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Loading image...</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="mb-4">
      {renderImage()}
    </div>
  )
}