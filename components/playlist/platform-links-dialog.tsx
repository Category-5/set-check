"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Music, ExternalLink } from "lucide-react"
import type { Song, PlatformLinks } from "@/lib/types"

interface PlatformLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
}

const PLATFORM_INFO: Record<string, { name: string; color: string }> = {
  spotify: { name: "Spotify", color: "bg-[#1DB954]" },
  appleMusic: { name: "Apple Music", color: "bg-[#FA243C]" },
  youtube: { name: "YouTube", color: "bg-[#FF0000]" },
  youtubeMusic: { name: "YouTube Music", color: "bg-[#FF0000]" },
  amazonMusic: { name: "Amazon Music", color: "bg-[#00A8E1]" },
  deezer: { name: "Deezer", color: "bg-[#FEAA2D]" },
  tidal: { name: "Tidal", color: "bg-[#000000]" },
  soundcloud: { name: "SoundCloud", color: "bg-[#FF5500]" },
  pandora: { name: "Pandora", color: "bg-[#005483]" },
  audiomack: { name: "Audiomack", color: "bg-[#FFA200]" },
}

export function PlatformLinksDialog({ open, onOpenChange, song }: PlatformLinksDialogProps) {
  if (!song) return null

  const links = (song.platform_links || {}) as PlatformLinks
  const availablePlatforms = Object.entries(links).filter(([, url]) => url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Listen on</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
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
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{song.title}</p>
            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          </div>
        </div>

        {song.note && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-4">
            <p className="text-sm text-muted-foreground italic">{song.note}</p>
          </div>
        )}

        <div className="grid gap-2">
          {availablePlatforms.length > 0 ? (
            availablePlatforms.map(([platform, url]) => {
              const info = PLATFORM_INFO[platform] || { name: platform, color: "bg-muted" }
              return (
                <Button
                  key={platform}
                  variant="secondary"
                  className="justify-between h-12"
                  asChild
                >
                  <a href={url as string} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${info.color}`} />
                      {info.name}
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </Button>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No streaming links available
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
