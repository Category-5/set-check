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

const PLATFORM_INFO: Record<string, { name: string }> = {
  spotify: { name: "Spotify" },
  appleMusic: { name: "Apple Music" },
  youtube: { name: "YouTube" },
  youtubeMusic: { name: "YouTube Music" },
  amazonMusic: { name: "Amazon Music" },
  deezer: { name: "Deezer" },
  tidal: { name: "Tidal" },
  soundcloud: { name: "SoundCloud" },
  pandora: { name: "Pandora" },
  audiomack: { name: "Audiomack" },
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
          <DialogTitle className="font-display text-lg font-semibold">Open this song</DialogTitle>
        </DialogHeader>

        <div className="-mt-1 flex items-center gap-4 overflow-hidden">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border border-rule-strong bg-sunk">
            {song.thumbnail_url ? (
              <img
                src={song.thumbnail_url}
                alt=""
                className="size-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Music className="size-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="max-w-full truncate text-lg leading-tight">{song.title}</p>
            <p className="max-w-full truncate text-sm text-muted-foreground">{song.artist}</p>
          </div>
        </div>

        {song.external_link && (
          <button
            type="button"
            className="group flex h-12 w-full items-center gap-3 border border-rule-strong px-4 text-left transition-colors hover:bg-ink hover:text-stock"
            onClick={() => window.open(song.external_link!, "_blank", "noopener,noreferrer")}
          >
            <FileMusic className="size-4" />
            <span className="flex-1 text-sm">Chord sheet</span>
            <ExternalLink className="size-4 text-muted-foreground group-hover:text-stock" />
          </button>
        )}

        {onNoteSave ? (
          <div className="space-y-2 mb-4">
            <Label htmlFor="platform-dialog-note" className="label">note</Label>
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
              placeholder="Why this one? Key, arrangement, where it sits…"
              rows={3}
              className="resize-none"
            />
          </div>
        ) : song.note ? (
          <div className="space-y-2 mb-4">
            <Label className="label">note</Label>
            <div className="border border-rule bg-sunk p-3">
              <p className="text-sm text-muted-foreground">{song.note}</p>
            </div>
          </div>
        ) : null}

        <div>
          <p className="label mb-2">Open it in</p>
          <div className="border border-rule-strong">
            {availablePlatforms.length > 0 ? (
              availablePlatforms.map(([platform, url]) => {
                const info = PLATFORM_INFO[platform] || { name: platform }
                return (
                  <button
                    key={platform}
                    type="button"
                    className="group flex h-12 w-full items-center gap-3 border-b border-rule px-4 text-left transition-colors last:border-b-0 hover:bg-ink hover:text-stock"
                    onClick={() => openWithAppFallback(url as string)}
                  >
                    <span
                      className="size-2.5 shrink-0 bg-ink group-hover:bg-stock"
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-sm">{info.name}</span>
                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-stock" />
                  </button>
                )
              })
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No streaming links were found for this song.
              </p>
            )}
          </div>
        </div>

        {playlistId && (
          <div className="border-t border-rule pt-4">
            <p className="label mb-2">send it to someone</p>
            <div className="flex gap-2">
              <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                <Share2 className="size-4" />
                share
              </Button>
              <Button onClick={handleCopy} variant="secondary" className="shrink-0 gap-2">
                {copied ? (
                  <>
                    <Check className="size-4 text-ballpoint" />
                    copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    copy link
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
