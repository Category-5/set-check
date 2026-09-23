"use client"

import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Vote } from "@/lib/types"

interface VoteButtonsProps {
  songId: string
  currentUser: string | null
  initialVotes?: Vote[]
}

export function VoteButtons({ songId, currentUser, initialVotes = [] }: VoteButtonsProps) {
  const [votes, setVotes] = useState<Vote[]>(initialVotes)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    fetch(`/api/vote?songId=${songId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.votes) setVotes(data.votes)
      })
      .catch(console.error)
  }, [songId])

  const upvotes = votes.filter((v) => v.vote_type === "up")
  const downvotes = votes.filter((v) => v.vote_type === "down")
  const userVote = currentUser
    ? votes.find((v) => v.user_name === currentUser)?.vote_type
    : null

  const handleVote = async (voteType: "up" | "down") => {
    if (!currentUser || isVoting) return

    setIsVoting(true)
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, userName: currentUser, voteType }),
      })
      const data = await res.json()
      if (data.votes) setVotes(data.votes)
    } catch (error) {
      console.error("Vote failed:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const upvoterNames = upvotes.map((v) => v.user_name).join(", ") || "No upvotes yet"
  const downvoterNames = downvotes.map((v) => v.user_name).join(", ") || "No downvotes yet"
  const title = !currentUser ? "Add your name to vote" : undefined

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => handleVote("up")}
              disabled={!currentUser || isVoting}
              title={title}
              aria-label={`Vote for this song. ${upvotes.length} for, ${downvotes.length} against.`}
              aria-pressed={userVote === "up"}
              className={`flex h-9 min-w-11 items-center justify-center gap-1.5 border px-2 transition-colors disabled:opacity-40 ${
                userVote === "up"
                  ? "border-ballpoint bg-ballpoint text-on-ballpoint"
                  : "border-rule text-muted-foreground hover:border-ballpoint hover:text-ballpoint"
              }`}
            >
              <span className="flex items-end gap-[3px]" aria-hidden="true">
                {upvotes.length > 0 ? (
                  Array.from({ length: Math.min(upvotes.length, 5) }).map((_, i) => (
                    <span
                      key={i}
                      className={`block w-[3px] ${userVote === "up" ? "bg-on-ballpoint" : "bg-ballpoint"}`}
                      style={{ height: 6 + i * 2 }}
                    />
                  ))
                ) : (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V6M6 12l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="num text-[0.6875rem] tabular-nums leading-none">
                {upvotes.length}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="text-xs">for: {upvoterNames}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => handleVote("down")}
              disabled={!currentUser || isVoting}
              title={title}
              aria-label={`Vote against this song. ${downvotes.length} against.`}
              aria-pressed={userVote === "down"}
              className={`-ml-px flex h-9 min-w-9 items-center justify-center gap-1.5 border px-2 transition-colors disabled:opacity-40 ${
                userVote === "down"
                  ? "border-ink bg-ink text-stock"
                  : "border-rule text-muted-foreground hover:border-ink hover:text-ink"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {downvotes.length > 0 && (
                <span className="num text-[0.6875rem] tabular-nums leading-none">
                  {downvotes.length}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="text-xs">against: {downvoterNames}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
