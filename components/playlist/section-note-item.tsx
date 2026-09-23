"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Trash2,
  MoreHorizontal,
  BookOpen,
  Book,
  Cross,
  Church,
  HandHeart,
  Flame,
  Scroll,
  Crown,
  Grape,
  Wheat,
  Music,
  MicVocal,
  Heart,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { SectionNote } from "@/lib/types"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "hand-heart": HandHeart,
  "book-open": BookOpen,
  book: Book,
  cross: Cross,
  church: Church,
  flame: Flame,
  scroll: Scroll,
  crown: Crown,
  grape: Grape,
  wheat: Wheat,
  heart: Heart,
  music: Music,
  "mic-vocal": MicVocal,
}

export { ICON_MAP }

interface SectionNoteItemProps {
  note: SectionNote
  isCreator: boolean
  onRemove: () => void
  onClick: () => void
}

export function SectionNoteItem({ note, isCreator, onRemove, onClick }: SectionNoteItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }


  const plainContent = note.content
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim()
  const truncatedContent =
    plainContent.length > 70 ? `${plainContent.slice(0, 70)}…` : plainContent

  return (
    <div
      ref={setNodeRef}
      style={style}
      suppressHydrationWarning
      className={cn(
        "group border-b border-rule bg-rubric-wash transition-opacity last:border-b-0",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center gap-2 px-2 py-2.5 sm:gap-3 sm:px-3">
        <span
          {...(isCreator ? { ...attributes, ...listeners } : {})}
          className={cn("shrink-0 touch-none", isCreator && "cursor-grab active:cursor-grabbing")}
          aria-hidden="true"
        >
          <span className="block h-[1.5px] w-3.5 rounded-full bg-rubric" />
        </span>

        <span className="w-6 shrink-0" aria-hidden="true" />

        <button onClick={onClick} className="min-w-0 flex-1 text-left">
          <span className="font-display block truncate text-sm font-medium italic leading-tight text-rubric sm:text-base">
            {note.title || "Untitled moment"}
          </span>
          {truncatedContent && (
            <span className="block truncate text-xs leading-tight text-muted-foreground">
              {truncatedContent}
            </span>
          )}
        </button>

        {isCreator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions for ${note.title || "this moment"}`}
                className="text-rubric hover:bg-rubric/10"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rubric focus:text-rubric"
              >
                <Trash2 className="mr-2 size-4" />
                Remove moment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {note.title || "this moment"} from the set?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The scripture, prayer, or reading you wrote here will be deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemove}
              className="border border-rubric bg-transparent text-rubric hover:bg-rubric hover:text-primary-foreground"
            >
              Remove moment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
