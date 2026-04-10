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

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: string
  onSave: (note: string) => void
}

export function NoteDialog({ open, onOpenChange, note: initialNote, onSave }: NoteDialogProps) {
  const [note, setNote] = useState("")

  useEffect(() => {
    setNote(initialNote || "")
  }, [initialNote, open])

  const handleSave = () => {
    onSave(note.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
