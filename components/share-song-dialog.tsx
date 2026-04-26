"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Music, Check, AlertCircle, Copy, Link2 } from "lucide-react"

interface ShareSongDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShareResult {
  id: string
  title: string
  artist: string
  thumbnail_url: string | null
}

export function ShareSongDialog({ open, onOpenChange }: ShareSongDialogProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ShareResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/share-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create share link")
      }

      const data: ShareResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link")
    } finally {
      setIsLoading(false)
    }
  }

  const shareUrl = result ? `${typeof window !== "undefined" ? window.location.origin : ""}/song/${result.id}` : ""

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

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isLoading) {
      setUrl("")
      setError(null)
      setResult(null)
      setCopied(false)
    }
    if (!isLoading) {
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Share a Song
          </DialogTitle>
          <DialogDescription>
            Paste any music link and get a universal link that works for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a Spotify, Apple Music, YouTube, or any music link..."
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleShare()
                }}
              />

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleShare}
                disabled={isLoading || !url.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating link...
                  </>
                ) : (
                  "Create Share Link"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="shrink-0 w-14 h-14 rounded bg-secondary flex items-center justify-center overflow-hidden">
                  {result.thumbnail_url ? (
                    <img
                      src={result.thumbnail_url}
                      alt={result.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <Music className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{result.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{result.artist}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Your share link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="secondary"
                    className="shrink-0 gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can listen on their preferred streaming service.
              </p>

              <Button
                onClick={() => {
                  setResult(null)
                  setUrl("")
                }}
                variant="outline"
                className="w-full"
              >
                Share Another Song
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
