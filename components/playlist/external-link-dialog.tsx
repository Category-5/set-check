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
import { Loader2, Link2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ExternalLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlistId: string
  currentLink: string | null
  onLinkUpdated: (link: string | null) => void
}

export function ExternalLinkDialog({
  open,
  onOpenChange,
  playlistId,
  currentLink,
  onLinkUpdated,
}: ExternalLinkDialogProps) {
  const [link, setLink] = useState(currentLink || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    // Validate URL if provided
    if (link.trim()) {
      try {
        new URL(link.trim())
      } catch {
        setError("Please enter a valid URL")
        setIsSaving(false)
        return
      }
    }

    const { error: dbError } = await supabase
      .from("playlists")
      .update({ external_link: link.trim() || null })
      .eq("id", playlistId)

    if (dbError) {
      setError("Failed to save link")
      setIsSaving(false)
      return
    }

    onLinkUpdated(link.trim() || null)
    onOpenChange(false)
    setIsSaving(false)
  }

  const handleRemove = async () => {
    setIsSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from("playlists")
      .update({ external_link: null })
      .eq("id", playlistId)

    if (dbError) {
      setError("Failed to remove link")
      setIsSaving(false)
      return
    }

    setLink("")
    onLinkUpdated(null)
    onOpenChange(false)
    setIsSaving(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLink(currentLink || "")
      setError(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            External Setlist Link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add a link to your setlist on another platform (Spotify, Apple Music, etc.)
          </p>

          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
            }}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Link"
              )}
            </Button>
            {currentLink && (
              <Button onClick={handleRemove} disabled={isSaving} variant="destructive" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
