// components/ui/TruncatedText.tsx
"use client"

import { useState, useRef, useEffect } from "react"

interface TruncatedTextProps {
  text: string
  maxLines?: number
  className?: string
}

export function TruncatedText({ text, maxLines = 2, className = "" }: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [truncatedText, setTruncatedText] = useState("")
  const measureRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const measureAndTruncate = () => {
      if (!measureRef.current || !containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight)
      const maxHeight = lineHeight * maxLines

      // Reset to full text to measure
      measureRef.current.textContent = text
      const fullHeight = measureRef.current.scrollHeight

      if (fullHeight <= maxHeight) {
        setShouldTruncate(false)
        return
      }

      setShouldTruncate(true)

      // Binary search to find the right truncation point
      let low = 0
      let high = text.length
      let bestFit = 0

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        measureRef.current.textContent = text.substring(0, mid) + "... "
        
        const currentHeight = measureRef.current.scrollHeight
        
        if (currentHeight <= maxHeight) {
          bestFit = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }

      // Find the last complete word before the truncation point
      let truncateAt = bestFit
      while (truncateAt > 0 && text[truncateAt] !== ' ' && text[truncateAt - 1] !== ' ') {
        truncateAt--
      }

      // Trim any trailing spaces
      const finalText = text.substring(0, truncateAt).trim()
      setTruncatedText(finalText)
    }

    measureAndTruncate()
    window.addEventListener('resize', measureAndTruncate)
    return () => window.removeEventListener('resize', measureAndTruncate)
  }, [text, maxLines])

  if (!shouldTruncate) {
    return (
      <div ref={containerRef} className={className}>
        <div ref={measureRef} className="whitespace-pre-wrap">
          {text}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      {/* Hidden element for measurements */}
      <div
        ref={measureRef}
        className="absolute invisible whitespace-pre-wrap pointer-events-none"
        style={{ width: '100%' }}
        aria-hidden="true"
      />

      {/* Displayed text */}
      <div className="whitespace-pre-wrap">
        {isExpanded ? (
          <>
            {text}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-600 hover:text-gray-900 font-semibold ml-1"
            >
              See less
            </button>
          </>
        ) : (
          <>
            {truncatedText}
            {"... "}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              See more
            </button>
          </>
        )}
      </div>
    </div>
  )
}