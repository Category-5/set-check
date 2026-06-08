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
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { Playlist } from "@/lib/types"

interface EditSetlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist
  isCreator: boolean
  onPlaylistUpdated: (updated: Partial<Playlist>) => void
}

export function EditSetlistDialog({
  open,
  onOpenChange,
  playlist,
  isCreator,
  onPlaylistUpdated,
}: EditSetlistDialogProps) {
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || "")
  const [externalLink, setExternalLink] = useState(playlist.external_link || "")
  const [publicEdit, setPublicEdit] = useState(playlist.public_edit)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(playlist.name)
      setDescription(playlist.description || "")
      setExternalLink(playlist.external_link || "")
      setPublicEdit(playlist.public_edit)
    }
    onOpenChange(newOpen)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      const updates: Partial<Playlist> = {
        name: name.trim(),
        description: description.trim() || null,
        external_link: externalLink.trim() || null,
        public_edit: publicEdit,
      }

      const { error } = await supabase
        .from("playlists")
        .update(updates)
        .eq("id", playlist.id)

      if (!error) {
        onPlaylistUpdated(updates)
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Setlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Setlist name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Add a description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalLink">External Link</Label>
            <Input
              id="externalLink"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Link to your setlist on Spotify, Apple Music, or another service
            </p>
          </div>

          {isCreator && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="publicEdit" className="text-sm font-medium">Allow public editing</Label>
                <p className="text-xs text-muted-foreground">
                  Let anyone promote songs, remove songs, and edit sections
                </p>
              </div>
              <Switch
                id="publicEdit"
                checked={publicEdit}
                onCheckedChange={setPublicEdit}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
