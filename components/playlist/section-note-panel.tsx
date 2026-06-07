"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { BookOpen, Book, Cross, Church, HandHeart, Flame, Scroll, Crown, Grape, Wheat, Heart, Music, MicVocal } from "lucide-react"
import type { SectionNote } from "@/lib/types"
import { cn } from "@/lib/utils"

const ICONS = [
  { id: "hand-heart", Icon: HandHeart, label: "Prayer" },
  { id: "book-open", Icon: BookOpen, label: "Scripture" },
  { id: "book", Icon: Book, label: "Bible" },
  { id: "cross", Icon: Cross, label: "Cross" },
  { id: "church", Icon: Church, label: "Church" },
  { id: "flame", Icon: Flame, label: "Holy Spirit" },
  { id: "scroll", Icon: Scroll, label: "Scroll" },
  { id: "crown", Icon: Crown, label: "Crown" },
  { id: "grape", Icon: Grape, label: "Communion" },
  { id: "wheat", Icon: Wheat, label: "Bread" },
  { id: "heart", Icon: Heart, label: "Worship" },
  { id: "music", Icon: Music, label: "Music" },
  { id: "mic-vocal", Icon: MicVocal, label: "Vocal" },
]

const COLORS = [
  { id: "slate", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-600", swatch: "bg-slate-400" },
  { id: "red", bg: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800", swatch: "bg-red-500" },
  { id: "orange", bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-200 dark:border-orange-800", swatch: "bg-orange-500" },
  { id: "amber", bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800", swatch: "bg-amber-500" },
  { id: "green", bg: "bg-green-50 dark:bg-green-950", border: "border-green-200 dark:border-green-800", swatch: "bg-green-500" },
  { id: "teal", bg: "bg-teal-50 dark:bg-teal-950", border: "border-teal-200 dark:border-teal-800", swatch: "bg-teal-500" },
  { id: "blue", bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-200 dark:border-blue-800", swatch: "bg-blue-500" },
  { id: "indigo", bg: "bg-indigo-50 dark:bg-indigo-950", border: "border-indigo-200 dark:border-indigo-800", swatch: "bg-indigo-500" },
  { id: "purple", bg: "bg-purple-50 dark:bg-purple-950", border: "border-purple-200 dark:border-purple-800", swatch: "bg-purple-500" },
  { id: "pink", bg: "bg-pink-50 dark:bg-pink-950", border: "border-pink-200 dark:border-pink-800", swatch: "bg-pink-500" },
]

export { COLORS }

interface SectionNotePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: SectionNote | null
  isCreator: boolean
  onSave: (id: string, updates: { title: string; content: string; icon: string; color: string }) => void
}

export function SectionNotePanel({ open, onOpenChange, note, isCreator, onSave }: SectionNotePanelProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [icon, setIcon] = useState("hand-heart")
  const [color, setColor] = useState("slate")
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setIcon(note.icon)
      setColor(note.color || "slate")
    }
  }, [note, isCreator])

  const handleSave = () => {
    if (!note) return
    onSave(note.id, { title: title.trim() || "Untitled", content, icon, color })
    onOpenChange(false)
  }


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isCreator ? (note?.id.startsWith("temp_") ? "Add Note" : "Edit Note") : "View Note"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4">
          {isCreator ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Opening Prayer, Scripture Reading..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Icon</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {ICONS.map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setIcon(id)}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg border-2 transition-all",
                        icon === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      )}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(({ id, swatch }) => (
                    <button
                      key={id}
                      onClick={() => setColor(id)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        swatch,
                        color === id
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-110"
                      )}
                      title={id}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Content</label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your notes here..."
                  className="min-h-[200px]"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{note?.title}</h2>
              </div>
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {note?.content ? (
                  <div dangerouslySetInnerHTML={{ __html: note.content }} />
                ) : (
                  <p className="text-muted-foreground italic">No content</p>
                )}
              </div>
            </>
          )}
        </div>

        {isCreator && (
          <SheetFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
