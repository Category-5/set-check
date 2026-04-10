"use client"

import { Button } from "@/components/ui/button"
import { GripVertical, Trash2, StickyNote, Music } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatDistanceToNow } from "date-fns"
import { VoteButtons } from "./vote-buttons"
import type { Song } from "@/lib/types"

interface SongItemProps {
  song: Song
  index: number
  currentUser: string | null
  onRemove: () => void
  onClick: () => void
  onNoteClick: () => void
}

export function SongItem({ song, index, currentUser, onRemove, onClick, onNoteClick }: SongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-secondary/50 transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Index */}
      <span className="w-6 text-center text-sm text-muted-foreground">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <button
        onClick={onClick}
        className="shrink-0 w-12 h-12 rounded bg-secondary flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
      >
        {song.thumbnail_url ? (
          <img
            src={song.thumbnail_url}
            alt={song.title}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <Music className="w-6 h-6 text-muted-foreground" />
        )}
      </button>

      {/* Info */}
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <p className="font-medium text-foreground truncate hover:underline">
          {song.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </button>

      {/* Added By & At */}
      <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
        {song.added_by && (
          <span className="font-medium">{song.added_by}</span>
        )}
        <span>{formatDistanceToNow(new Date(song.added_at), { addSuffix: true })}</span>
      </div>

      {/* Vote Buttons */}
      <VoteButtons songId={song.id} currentUser={currentUser} />

      {/* Note Indicator */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onNoteClick()
        }}
        className={`shrink-0 ${song.note ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
      >
        <StickyNote className="w-4 h-4" />
      </Button>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
