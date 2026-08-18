"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, Music, Plus, Link } from "lucide-react"
import type { Song, SongLookupResult } from "@/lib/types"
import type { SpotifyTrackResult } from "@/lib/spotify"

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
  const [linkQuery, setLinkQuery] = useState("")
  const [spotifyQuery, setSpotifyQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [searchResult, setSearchResult] = useState<SongLookupResult | null>(null)
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrackResult[]>([])
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<SpotifyTrackResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("search")

  const handleLinkSearch = async () => {
    if (!linkQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/search-song?url=${encodeURIComponent(linkQuery.trim())}`)

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

  const handleSpotifySearch = async () => {
    if (!spotifyQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setSpotifyResults([])
    setSelectedSpotifyTrack(null)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(spotifyQuery.trim())}`)

      if (!response.ok) {
        throw new Error("Failed to search Spotify")
      }

      const data: SpotifyTrackResult[] = await response.json()
      if (data.length === 0) {
        setError("No results found. Try a different search.")
      } else {
        setSpotifyResults(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search Spotify")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSpotifyTrack = async (track: SpotifyTrackResult) => {
    setSelectedSpotifyTrack(track)
    setError(null)
    setIsSearching(true)

    try {
      const response = await fetch(`/api/search-song?url=${encodeURIComponent(track.spotifyUrl)}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to resolve song links")
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve song links")
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
          songData: searchResult,
          addedBy: currentUser,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add song")
      }

      const song = await response.json()
      onSongAdded(song)
      resetAndClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song")
    } finally {
      setIsAdding(false)
    }
  }

  const resetAndClose = () => {
    setLinkQuery("")
    setSpotifyQuery("")
    setSearchResult(null)
    setSpotifyResults([])
    setSelectedSpotifyTrack(null)
    setError(null)
    onOpenChange(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLinkQuery("")
      setSpotifyQuery("")
      setSearchResult(null)
      setSpotifyResults([])
      setSelectedSpotifyTrack(null)
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setError(null)
    setSearchResult(null)
    setSpotifyResults([])
    setSelectedSpotifyTrack(null)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add a Song</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="search">
              <Search className="w-3.5 h-3.5" />
              Search
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-3.5 h-3.5" />
              Paste Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3 overflow-y-auto mt-0 px-1 pb-1">
            <p className="text-sm text-muted-foreground">
              Search for a song on Spotify by title, artist, or both.
            </p>

            <div className="flex gap-2">
              <Input
                value={spotifyQuery}
                onChange={(e) => setSpotifyQuery(e.target.value)}
                placeholder="Song name or artist..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSpotifySearch()
                }}
              />
              <Button onClick={handleSpotifySearch} disabled={isSearching || !spotifyQuery.trim()}>
                {isSearching && !selectedSpotifyTrack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {spotifyResults.length > 0 && !searchResult && (
              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-1">
                  {spotifyResults.map((track) => (
                    <button
                      key={track.spotifyUrl}
                      onClick={() => handleSelectSpotifyTrack(track)}
                      disabled={isSearching}
                      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary text-left transition-colors disabled:opacity-50"
                    >
                      <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {track.thumbnailUrl ? (
                          <img
                            src={track.thumbnailUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist} · {track.album} · {formatDuration(track.durationMs)}
                        </p>
                      </div>
                      {isSearching && selectedSpotifyTrack?.spotifyUrl === track.spotifyUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
                      ) : (
                        <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {searchResult && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
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
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{searchResult.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{searchResult.artistName}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-3 overflow-y-auto mt-0 px-1 pb-1">
            <p className="text-sm text-muted-foreground">
              Paste a link from Spotify, Apple Music, or Tidal.
            </p>

            <div className="flex gap-2">
              <Input
                value={linkQuery}
                onChange={(e) => setLinkQuery(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLinkSearch()
                }}
              />
              <Button onClick={handleLinkSearch} disabled={isSearching || !linkQuery.trim()}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {searchResult && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
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
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{searchResult.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{searchResult.artistName}</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {searchResult && (
          <div className="shrink-0 border-t pt-4">
            <Button onClick={handleAddSong} disabled={isAdding} className="w-full">
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Song
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
