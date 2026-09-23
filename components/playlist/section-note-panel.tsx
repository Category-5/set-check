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
  { id: "slate", label: "normal", preview: "bg-rubric" },
  { id: "amber", label: "quiet", preview: "bg-rubric/40" },
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
          <SheetTitle className="font-display text-xl font-semibold">{isCreator ? (note?.id.startsWith("temp_") ? "Add a spoken moment" : "Edit this moment") : note?.title || "Moment"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4">
          {isCreator ? (
            <>
              <div>
                <span className="label mb-2 block">title</span>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Call to worship"
                />
              </div>

              <div>
                <span className="label mb-2 block">icon</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {ICONS.map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setIcon(id)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center border transition-colors",
                        icon === id
                          ? "border-ink bg-ink text-stock"
                          : "border-rule-strong text-muted-foreground hover:bg-sunk hover:text-ink"
                      )}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="label mb-2 block">weight in the order</span>
                <div className="flex gap-2">
                  {COLORS.map(({ id, label, preview }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setColor(id)}
                      aria-pressed={color === id}
                      className={cn(
                        "flex h-10 items-center gap-2 border px-3 text-sm transition-colors",
                        color === id
                          ? "border-ink bg-ink text-stock"
                          : "border-rule-strong text-ink hover:bg-sunk",
                      )}
                    >
                      <span className={cn("block size-3", preview)} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="label mb-2 block">what happens here</span>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Psalm 95:1–3, read together from the screen."
                  className="min-h-[200px]"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl">{note?.title}</h2>
              </div>
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {note?.content ? (
                  <div dangerouslySetInnerHTML={{ __html: note.content }} />
                ) : (
                  <p className="text-muted-foreground">Nothing written here yet.</p>
                )}
              </div>
            </>
          )}
        </div>

        {isCreator && (
          <SheetFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
