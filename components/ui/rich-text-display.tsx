"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface RichTextDisplayProps {
  content: string
  className?: string
  maxLines?: number
}

export function RichTextDisplay({ content, className, maxLines = 2 }: RichTextDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  if (!content || content === "<p></p>") return null

  const isHtml = content.includes("<")
  const displayContent = isHtml ? content : `<p>${content}</p>`

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > contentRef.current.clientHeight)
    }
  }, [content, expanded])

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none text-muted-foreground",
          "[&_p]:mb-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5",
          !expanded && "overflow-hidden",
          !expanded && maxLines === 2 && "max-h-[3em]",
          !expanded && maxLines === 3 && "max-h-[4.5em]",
        )}
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {!expanded && isOverflowing && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-primary hover:underline mt-0.5"
        >
          Show more
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-primary hover:underline mt-0.5"
        >
          Show less
        </button>
      )}
    </div>
  )
}
