"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2, MoreHorizontal, BookOpen, Book, Cross, Church, HandHeart, Flame, Scroll, Crown, Grape, Wheat, Music, MicVocal, Heart } from "lucide-react"
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

const COLOR_STYLES: Record<string, { bg: string; icon: string }> = {
  slate: { bg: "rgba(100,116,139,0.08)", icon: "#64748b" },
  red: { bg: "rgba(239,68,68,0.07)", icon: "#ef4444" },
  orange: { bg: "rgba(249,115,22,0.07)", icon: "#f97316" },
  amber: { bg: "rgba(245,158,11,0.07)", icon: "#f59e0b" },
  green: { bg: "rgba(34,197,94,0.07)", icon: "#22c55e" },
  teal: { bg: "rgba(20,184,166,0.07)", icon: "#14b8a6" },
  blue: { bg: "rgba(59,130,246,0.07)", icon: "#3b82f6" },
  indigo: { bg: "rgba(99,102,241,0.07)", icon: "#6366f1" },
  purple: { bg: "rgba(168,85,247,0.07)", icon: "#a855f7" },
  pink: { bg: "rgba(236,72,153,0.07)", icon: "#ec4899" },
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "hand-heart": HandHeart,
  "book-open": BookOpen,
  "book": Book,
  "cross": Cross,
  "church": Church,
  "flame": Flame,
  "scroll": Scroll,
  "crown": Crown,
  "grape": Grape,
  "wheat": Wheat,
  "heart": Heart,
  "music": Music,
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = ICON_MAP[note.icon] || BookOpen
  const noteColor = note.color && note.color in COLOR_STYLES ? note.color : "slate"
  const colorStyle = COLOR_STYLES[noteColor]

  const plainContent = note.content.replace(/[#*_~`>\-\[\]()]/g, "").trim()
  const truncatedContent = plainContent.length > 60
    ? plainContent.slice(0, 60) + "..."
    : plainContent

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: colorStyle.bg }}
      suppressHydrationWarning
      className={cn(
        "group p-1.5 sm:p-2 rounded-lg transition-colors",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isCreator && (
          <button
            {...attributes}
            {...listeners}
            className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button
          onClick={onClick}
          className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded bg-white/50 dark:bg-black/20 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
          style={{ color: colorStyle.icon }}
        >
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button onClick={onClick} className="flex-1 min-w-0 text-left">
          <p className="font-medium text-xs sm:text-sm text-foreground truncate hover:underline">
            {note.title}
          </p>
          {truncatedContent && (
            <p className="text-xs text-muted-foreground truncate">{truncatedContent}</p>
          )}
        </button>

        {isCreator && (
          <div className="hidden sm:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {isCreator && (
          <div className="flex sm:hidden items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground h-7 w-7"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove note?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{note.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
