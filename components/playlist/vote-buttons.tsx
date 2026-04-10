"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
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
    // Fetch votes on mount
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
        body: JSON.stringify({
          songId,
          userName: currentUser,
          voteType,
        }),
      })

      const data = await res.json()
      if (data.votes) {
        setVotes(data.votes)
      }
    } catch (error) {
      console.error("Vote failed:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const upvoterNames = upvotes.map((v) => v.user_name).join(", ") || "No upvotes yet"
  const downvoterNames = downvotes.map((v) => v.user_name).join(", ") || "No downvotes yet"

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1 ${
                userVote === "up"
                  ? "text-green-500 hover:text-green-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleVote("up")}
              disabled={!currentUser || isVoting}
            >
              <ThumbsUp className="w-4 h-4" />
              {upvotes.length > 0 && (
                <span className="text-xs">{upvotes.length}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">{upvoterNames}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1 ${
                userVote === "down"
                  ? "text-red-500 hover:text-red-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleVote("down")}
              disabled={!currentUser || isVoting}
            >
              <ThumbsDown className="w-4 h-4" />
              {downvotes.length > 0 && (
                <span className="text-xs">{downvotes.length}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">{downvoterNames}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
