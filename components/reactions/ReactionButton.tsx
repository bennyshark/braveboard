// components/reactions/ReactionButton.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { ThumbsUp } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface ReactionButtonProps {
  contentType: 'post' | 'comment' | 'bulletin' | 'announcement'
  contentId: string
  onReactionChange?: () => void
}

type ReactionType = 'heart' | 'laugh' | 'celebrate' | 'like' | 'sad' | 'insightful' | 'care'

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'hover:bg-blue-50' },
  { type: 'heart', emoji: '❤️', label: 'Love', color: 'hover:bg-red-50' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate', color: 'hover:bg-yellow-50' },
  { type: 'laugh', emoji: '😂', label: 'Funny', color: 'hover:bg-orange-50' },
  { type: 'insightful', emoji: '💡', label: 'Insightful', color: 'hover:bg-purple-50' },
  { type: 'care', emoji: '🤗', label: 'Support', color: 'hover:bg-green-50' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'hover:bg-gray-50' },
]

export function ReactionButton({ contentType, contentId, onReactionChange }: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadUserReaction()
  }, [contentType, contentId])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const loadUserReaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      setCurrentReaction(data?.reaction_type || null)
    } catch (error) {
      console.error('Error loading reaction:', error)
    }
  }

  const handleReaction = async (reactionType: ReactionType) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If clicking the same reaction, remove it
      if (currentReaction === reactionType) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)

        if (error) throw error
        
        // Update local state immediately
        setCurrentReaction(null)
        
        // Trigger parent refresh
        if (onReactionChange) {
          setTimeout(() => onReactionChange(), 100)
        }
      } else {
        // Upsert the reaction (add or update)
        const { error } = await supabase
          .from('reactions')
          .upsert({
            user_id: user.id,
            content_type: contentType,
            content_id: contentId,
            reaction_type: reactionType,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,content_type,content_id'
          })

        if (error) throw error
        
        // Update local state immediately
        setCurrentReaction(reactionType)
        
        // Trigger parent refresh
        if (onReactionChange) {
          setTimeout(() => onReactionChange(), 100)
        }
      }

    } catch (error) {
      console.error('Error updating reaction:', error)
      // Revert to previous state on error
      await loadUserReaction()
    } finally {
      setIsLoading(false)
      setShowReactions(false)
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setShowReactions(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowReactions(false)
    }, 200)
  }

  const currentReactionData = REACTIONS.find(r => r.type === currentReaction)

  return (
    <div 
      ref={buttonRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => handleReaction('like')}
        disabled={isLoading}
        title={currentReactionData ? currentReactionData.label : 'Like'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold ${
          currentReaction
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {currentReactionData ? (
          <span className="text-base">{currentReactionData.emoji}</span>
        ) : (
          <ThumbsUp className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Reaction Menu */}
      {showReactions && (
        <div 
          className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-2xl border-2 border-gray-200 p-2 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              disabled={isLoading}
              className={`group relative w-10 h-10 rounded-full transition-all transform hover:scale-125 ${reaction.color} ${
                currentReaction === reaction.type ? 'scale-110 bg-blue-100' : ''
              }`}
              title={reaction.label}
            >
              <span className="text-2xl">{reaction.emoji}</span>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {reaction.label}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}