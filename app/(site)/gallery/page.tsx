"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Image, 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  X,
  Loader2,
  ImageOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

type EventAlbum = {
  id: string
  title: string
  startDate: string
  endDate: string
  location: string | null
  imageCount: number
  thumbnailUrl: string | null
}

type EventImage = {
  url: string
  postId: string
  createdAt: string
}

export default function GalleryPage() {
  const [albums, setAlbums] = useState<EventAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState<EventAlbum | null>(null)
  const [albumImages, setAlbumImages] = useState<EventImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [previewImage, setPreviewImage] = useState<number | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      setLoading(true)

      // Get all events with their posts that have images
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_date,
          end_date,
          location,
          posts!inner(id, image_urls, created_at)
        `)
        .order('start_date', { ascending: false })

      if (error) throw error

      // Process events to create albums
      const albumsData: EventAlbum[] = []
      
      events?.forEach((event: any) => {
        // Collect all images from all posts
        const allImages: string[] = []

        event.posts.forEach((post: any) => {
          if (post.image_urls && post.image_urls.length > 0) {
            allImages.push(...post.image_urls)
          }
        })

        // Only include events with images
        if (allImages.length > 0) {
          // Pick a random image as thumbnail
          const randomIndex = Math.floor(Math.random() * allImages.length)
          const thumbnailUrl = allImages[randomIndex]

          albumsData.push({
            id: event.id,
            title: event.title,
            startDate: new Date(event.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            endDate: new Date(event.end_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            location: event.location,
            imageCount: allImages.length,
            thumbnailUrl
          })
        }
      })

      setAlbums(albumsData)
    } catch (error) {
      console.error('Error fetching albums:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAlbum = async (album: EventAlbum) => {
    setSelectedAlbum(album)
    setLoadingImages(true)

    try {
      // Fetch all posts from this event with images
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, image_urls, created_at')
        .eq('event_id', album.id)
        .not('image_urls', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten all images with metadata
      const images: EventImage[] = []
      posts?.forEach(post => {
        if (post.image_urls && Array.isArray(post.image_urls)) {
          post.image_urls.forEach((url: string) => {
            images.push({
              url,
              postId: post.id,
              createdAt: new Date(post.created_at).toLocaleString()
            })
          })
        }
      })

      setAlbumImages(images)
    } catch (error) {
      console.error('Error fetching album images:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  const closeAlbum = () => {
    setSelectedAlbum(null)
    setAlbumImages([])
    setPreviewImage(null)
  }

  // Image Preview Modal Component
  const ImagePreviewModal = () => {
    if (previewImage === null) return null

    const goToPrevious = () => {
      if (previewImage > 0) {
        setPreviewImage(previewImage - 1)
      }
    }

    const goToNext = () => {
      if (previewImage < albumImages.length - 1) {
        setPreviewImage(previewImage + 1)
      }
    }

    return (
      <div 
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={() => setPreviewImage(null)}
      >
        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
        >
          <X className="h-6 w-6" />
        </button>

        {albumImages.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm font-medium z-20 border border-white/10">
            {previewImage + 1} / {albumImages.length}
          </div>
        )}

        {previewImage > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious() }}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20 backdrop-blur-md"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {previewImage < albumImages.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToNext() }}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20 backdrop-blur-md"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        <div 
          className="relative max-w-7xl max-h-[85vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={albumImages[previewImage].url}
            alt={`Preview ${previewImage + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {albumImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-3 rounded-full max-w-[90vw] overflow-x-auto z-20 border border-white/10">
            {albumImages.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setPreviewImage(idx) }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                  idx === previewImage 
                    ? 'ring-2 ring-white scale-110' 
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Album View
  if (selectedAlbum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
        <ImagePreviewModal />
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={closeAlbum}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Albums
            </button>
            
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">{selectedAlbum.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {selectedAlbum.startDate} - {selectedAlbum.endDate}
                </div>
                {selectedAlbum.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedAlbum.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  {selectedAlbum.imageCount} {selectedAlbum.imageCount === 1 ? 'photo' : 'photos'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loadingImages ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : albumImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ImageOff className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-semibold">No images found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {albumImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewImage(idx)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <img
                    src={image.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{image.createdAt}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Albums Grid View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Image className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Event Gallery</h1>
              <p className="text-gray-600 font-medium">Browse photos from all events</p>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-white rounded-full shadow-lg mb-6">
              <ImageOff className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Photos Yet</h2>
            <p className="text-gray-600">Event photos will appear here once posted</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => openAlbum(album)}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                  {album.thumbnailUrl ? (
                    <img
                      src={album.thumbnailUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Image Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Image className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-bold">{album.imageCount}</span>
                  </div>
                </div>

                {/* Album Info */}
                <div className="p-5">
                  <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {album.title}
                  </h3>
                  
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{album.startDate}</span>
                    </div>
                    
                    {album.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{album.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-2xl transition-all pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}