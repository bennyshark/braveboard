// components/reactions/ReactionSummary.tsx
"use client"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface ReactionSummaryProps {
  contentType: 'post' | 'comment' | 'bulletin' | 'announcement' | 'free_wall_post' | 'repost'
  contentId: string
  totalCount?: number
  refreshTrigger?: number
}

type ReactionType = 'heart' | 'laugh' | 'celebrate' | 'like' | 'sad' | 'insightful' | 'care'

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  heart: '❤️',
  celebrate: '🎉',
  laugh: '😂',
  insightful: '💡',
  care: '🤗',
  sad: '😢'
}

type ReactionSummaryData = {
  type: ReactionType
  count: number
}

export function ReactionSummary({ contentType, contentId, totalCount = 0, refreshTrigger = 0 }: ReactionSummaryProps) {
  const [reactions, setReactions] = useState<ReactionSummaryData[]>([])
  const [total, setTotal] = useState(totalCount)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    loadReactions()
  }, [contentType, contentId, refreshTrigger])

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (error) throw error

      // Count reactions by type
      const counts = new Map<ReactionType, number>()
      data.forEach(r => {
        const current = counts.get(r.reaction_type as ReactionType) || 0
        counts.set(r.reaction_type as ReactionType, current + 1)
      })

      // Convert to array and sort by count
      const summary: ReactionSummaryData[] = Array.from(counts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3) // Top 3

      setReactions(summary)
      setTotal(data.length)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  if (total === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
      {/* Top 3 Reaction Emojis */}
      <div className="flex items-center -space-x-1">
        {reactions.map((reaction, index) => (
          <div
            key={reaction.type}
            className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs border border-gray-200 shadow-sm"
            style={{ zIndex: 3 - index }}
            title={`${reaction.count} ${reaction.type}`}
          >
            {REACTION_EMOJIS[reaction.type]}
          </div>
        ))}
      </div>

      {/* Total Count */}
      <span className="text-xs font-bold text-gray-600 ml-1">
        {total}
      </span>
    </div>
  )
}