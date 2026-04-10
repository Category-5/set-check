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
import { Textarea } from "@/components/ui/textarea"
import type { Song } from "@/lib/types"

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  onSave: (note: string) => void
}

export function NoteDialog({ open, onOpenChange, song, onSave }: NoteDialogProps) {
  const [note, setNote] = useState("")

  useEffect(() => {
    if (song) {
      setNote(song.note || "")
    }
  }, [song])

  if (!song) return null

  const handleSave = () => {
    onSave(note.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium text-foreground">{song.title}</p>
            <p className="text-sm text-muted-foreground">{song.artist}</p>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why did you add this song? Share your thoughts..."
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
