"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Music, Check, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ImportSpotifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportResult {
  playlistId: string
  playlistName: string
  totalTracks: number
  addedTracks: number
  songs: { title: string; artist: string; success: boolean }[]
}

export function ImportSpotifyDialog({
  open,
  onOpenChange,
}: ImportSpotifyDialogProps) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState(0)

  const handleImport = async () => {
    if (!url.trim()) return

    setIsImporting(true)
    setError(null)
    setResult(null)
    setProgress(10)

    // Simulate progress while waiting for response
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90))
    }, 500)

    try {
      const username = localStorage.getItem("setcheck_username")
      
      const response = await fetch("/api/import-spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl: url.trim(),
          createdBy: username,
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to import playlist")
      }

      const data: ImportResult = await response.json()
      setProgress(100)
      setResult(data)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : "Failed to import playlist")
      setProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  const handleViewSetlist = () => {
    if (result?.playlistId) {
      router.push(`/p/${result.playlistId}`)
      handleClose(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isImporting) {
      setUrl("")
      setError(null)
      setResult(null)
      setProgress(0)
    }
    if (!isImporting) {
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Import from Spotify
          </DialogTitle>
          <DialogDescription>
            Paste a Spotify playlist link to import all songs with magic links to every platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                disabled={isImporting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isImporting) handleImport()
                }}
              />

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Importing songs and generating magic links...
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={isImporting || !url.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Playlist"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                The playlist must be public for import to work.
              </p>
            </>
          ) : (
<div className="space-y-4 overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{result.playlistName}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.addedTracks} of {result.totalTracks} songs imported
                  </p>
                </div>
              </div>

              {result.songs.length > 0 && (
                <div className="flex-1 min-h-0 max-h-64 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                  {result.songs.slice(0, 20).map((song, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 py-1.5 px-2 text-sm min-w-0"
                    >
                      {song.success ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      )}
                      <span className="truncate flex-1 min-w-0 text-foreground">{song.title}</span>
                      <span className="text-muted-foreground truncate shrink-0 max-w-[40%]">- {song.artist}</span>
                    </div>
                  ))}
                  {result.songs.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{result.songs.length - 20} more songs
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleViewSetlist} className="w-full">
                <Music className="w-4 h-4 mr-2" />
                View Setlist
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
