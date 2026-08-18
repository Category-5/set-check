"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SongEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: string
  externalLink: string
  onSave: (data: { note: string; externalLink: string }) => void
}

export function SongEditDialog({ open, onOpenChange, note: initialNote, externalLink: initialLink, onSave }: SongEditDialogProps) {
  const [note, setNote] = useState("")
  const [externalLink, setExternalLink] = useState("")

  useEffect(() => {
    setNote(initialNote || "")
    setExternalLink(initialLink || "")
  }, [initialNote, initialLink, open])

  const handleSave = () => {
    onSave({ note: note.trim(), externalLink: externalLink.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Song Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="external-link">Chord sheet</Label>
            <Input
              id="external-link"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why did you add this song? Share your thoughts..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
