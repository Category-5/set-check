"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Music, ExternalLink, Share2, Check, Copy, FileMusic } from "lucide-react"
import type { Song, PlatformLinks } from "@/lib/types"
import { openWithAppFallback } from "@/lib/utils"

interface PlatformLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  playlistId?: string
  onNoteSave?: (note: string) => void
}

const PLATFORM_INFO: Record<string, { name: string; color: string }> = {
  spotify: { name: "Spotify", color: "bg-[#1DB954]" },
  appleMusic: { name: "Apple Music", color: "bg-[#FA243C]" },
  tidal: { name: "Tidal", color: "bg-[#000000]" },
}

export function PlatformLinksDialog({ open, onOpenChange, song, playlistId, onNoteSave }: PlatformLinksDialogProps) {
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState("")

  useEffect(() => {
    if (song) setNote(song.note || "")
  }, [song, open])

  if (!song) return null

  const links = (song.platform_links || {}) as PlatformLinks
  const availablePlatforms = Object.entries(links).filter(([, url]) => url)

  const shareUrl = playlistId && typeof window !== "undefined" 
    ? `${window.location.origin}/p/${playlistId}?song=${song.id}`
    : ""

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!shareUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} - ${song.artist}`,
          text: `Check out "${song.title}" by ${song.artist}`,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed, fall back to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Listen on</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4 overflow-hidden">
          <div className="shrink-0 w-16 h-16 rounded bg-secondary flex items-center justify-center overflow-hidden">
            {song.thumbnail_url ? (
              <img
                src={song.thumbnail_url}
                alt={song.title}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Music className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-semibold text-foreground truncate max-w-full">{song.title}</p>
            <p className="text-sm text-muted-foreground truncate max-w-full">{song.artist}</p>
          </div>
        </div>

        {song.external_link && (
          <Button
            variant="secondary"
            className="justify-between h-12 mb-2"
            onClick={() => window.open(song.external_link!, "_blank", "noopener,noreferrer")}
          >
            <span className="flex items-center gap-3">
              <FileMusic className="w-4 h-4" />
              Chord sheet
            </span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}

        {onNoteSave ? (
          <div className="space-y-2 mb-4">
            <Label htmlFor="platform-dialog-note">Notes</Label>
            <Textarea
              id="platform-dialog-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                const trimmed = note.trim()
                if (trimmed !== (song.note || "")) {
                  onNoteSave(trimmed)
                }
              }}
              placeholder="Why did you add this song? Share your thoughts..."
              rows={3}
              className="resize-none"
            />
          </div>
        ) : song.note ? (
          <div className="space-y-2 mb-4">
            <Label>Notes</Label>
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground italic">{song.note}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          {availablePlatforms.length > 0 ? (
            availablePlatforms.map(([platform, url]) => {
              const info = PLATFORM_INFO[platform] || { name: platform, color: "bg-muted" }
              return (
                <Button
                  key={platform}
                  variant="secondary"
                  className="justify-between h-12"
                  onClick={() => openWithAppFallback(url as string)}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${info.color}`} />
                    {info.name}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No streaming links available
            </p>
          )}
        </div>

        {/* Share this song */}
        {playlistId && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Share this song</p>
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                onClick={handleCopy}
                variant="secondary"
                className="shrink-0 gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
