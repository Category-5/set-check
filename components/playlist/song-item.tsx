"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2, MessageCircle, Music } from "lucide-react"
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
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatDistanceToNow } from "date-fns"
import { VoteButtons } from "./vote-buttons"
import type { Song } from "@/lib/types"

interface SongItemProps {
  song: Song
  index: number
  currentUser: string | null
  isCreator?: boolean
  onRemove: () => void
  onClick: () => void
  onNoteClick: () => void
}

export function SongItem({ song, index, currentUser, isCreator = false, onRemove, onClick, onNoteClick }: SongItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
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
      className={`group p-3 rounded-lg bg-card hover:bg-secondary/50 transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Index - Hidden on mobile */}
        <span className="hidden sm:block w-6 text-center text-sm text-muted-foreground">
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

        {/* Added By & At - Hidden on mobile */}
        <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
          {song.added_by && (
            <span className="font-medium">{song.added_by}</span>
          )}
          <span>{formatDistanceToNow(new Date(song.added_at), { addSuffix: true })}</span>
        </div>

        {/* Actions - Hidden on mobile, shown on desktop */}
        <div className="hidden sm:flex items-center gap-1">
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
            className={`shrink-0 relative ${song.note ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
          >
            <MessageCircle className="w-4 h-4" />
            {song.note && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* Remove - only shown to creator */}
          {isCreator && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Actions Row */}
      <div className="flex sm:hidden items-center justify-end gap-1 mt-2 pt-2 border-t border-border/50">
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
          className={`shrink-0 relative ${song.note ? "text-primary" : "text-muted-foreground"}`}
        >
          <MessageCircle className="w-4 h-4" />
          {song.note && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>

        {/* Remove - only shown to creator */}
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove song?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{song.title}&quot; from the playlist? This action cannot be undone.
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
