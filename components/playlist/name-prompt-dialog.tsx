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
    const storedName = localStorage.getItem("setcheck_username")
    if (!storedName) {
      setOpen(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      localStorage.setItem("setcheck_username", name.trim())
      onNameSet(name.trim())
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">What should we call you?</DialogTitle>
          <DialogDescription>
            A first name is all this needs — no account, no email. It goes beside
            the songs you add so your team knows who brought what.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="label">
              first name
            </Label>
            <Input
              id="name"
              placeholder="Ren"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
            continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
