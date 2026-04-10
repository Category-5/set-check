"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NamePromptDialogProps {
  onNameSet: (name: string) => void
}

export function NamePromptDialog({ onNameSet }: NamePromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    const storedName = sessionStorage.getItem("setcheck_username")
    if (!storedName) {
      setOpen(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      sessionStorage.setItem("setcheck_username", name.trim())
      onNameSet(name.trim())
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Set Check</DialogTitle>
          <DialogDescription>
            Enter your first name to get started. This helps others know who added songs to the playlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your first name</Label>
            <Input
              id="name"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!name.trim()}
          >
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
