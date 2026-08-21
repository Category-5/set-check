"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy, Share2 } from "lucide-react"
import type { Playlist } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist
}

export function ShareDialog({ open, onOpenChange, playlist }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/p/${playlist.id}`
    : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist.name,
          text: playlist.description || "Check out this setlist!",
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed
        console.error("Share failed:", err)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Setlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Anyone with this link can view and edit the setlist.
          </p>

          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="bg-secondary" />
            <Button onClick={handleCopy} variant="outline" className="shrink-0">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <Button onClick={handleShare} className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
