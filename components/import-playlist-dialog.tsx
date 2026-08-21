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
import { Loader2, Music, Check, AlertCircle, Download } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ImportPlaylistDialogProps {
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

export function ImportPlaylistDialog({
  open,
  onOpenChange,
}: ImportPlaylistDialogProps) {
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

      const response = await fetch("/api/import-playlist", {
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
            <Download className="w-5 h-5 text-primary" />
            Import a Playlist
          </DialogTitle>
          <DialogDescription>
            Paste a Spotify, Apple Music, or Tidal playlist link to import all songs with magic links to every platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a Spotify, Apple Music, or Tidal playlist link..."
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
