"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { 
  User, 
  Mail, 
  BookOpen, 
  Building2, 
  Shield, 
  Users,
  Loader2,
  Edit,
  Calendar,
  MessageSquare,
  Heart,
  Image as ImageIcon,
  Clock,
  X,
  Upload,
  Camera,
  Check,
  Repeat2,
  AtSign,
  LayoutGrid,
  Pin,
  PinOff
} from "lucide-react"
import { ImagePreviewModal } from "@/components/feed/ImagePreviewModal"

type UserProfile = {
  id: string
  email: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  department_code: string | null
  course_code: string | null
  bio_content: string | null
  avatar_url: string | null
  cover_url: string | null
  role: string
  created_at: string
}

type Department = {
  code: string
  name: string
}

type Course = {
  code: string
  name: string
}

type UserOrganization = {
  organization: {
    id: string
    name: string
    code: string
  }
  role: string
  joined_at: string
}

type FeedPost = {
  id: string
  type: 'post' | 'free_wall_post' | 'repost' | 'tagged'
  event_id?: string | null
  content: string
  image_urls: string[]
  likes: number
  comments: number
  reaction_count: number
  created_at: string
  pinned_to_profile: boolean
  pinned_at: string | null
  event?: {
    id: string
    title: string
  } | null
  repost_comment?: string
  reposted_by?: string
  tagged_by?: string
  repost_id?: string
  tag_id?: string
  content_type?: string
}

type DragType = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

const ITEMS_PER_PAGE = 10

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [stats, setStats] = useState({
    eventsCreated: 0,
    postsCreated: 0,
    interactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editBio, setEditBio] = useState("")
  const [uploading, setUploading] = useState(false)
  
  const [activeFilter, setActiveFilter] = useState<'feed' | 'posts' | 'reposts' | 'tagged'>('feed')
  const [feedItems, setFeedItems] = useState<FeedPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [imageSrc, setImageSrc] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [dragType, setDragType] = useState<DragType>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadProfileData()
  }, [])

  useEffect(() => {
    if (profile) {
      loadFeedItems(true)
    }
  }, [activeFilter, profile])

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      drawCanvas()
    }
  }, [imageSrc, crop])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadFeedItems(false)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, feedItems])

  async function loadProfileData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      setEditBio(profileData.bio_content || "")

      if (profileData.department_code) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('code, name')
          .eq('code', profileData.department_code)
          .single()
        
        setDepartment(deptData)
      }

      if (profileData.course_code) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('code, name')
          .eq('code', profileData.course_code)
          .single()
        
        setCourse(courseData)
      }

      const { data: orgsData } = await supabase
        .from('user_organizations')
        .select(`
          role,
          joined_at,
          organization:organizations (
            id,
            name,
            code
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (orgsData) {
        setOrganizations(orgsData as any)
      }

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .not('posted_as_type', 'in', '(organization,faith_admin)')

      const { count: freeWallCount } = await supabase
        .from('free_wall_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)

      setStats({
        eventsCreated: eventsCount || 0,
        postsCreated: (postsCount || 0) + (freeWallCount || 0),
        interactions: commentsCount || 0
      })

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFeedItems(reset: boolean = false) {
    if (!profile) return
    
    if (reset) {
      setFeedItems([])
      setHasMore(true)
    }
    
    setLoadingMore(true)

    try {
      let items: FeedPost[] = []

      // Load posts (event posts and free wall posts)
      if (activeFilter === 'posts' || activeFilter === 'feed') {
        // Load event posts (exclude organization/faith_admin posts)
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            event_id,
            content,
            image_urls,
            likes,
            comments,
            reaction_count,
            created_at,
            pinned_to_profile,
            pinned_at,
            event:events (
              id,
              title
            )
          `)
          .eq('author_id', profile.id)
          .not('posted_as_type', 'in', '(organization,faith_admin)')
          .order('pinned_to_profile', { ascending: false })
          .order('created_at', { ascending: false })

        if (postsError) {
          console.error('Error loading posts:', postsError)
        }

        if (postsData && postsData.length > 0) {
          const mappedPosts = postsData.map((p: any) => ({
            id: p.id,
            type: 'post' as const,
            event_id: p.event_id,
            content: p.content,
            image_urls: p.image_urls || [],
            likes: p.likes || 0,
            comments: p.comments || 0,
            reaction_count: p.reaction_count || 0,
            created_at: p.created_at,
            pinned_to_profile: p.pinned_to_profile || false,
            pinned_at: p.pinned_at || null,
            event: Array.isArray(p.event) ? p.event[0] : p.event
          }))
          items = [...items, ...mappedPosts]
        }

        // Load free wall posts
        const { data: freeWallData, error: freeWallError } = await supabase
          .from('free_wall_posts')
          .select(`
            id,
            content,
            image_urls,
            comments,
            reaction_count,
            repost_count,
            created_at,
            pinned_to_profile,
            pinned_at
          `)
          .eq('author_id', profile.id)
          .order('pinned_to_profile', { ascending: false })
          .order('created_at', { ascending: false })

        if (freeWallError) {
          console.error('Error loading free wall posts:', freeWallError)
        }

        if (freeWallData && freeWallData.length > 0) {
          const mappedFreeWall = freeWallData.map((p: any) => ({
            id: p.id,
            type: 'free_wall_post' as const,
            event_id: null,
            content: p.content,
            image_urls: p.image_urls || [],
            likes: 0,
            comments: parseInt(p.comments) || 0,
            reaction_count: parseInt(p.reaction_count) || 0,
            created_at: p.created_at,
            pinned_to_profile: p.pinned_to_profile === true || p.pinned_to_profile === 'true',
            pinned_at: p.pinned_at || null,
            event: null
          }))
          items = [...items, ...mappedFreeWall]
        }
      }

      // Load reposts
      if (activeFilter === 'reposts' || activeFilter === 'feed') {
        const { data: repostsData } = await supabase
          .from('reposts')
          .select(`
            id,
            content_id,
            content_type,
            repost_comment,
            created_at,
            pinned_to_profile,
            pinned_at
          `)
          .eq('user_id', profile.id)
          .order('pinned_to_profile', { ascending: false })
          .order('created_at', { ascending: false })

        if (repostsData && repostsData.length > 0) {
          for (const repost of repostsData) {
            let contentData = null
            
            // Fetch content based on type
            if (repost.content_type === 'post') {
              const { data } = await supabase
                .from('posts')
                .select(`
                  id,
                  event_id,
                  content,
                  image_urls,
                  likes,
                  comments,
                  reaction_count,
                  created_at,
                  event:events (
                    id,
                    title
                  )
                `)
                .eq('id', repost.content_id)
                .single()
              contentData = data
            } else if (repost.content_type === 'free_wall_post') {
              const { data } = await supabase
                .from('free_wall_posts')
                .select('*')
                .eq('id', repost.content_id)
                .single()
              contentData = data
            } else if (repost.content_type === 'bulletin') {
              const { data } = await supabase
                .from('bulletins')
                .select('*')
                .eq('id', repost.content_id)
                .single()
              contentData = data
            } else if (repost.content_type === 'announcement') {
              const { data } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', repost.content_id)
                .single()
              contentData = data
            }

            if (contentData) {
              const eventData = contentData.event ? (Array.isArray(contentData.event) ? contentData.event[0] : contentData.event) : null
              
              items.push({
                id: contentData.id,
                repost_id: repost.id,
                type: 'repost' as const,
                event_id: contentData.event_id || null,
                content: contentData.content || contentData.body || '',
                image_urls: contentData.image_urls || [],
                likes: contentData.likes || 0,
                comments: contentData.comments || 0,
                reaction_count: contentData.reaction_count || 0,
                created_at: repost.created_at,
                pinned_to_profile: repost.pinned_to_profile || false,
                pinned_at: repost.pinned_at || null,
                event: eventData,
                repost_comment: repost.repost_comment,
                content_type: repost.content_type
              })
            }
          }
        }
      }

      // Load tagged items
      if (activeFilter === 'tagged' || activeFilter === 'feed') {
        const { data: tagsData } = await supabase
          .from('tags')
          .select(`
            id,
            content_id,
            content_type,
            tagged_by_user_id,
            created_at,
            pinned_to_profile,
            pinned_at
          `)
          .eq('tagged_user_id', profile.id)
          .order('pinned_to_profile', { ascending: false })
          .order('created_at', { ascending: false })

        if (tagsData && tagsData.length > 0) {
          for (const tag of tagsData) {
            let contentData = null
            
            // Fetch content based on type
            if (tag.content_type === 'post') {
              const { data } = await supabase
                .from('posts')
                .select(`
                  id,
                  event_id,
                  content,
                  image_urls,
                  likes,
                  comments,
                  reaction_count,
                  created_at,
                  event:events (
                    id,
                    title
                  )
                `)
                .eq('id', tag.content_id)
                .single()
              contentData = data
            } else if (tag.content_type === 'free_wall_post') {
              const { data } = await supabase
                .from('free_wall_posts')
                .select('*')
                .eq('id', tag.content_id)
                .single()
              contentData = data
            } else if (tag.content_type === 'bulletin') {
              const { data } = await supabase
                .from('bulletins')
                .select('*')
                .eq('id', tag.content_id)
                .single()
              contentData = data
            } else if (tag.content_type === 'announcement') {
              const { data } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', tag.content_id)
                .single()
              contentData = data
            } else if (tag.content_type === 'repost') {
              const { data } = await supabase
                .from('reposts')
                .select('*')
                .eq('id', tag.content_id)
                .single()
              contentData = data
            }

            if (contentData) {
              const eventData = contentData.event ? (Array.isArray(contentData.event) ? contentData.event[0] : contentData.event) : null
              
              items.push({
                id: contentData.id,
                tag_id: tag.id,
                type: 'tagged' as const,
                event_id: contentData.event_id || null,
                content: contentData.content || contentData.body || '',
                image_urls: contentData.image_urls || [],
                likes: contentData.likes || 0,
                comments: contentData.comments || 0,
                reaction_count: contentData.reaction_count || 0,
                created_at: tag.created_at,
                pinned_to_profile: tag.pinned_to_profile || false,
                pinned_at: tag.pinned_at || null,
                event: eventData,
                content_type: tag.content_type
              })
            }
          }
        }
      }

      // Sort all items (for all filters)
      items.sort((a, b) => {
        // Pinned items first
        if (a.pinned_to_profile && b.pinned_to_profile) {
          const aPinnedAt = a.pinned_at ? new Date(a.pinned_at).getTime() : 0
          const bPinnedAt = b.pinned_at ? new Date(b.pinned_at).getTime() : 0
          return bPinnedAt - aPinnedAt
        }
        
        if (a.pinned_to_profile && !b.pinned_to_profile) return -1
        if (!a.pinned_to_profile && b.pinned_to_profile) return 1
        
        // Then by created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      // Apply pagination
      const currentLength = reset ? 0 : feedItems.length
      const startIndex = currentLength
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedItems = items.slice(startIndex, endIndex)

      // Remove duplicates
      const uniqueItems = paginatedItems.filter((item, index, self) => 
        index === self.findIndex(t => 
          t.id === item.id && 
          t.type === item.type &&
          (t.repost_id === item.repost_id || (!t.repost_id && !item.repost_id)) &&
          (t.tag_id === item.tag_id || (!t.tag_id && !item.tag_id))
        )
      )

      const newItems = reset ? uniqueItems : [...feedItems, ...uniqueItems]
      setFeedItems(newItems)
      setHasMore(endIndex < items.length)

    } catch (error) {
      console.error('Error loading feed items:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  async function togglePinPost(item: FeedPost, currentlyPinned: boolean) {
    if (!profile) return

    try {
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .eq('pinned_to_profile', true)

      const { count: freeWallCount } = await supabase
        .from('free_wall_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .eq('pinned_to_profile', true)

      const { count: repostsCount } = await supabase
        .from('reposts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('pinned_to_profile', true)

      const { count: tagsCount } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .eq('tagged_user_id', profile.id)
        .eq('pinned_to_profile', true)

      const totalPinned = (postsCount || 0) + (freeWallCount || 0) + (repostsCount || 0) + (tagsCount || 0)

      if (!currentlyPinned && totalPinned >= 3) {
        alert('You can only pin up to 3 items to your profile')
        return
      }

      const now = new Date().toISOString()

      // Update the appropriate table based on item type
      if (item.type === 'post') {
        const { error } = await supabase
          .from('posts')
          .update({ 
            pinned_to_profile: !currentlyPinned,
            pinned_at: !currentlyPinned ? now : null
          })
          .eq('id', item.id)

        if (error) throw error
      } else if (item.type === 'free_wall_post') {
        const { error } = await supabase
          .from('free_wall_posts')
          .update({ 
            pinned_to_profile: !currentlyPinned,
            pinned_at: !currentlyPinned ? now : null
          })
          .eq('id', item.id)

        if (error) throw error
      } else if (item.type === 'repost' && item.repost_id) {
        const { error } = await supabase
          .from('reposts')
          .update({ 
            pinned_to_profile: !currentlyPinned,
            pinned_at: !currentlyPinned ? now : null
          })
          .eq('id', item.repost_id)

        if (error) throw error
      } else if (item.type === 'tagged' && item.tag_id) {
        const { error } = await supabase
          .from('tags')
          .update({ 
            pinned_to_profile: !currentlyPinned,
            pinned_at: !currentlyPinned ? now : null
          })
          .eq('id', item.tag_id)

        if (error) throw error
      }

      loadFeedItems(true)
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  function openImagePreview(images: string[], index: number) {
    setPreviewImages(images)
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  // Navigation handler for items
  function handleItemClick(item: FeedPost, e: React.MouseEvent) {
    // Don't navigate if clicking on pin button or images
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.image-preview')) {
      return
    }

    // Navigate based on item type
    if (item.type === 'post' && item.event_id) {
      // Navigate to event page with scroll to post
      router.push(`/event/${item.event_id}?scrollTo=${item.id}`)
    } else if (item.type === 'free_wall_post') {
      // Navigate to home page free wall tab with scroll to post
      router.push(`/home?tab=free_wall&scrollTo=${item.id}`)
    } else if (item.type === 'repost' && item.content_type) {
      // Navigate based on reposted content type
      if (item.content_type === 'post' && item.event_id) {
        // For reposted event posts, go to event page
        router.push(`/event/${item.event_id}?scrollTo=${item.id}`)
      } else {
        // For other content types, go to home with appropriate tab
        const tabMap: Record<string, string> = {
          'post': 'events',
          'free_wall_post': 'free_wall',
          'bulletin': 'bulletin',
          'announcement': 'announcements'
        }
        const tab = tabMap[item.content_type] || 'free_wall'
        router.push(`/home?tab=${tab}&scrollTo=${item.id}`)
      }
    } else if (item.type === 'tagged' && item.content_type) {
      // Navigate based on tagged content type
      if (item.content_type === 'post' && item.event_id) {
        // For tagged event posts, go to event page
        router.push(`/event/${item.event_id}?scrollTo=${item.id}`)
      } else {
        // For other content types, go to home with appropriate tab
        const tabMap: Record<string, string> = {
          'post': 'events',
          'free_wall_post': 'free_wall',
          'bulletin': 'bulletin',
          'announcement': 'announcements'
        }
        const tab = tabMap[item.content_type] || 'free_wall'
        router.push(`/home?tab=${tab}&scrollTo=${item.id}`)
      }
    }
  }

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      setImageSize({ width: img.width, height: img.height })

      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.clearRect(crop.x, crop.y, crop.width, crop.height)
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, crop.x, crop.y, crop.width, crop.height)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)

      const handleSize = 20
      const handles = [
        { x: crop.x, y: crop.y },
        { x: crop.x + crop.width, y: crop.y },
        { x: crop.x, y: crop.y + crop.height },
        { x: crop.x + crop.width, y: crop.y + crop.height },
      ]

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3

      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize)
      })

      const edgeHandles = [
        { x: crop.x + crop.width/2, y: crop.y },
        { x: crop.x + crop.width/2, y: crop.y + crop.height },
        { x: crop.x, y: crop.y + crop.height/2 },
        { x: crop.x + crop.width, y: crop.y + crop.height/2 },
      ]

      edgeHandles.forEach(handle => {
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, handleSize/2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        setImageSrc(img.src)
        setCropType(type)
        
        if (type === 'avatar') {
          const size = Math.min(img.width, img.height) * 0.8
          setCrop({
            x: (img.width - size) / 2,
            y: (img.height - size) / 2,
            width: size,
            height: size
          })
        } else {
          const height = Math.min(img.width / 4, img.height * 0.8)
          setCrop({
            x: 0,
            y: (img.height - height) / 2,
            width: img.width,
            height: height
          })
        }
        setCropModalOpen(true)
      }
    }

    reader.readAsDataURL(file)
  }

  function getCursorPosition(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function getHandleAtPosition(x: number, y: number): DragType {
    const handleSize = 20
    const edgeThreshold = 15

    if (Math.abs(x - crop.x) < handleSize && Math.abs(y - crop.y) < handleSize) return 'nw'
    if (Math.abs(x - (crop.x + crop.width)) < handleSize && Math.abs(y - crop.y) < handleSize) return 'ne'
    if (Math.abs(x - crop.x) < handleSize && Math.abs(y - (crop.y + crop.height)) < handleSize) return 'sw'
    if (Math.abs(x - (crop.x + crop.width)) < handleSize && Math.abs(y - (crop.y + crop.height)) < handleSize) return 'se'
    if (Math.abs(x - (crop.x + crop.width/2)) < handleSize && Math.abs(y - crop.y) < edgeThreshold) return 'n'
    if (Math.abs(x - (crop.x + crop.width/2)) < handleSize && Math.abs(y - (crop.y + crop.height)) < edgeThreshold) return 's'
    if (Math.abs(x - crop.x) < edgeThreshold && Math.abs(y - (crop.y + crop.height/2)) < handleSize) return 'w'
    if (Math.abs(x - (crop.x + crop.width)) < edgeThreshold && Math.abs(y - (crop.y + crop.height/2)) < handleSize) return 'e'

    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
      return 'move'
    }

    return null
  }

  function getCursor(dragType: DragType): string {
    switch(dragType) {
      case 'nw':
      case 'se':
        return 'nwse-resize'
      case 'ne':
      case 'sw':
        return 'nesw-resize'
      case 'n':
      case 's':
        return 'ns-resize'
      case 'e':
      case 'w':
        return 'ew-resize'
      case 'move':
        return 'move'
      default:
        return 'default'
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCursorPosition(e)
    const handle = getHandleAtPosition(pos.x, pos.y)
    
    if (handle) {
      setDragType(handle)
      setDragStart({
        x: pos.x,
        y: pos.y,
        cropX: crop.x,
        cropY: crop.y,
        cropWidth: crop.width,
        cropHeight: crop.height
      })
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const pos = getCursorPosition(e)

    if (!dragType) {
      const handle = getHandleAtPosition(pos.x, pos.y)
      canvas.style.cursor = getCursor(handle)
      return
    }

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y

    let newCrop = { ...crop }

    if (dragType === 'move') {
      newCrop.x = dragStart.cropX + dx
      newCrop.y = dragStart.cropY + dy
      newCrop.x = Math.max(0, Math.min(newCrop.x, imageSize.width - crop.width))
      newCrop.y = Math.max(0, Math.min(newCrop.y, imageSize.height - crop.height))
    } else {
      const aspectRatio = cropType === 'avatar' ? 1 : 4

      if (dragType === 'se') {
        if (cropType === 'avatar') {
          const size = Math.max(50, Math.min(
            dragStart.cropWidth + dx,
            dragStart.cropHeight + dy,
            imageSize.width - dragStart.cropX,
            imageSize.height - dragStart.cropY
          ))
          newCrop.width = size
          newCrop.height = size
        } else {
          newCrop.width = Math.max(100, Math.min(dragStart.cropWidth + dx, imageSize.width - dragStart.cropX))
          newCrop.height = newCrop.width / aspectRatio
          if (newCrop.y + newCrop.height > imageSize.height) {
            newCrop.height = imageSize.height - newCrop.y
            newCrop.width = newCrop.height * aspectRatio
          }
        }
      } else if (dragType === 'nw') {
        if (cropType === 'avatar') {
          const size = Math.max(50, Math.min(
            dragStart.cropWidth - dx,
            dragStart.cropHeight - dy
          ))
          const maxX = dragStart.cropX + dragStart.cropWidth - 50
          const maxY = dragStart.cropY + dragStart.cropHeight - 50
          newCrop.x = Math.max(0, Math.min(dragStart.cropX + dx, maxX))
          newCrop.y = Math.max(0, Math.min(dragStart.cropY + dy, maxY))
          newCrop.width = dragStart.cropX + dragStart.cropWidth - newCrop.x
          newCrop.height = newCrop.width
          newCrop.y = dragStart.cropY + dragStart.cropHeight - newCrop.height
        } else {
          const newWidth = Math.max(100, dragStart.cropWidth - dx)
          const newHeight = newWidth / aspectRatio
          newCrop.x = Math.max(0, dragStart.cropX + dragStart.cropWidth - newWidth)
          newCrop.y = Math.max(0, dragStart.cropY + dragStart.cropHeight - newHeight)
          newCrop.width = dragStart.cropX + dragStart.cropWidth - newCrop.x
          newCrop.height = newCrop.width / aspectRatio
        }
      } else if (dragType === 'ne') {
        if (cropType === 'avatar') {
          const size = Math.max(50, Math.min(
            dragStart.cropWidth + dx,
            dragStart.cropHeight - dy,
            imageSize.width - dragStart.cropX
          ))
          const maxY = dragStart.cropY + dragStart.cropHeight - 50
          newCrop.y = Math.max(0, Math.min(dragStart.cropY + dy, maxY))
          newCrop.width = size
          newCrop.height = size
          newCrop.y = dragStart.cropY + dragStart.cropHeight - newCrop.height
        } else {
          newCrop.width = Math.max(100, Math.min(dragStart.cropWidth + dx, imageSize.width - dragStart.cropX))
          newCrop.height = newCrop.width / aspectRatio
          newCrop.y = Math.max(0, dragStart.cropY + dragStart.cropHeight - newCrop.height)
        }
      } else if (dragType === 'sw') {
        if (cropType === 'avatar') {
          const size = Math.max(50, Math.min(
            dragStart.cropWidth - dx,
            dragStart.cropHeight + dy,
            imageSize.height - dragStart.cropY
          ))
          const maxX = dragStart.cropX + dragStart.cropWidth - 50
          newCrop.x = Math.max(0, Math.min(dragStart.cropX + dx, maxX))
          newCrop.width = dragStart.cropX + dragStart.cropWidth - newCrop.x
          newCrop.height = newCrop.width
        } else {
          const newWidth = Math.max(100, dragStart.cropWidth - dx)
          newCrop.x = Math.max(0, dragStart.cropX + dragStart.cropWidth - newWidth)
          newCrop.width = dragStart.cropX + dragStart.cropWidth - newCrop.x
          newCrop.height = newCrop.width / aspectRatio
          if (newCrop.y + newCrop.height > imageSize.height) {
            newCrop.height = imageSize.height - newCrop.y
            newCrop.width = newCrop.height * aspectRatio
            newCrop.x = dragStart.cropX + dragStart.cropWidth - newCrop.width
          }
        }
      } else if (dragType === 'n' || dragType === 's' || dragType === 'e' || dragType === 'w') {
        if (cropType === 'avatar') {
          let size = dragStart.cropWidth
          if (dragType === 'e') size = Math.max(50, Math.min(dragStart.cropWidth + dx, imageSize.width - dragStart.cropX))
          else if (dragType === 'w') size = Math.max(50, dragStart.cropWidth - dx)
          else if (dragType === 's') size = Math.max(50, Math.min(dragStart.cropHeight + dy, imageSize.height - dragStart.cropY))
          else if (dragType === 'n') size = Math.max(50, dragStart.cropHeight - dy)
          
          if (dragType === 'w') newCrop.x = Math.max(0, dragStart.cropX + dragStart.cropWidth - size)
          if (dragType === 'n') newCrop.y = Math.max(0, dragStart.cropY + dragStart.cropHeight - size)
          
          newCrop.width = size
          newCrop.height = size
        } else {
          if (dragType === 'e') {
            newCrop.width = Math.max(100, Math.min(dragStart.cropWidth + dx, imageSize.width - dragStart.cropX))
            newCrop.height = newCrop.width / aspectRatio
          } else if (dragType === 'w') {
            const newWidth = Math.max(100, dragStart.cropWidth - dx)
            newCrop.x = Math.max(0, dragStart.cropX + dragStart.cropWidth - newWidth)
            newCrop.width = dragStart.cropX + dragStart.cropWidth - newCrop.x
            newCrop.height = newCrop.width / aspectRatio
          } else if (dragType === 's') {
            newCrop.height = Math.max(25, Math.min(dragStart.cropHeight + dy, imageSize.height - dragStart.cropY))
            newCrop.width = newCrop.height * aspectRatio
          } else if (dragType === 'n') {
            const newHeight = Math.max(25, dragStart.cropHeight - dy)
            newCrop.y = Math.max(0, dragStart.cropY + dragStart.cropHeight - newHeight)
            newCrop.height = dragStart.cropY + dragStart.cropHeight - newCrop.y
            newCrop.width = newCrop.height * aspectRatio
          }
        }
      }

      if (newCrop.x + newCrop.width > imageSize.width) {
        newCrop.width = imageSize.width - newCrop.x
        if (cropType === 'avatar') newCrop.height = newCrop.width
        else newCrop.height = newCrop.width / aspectRatio
      }
      if (newCrop.y + newCrop.height > imageSize.height) {
        newCrop.height = imageSize.height - newCrop.y
        if (cropType === 'avatar') newCrop.width = newCrop.height
        else newCrop.width = newCrop.height * aspectRatio
      }
    }

    setCrop(newCrop)
  }

  function handleMouseUp() {
    setDragType(null)
  }

  async function handleCropConfirm() {
    if (!profile) return

    const canvas = canvasRef.current
    if (!canvas) return

    setUploading(true)

    try {
      const croppedCanvas = document.createElement('canvas')
      const ctx = croppedCanvas.getContext('2d')
      if (!ctx) return

      if (cropType === 'avatar') {
        croppedCanvas.width = 400
        croppedCanvas.height = 400
      } else {
        croppedCanvas.width = 1200
        croppedCanvas.height = 300
      }

      const img = new Image()
      img.src = imageSrc
      await new Promise((resolve) => { img.onload = resolve })

      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, croppedCanvas.width, croppedCanvas.height
      )

      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95)
      })

      const fileExt = 'jpg'
      const fileName = `${profile.id}/${cropType}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      const updateField = cropType === 'avatar' ? 'avatar_url' : 'cover_url'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, [updateField]: publicUrl })
      setCropModalOpen(false)
      setImageSrc("")

    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveBio() {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio_content: editBio })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, bio_content: editBio })
      setIsEditMode(false)
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  const getInitials = () => {
    if (!profile) return "U"
    const firstName = profile.first_name || ""
    const lastName = profile.last_name || ""
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    } else if (firstName) {
      return firstName[0].toUpperCase()
    } else if (lastName) {
      return lastName[0].toUpperCase()
    }
    return "U"
  }

  const getFullName = () => {
    if (!profile) return "User"
    const parts = [
      profile.first_name,
      profile.middle_name,
      profile.last_name
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : "User"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Admin</span>
      case 'officer':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Officer</span>
      case 'member':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Member</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{role}</span>
    }
  }

  const getContentTypeLabel = (contentType: string | undefined) => {
    switch(contentType) {
      case 'post': return 'Post'
      case 'free_wall_post': return 'Free Wall'
      case 'bulletin': return 'Bulletin'
      case 'announcement': return 'Announcement'
      case 'repost': return 'Repost'
      default: return ''
    }
  }

  const feedFilters = [
    { id: 'feed', label: 'Feed', icon: LayoutGrid },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'reposts', label: 'Reposts', icon: Repeat2 },
    { id: 'tagged', label: 'Tagged', icon: AtSign }
  ]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <ImagePreviewModal
        images={previewImages}
        initialIndex={previewIndex}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Crop {cropType === 'avatar' ? 'Avatar' : 'Cover Photo'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {cropType === 'avatar' ? 'Drag corners to resize (1:1 ratio)' : 'Drag corners to resize (4:1 ratio)'}
                </p>
              </div>
              <button 
                onClick={() => setCropModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 overflow-auto max-h-[60vh] bg-gray-100 rounded-xl">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: dragType ? getCursor(dragType) : 'default' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm & Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600 group">
          {profile.cover_url && (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <label className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Camera className="h-4 w-4 text-gray-700" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'cover')}
              disabled={uploading}
            />
          </label>
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 mb-6">
            <div className="flex items-end gap-4">
              <div className="relative group">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={getFullName()}
                    className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className={`h-32 w-32 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-black ${
                    profile.role === 'admin' 
                      ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                      : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {getInitials()}
                  </div>
                )}
                <label className="absolute bottom-2 right-2 p-2 bg-white rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Camera className="h-4 w-4 text-gray-700" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'avatar')}
                    disabled={uploading}
                  />
                </label>
                {profile.role === 'admin' && (
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center shadow-md">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-2">
                <h2 className="text-2xl font-black text-gray-900">{getFullName()}</h2>
                <p className="text-gray-600 text-sm">{profile.email}</p>
              </div>
            </div>

            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {isEditMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="mb-6">
            {isEditMode ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700 mb-2 block">Bio</span>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 resize-none"
                    rows={4}
                  />
                </label>
                <button
                  onClick={handleSaveBio}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Save Bio
                </button>
              </div>
            ) : (
              profile.bio_content && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profile.bio_content}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-blue-900">{stats.eventsCreated}</p>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Events Created</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <MessageSquare className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-purple-900">{stats.postsCreated}</p>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Posts Created</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
              <Heart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-900">{stats.interactions}</p>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Interactions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                <p className="text-sm font-semibold text-gray-900">
                  {department ? department.name : profile.department_code || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Course</p>
                <p className="text-sm font-semibold text-gray-900">
                  {course ? course.name : profile.course_code || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {organizations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-black text-gray-900">Organizations</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
              {organizations.length}
            </span>
          </div>

          <div className="space-y-3">
            {organizations.map((org, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {org.organization.code.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{org.organization.name}</p>
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(org.joined_at)}
                    </p>
                  </div>
                </div>
                {getRoleBadge(org.role)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-black text-gray-900">Activity</h3>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {feedFilters.map((filter) => {
            const Icon = filter.icon
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {feedItems.map((item) => (
            <div 
              key={`${item.type}-${item.id}-${item.repost_id || ''}-${item.tag_id || ''}`}
              onClick={(e) => handleItemClick(item, e)}
              className={`p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group relative ${
                item.event_id || item.type === 'free_wall_post' || item.type === 'repost' || item.type === 'tagged' ? 'cursor-pointer' : ''
              }`}
            >
              {activeFilter === 'feed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePinPost(item, item.pinned_to_profile)
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                    item.pinned_to_profile
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-white text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                  }`}
                  title={item.pinned_to_profile ? 'Unpin from profile' : 'Pin to profile (max 3)'}
                >
                  {item.pinned_to_profile ? (
                    <Pin className="h-4 w-4 fill-current" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {item.type === 'repost' && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                    <Repeat2 className="h-3 w-3" />
                    Reposted {item.content_type && `• ${getContentTypeLabel(item.content_type)}`}
                  </span>
                )}
                {item.type === 'tagged' && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                    <AtSign className="h-3 w-3" />
                    Tagged {item.content_type && `• ${getContentTypeLabel(item.content_type)}`}
                  </span>
                )}
                {item.type === 'free_wall_post' && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 font-bold">
                    <MessageSquare className="h-3 w-3" />
                    Free Wall Post
                  </span>
                )}
                {item.pinned_to_profile && activeFilter === 'feed' && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                    <Pin className="h-3 w-3 fill-current" />
                    Pinned
                  </span>
                )}
              </div>

              {item.type === 'repost' && item.repost_comment && (
                <div className="mb-2 p-2 bg-white rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-gray-700 italic">{item.repost_comment}</p>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  {item.event && item.event.title && (
                    <p className="text-xs font-bold text-blue-600 mb-1 group-hover:text-blue-700">
                      {item.event.title}
                    </p>
                  )}
                  {item.content && (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">
                      {item.content}
                    </p>
                  )}
                </div>
              </div>

              {item.image_urls && item.image_urls.length > 0 && (
                <div className={`mb-3 image-preview ${
                  item.image_urls.length === 1 ? 'grid grid-cols-1' :
                  item.image_urls.length === 2 ? 'grid grid-cols-2 gap-2' :
                  item.image_urls.length === 3 ? 'grid grid-cols-3 gap-2' :
                  'grid grid-cols-2 gap-2'
                }`}>
                  {item.image_urls.slice(0, 4).map((url, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        e.stopPropagation()
                        openImagePreview(item.image_urls, idx)
                      }}
                      className={`relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity ${
                        item.image_urls.length === 1 ? 'aspect-video col-span-1' :
                        item.image_urls.length === 3 && idx === 0 ? 'aspect-video col-span-2' :
                        'aspect-square'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Post image ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && item.image_urls.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            +{item.image_urls.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(item.created_at)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {item.reaction_count || 0}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {item.comments}
                </span>
                {item.image_urls && item.image_urls.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {item.image_urls.length}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}

          <div ref={observerTarget} className="h-4" />

          {!loadingMore && feedItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium">No {activeFilter} found</p>
              <p className="text-sm">Start engaging with events to see activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}