"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Music, Plus } from "lucide-react"
import type { Song, OdesliResponse } from "@/lib/types"

interface AddSongDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlistId: string
  currentPosition: number
  currentUser: string | null
  onSongAdded: (song: Song) => void
}

export function AddSongDialog({
  open,
  onOpenChange,
  playlistId,
  currentPosition,
  currentUser,
  onSongAdded,
}: AddSongDialogProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchResult, setSearchResult] = useState<OdesliResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/search-song?url=${encodeURIComponent(query.trim())}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to find song")
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find song")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddSong = async () => {
    if (!searchResult) return

    setIsAdding(true)
    try {
      const response = await fetch("/api/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          position: currentPosition,
          odesliData: searchResult,
          addedBy: currentUser,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add song")
      }

      const song = await response.json()
      onSongAdded(song)
      
      // Reset and close
      setQuery("")
      setSearchResult(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song")
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setQuery("")
      setSearchResult(null)
      setError(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Song</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a link from Spotify, Apple Music, YouTube, or any other music platform.
          </p>

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
            <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {searchResult && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary overflow-hidden">
              <div className="shrink-0 w-14 h-14 rounded bg-muted flex items-center justify-center overflow-hidden">
                {searchResult.thumbnailUrl ? (
                  <img
                    src={searchResult.thumbnailUrl}
                    alt={searchResult.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Music className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium text-foreground truncate max-w-full">
                  {searchResult.title}
                </p>
                <p className="text-sm text-muted-foreground truncate max-w-full">
                  {searchResult.artistName}
                </p>
              </div>
              <Button onClick={handleAddSong} disabled={isAdding} className="shrink-0">
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
