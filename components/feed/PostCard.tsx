// components/feed/PostCard.tsx
"use client"
import { useState, useEffect } from "react"
import { MessageCircle, Share2, Clock, Image, MoreVertical, Shield, Users } from "lucide-react"
import { Post } from "@/app/(site)/home/types"
import { ImagePreviewModal } from "./ImagePreviewModal"
import { createBrowserClient } from "@supabase/ssr"

interface PostCardProps {
  post: Post
}

type PostIdentity = {
  type: 'user' | 'organization' | 'faith_admin'
  name: string
  avatarUrl: string | null
}

export function PostCard({ post }: PostCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [displayIdentity, setDisplayIdentity] = useState<PostIdentity>({
    type: 'user',
    name: post.author,
    avatarUrl: post.avatarUrl
  })
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  // Fetch posting identity
  useEffect(() => {
    async function fetchIdentity() {
      try {
        const { data: postData } = await supabase
          .from('posts')
          .select('posted_as_type, posted_as_org_id')
          .eq('id', post.id)
          .single()

        if (!postData) {
          setLoading(false)
          return
        }

        // If posted as user, use existing data
        if (postData.posted_as_type === 'user') {
          setDisplayIdentity({
            type: 'user',
            name: post.author,
            avatarUrl: post.avatarUrl
          })
        }
        // If posted as FAITH admin
        else if (postData.posted_as_type === 'faith_admin') {
          setDisplayIdentity({
            type: 'faith_admin',
            name: 'FAITH Administration',
            avatarUrl: null
          })
        }
        // If posted as organization
        else if (postData.posted_as_type === 'organization' && postData.posted_as_org_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, avatar_url')
            .eq('id', postData.posted_as_org_id)
            .single()

          if (orgData) {
            setDisplayIdentity({
              type: 'organization',
              name: orgData.name,
              avatarUrl: orgData.avatar_url || null
            })
          }
        }
      } catch (error) {
        console.error('Error fetching post identity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIdentity()
  }, [post.id, supabase])

  const getAuthorColor = (type: string) => {
    switch(type) {
      case "faith_admin": return "from-purple-400 to-purple-600"
      case "organization": return "from-orange-400 to-orange-600"
      default: return "from-blue-400 to-blue-600"
    }
  }

  const getIdentityIcon = (type: string) => {
    switch(type) {
      case "faith_admin": return <Shield className="h-4 w-4 text-white" />
      case "organization": return <Users className="h-4 w-4 text-white" />
      default: return null
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleImageClick = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-300 p-4 animate-pulse">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-300 p-4 hover:border-gray-400 transition-all">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {displayIdentity.avatarUrl ? (
            <img 
              src={displayIdentity.avatarUrl} 
              alt={displayIdentity.name}
              className="h-10 w-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getAuthorColor(displayIdentity.type)} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
              {displayIdentity.type !== 'user' ? (
                getIdentityIcon(displayIdentity.type)
              ) : (
                <span className="text-white font-bold text-xs">{getInitials(displayIdentity.name)}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-gray-900">{displayIdentity.name}</h5>
                  {displayIdentity.type === 'faith_admin' && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  {displayIdentity.type === 'organization' && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                      <Users className="h-3 w-3" />
                      Org
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{post.time}</span>
                  {post.imageUrls.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        {post.imageUrls.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-800 text-sm leading-relaxed mb-3">{post.content}</p>

        {/* Images Grid */}
        {post.imageUrls.length > 0 && (
          <div className={`mb-3 ${
            post.imageUrls.length === 1 ? 'grid grid-cols-1' :
            post.imageUrls.length === 2 ? 'grid grid-cols-2 gap-2' :
            'grid grid-cols-2 gap-2'
          }`}>
            {post.imageUrls.slice(0, 4).map((url, idx) => (
              <div 
                key={idx} 
                className={`relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer group ${
                  post.imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                }`}
                onClick={() => handleImageClick(idx)}
              >
                <img 
                  src={url} 
                  alt="Post" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {idx === 3 && post.imageUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{post.imageUrls.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
            <span className="text-base">👍</span>
            <span className="text-xs font-bold">{post.likes}</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{post.comments}</span>
          </button>
          <button className="p-1.5 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        images={post.imageUrls}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}