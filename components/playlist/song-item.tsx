"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2, Music, MoreHorizontal, Share2, Check, FileMusic, Pencil } from "lucide-react"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatDistanceToNow } from "date-fns"
import { VoteButtons } from "./vote-buttons"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"

// Key colors - each musical key gets a distinct color
const KEY_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-red-500", text: "text-white" },
  Bb: { bg: "bg-rose-400", text: "text-white" },
  B: { bg: "bg-orange-500", text: "text-white" },
  C: { bg: "bg-yellow-400", text: "text-yellow-900" },
  D: { bg: "bg-green-500", text: "text-white" },
  Eb: { bg: "bg-emerald-400", text: "text-white" },
  E: { bg: "bg-teal-500", text: "text-white" },
  F: { bg: "bg-blue-500", text: "text-white" },
  G: { bg: "bg-purple-500", text: "text-white" },
}

const KEYS = ["A", "Bb", "B", "C", "D", "Eb", "E", "F", "G"]

interface SongItemProps {
  song: Song
  index: number
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onRemove: () => void
  onClick: () => void
  onEditClick: () => void
  onSongUpdated?: (song: Song) => void
}

export function SongItem({ song, index, playlistId, currentUser, isCreator = false, onRemove, onClick, onEditClick, onSongUpdated }: SongItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentKey, setCurrentKey] = useState(song.song_key || "C")
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/p/${playlistId}?song=${song.id}`
    : ""

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} - ${song.artist}`,
          text: `Check out "${song.title}" by ${song.artist}`,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed, fall back to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleKeyClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const currentIndex = KEYS.indexOf(currentKey)
    const nextIndex = (currentIndex + 1) % KEYS.length
    const nextKey = KEYS[nextIndex]
    
    setCurrentKey(nextKey)
    
    // Update in database
    const { error } = await supabase
      .from("songs")
      .update({ song_key: nextKey })
      .eq("id", song.id)
    
    if (!error && onSongUpdated) {
      onSongUpdated({ ...song, song_key: nextKey })
    }
  }

  const keyColor = KEY_COLORS[currentKey] || KEY_COLORS.C
  
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
      className={`group p-2 sm:p-3 rounded-lg bg-card hover:bg-secondary/50 transition-colors ${
        isDragging ? "opacity-50 shadow-lg z-50" : ""
      }`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Drag Handle - Only show for creator */}
        {isCreator && (
          <button
            {...attributes}
            {...listeners}
            className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Index - Hidden on mobile */}
        <span className="hidden sm:block w-5 text-center text-sm text-muted-foreground">
          {index + 1}
        </span>

        {/* Thumbnail */}
        <button
          onClick={onClick}
          className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded bg-secondary flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all relative"
        >
          {song.thumbnail_url ? (
            <img
              src={song.thumbnail_url}
              alt={song.title}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          )}
          {song.note && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary ring-1 ring-background" />
          )}
        </button>

        {/* Key Badge */}
        <button
          onClick={handleKeyClick}
          className={`shrink-0 px-1 py-0.5 min-w-[1.1rem] rounded text-[10px] sm:text-xs font-bold leading-none flex items-center justify-center transition-all hover:scale-110 hover:shadow-md ${keyColor.bg} ${keyColor.text}`}
          title={`Key: ${currentKey} (click to change)`}
        >
          {currentKey}
        </button>

        {/* Info */}
        <button onClick={onClick} className="flex-1 min-w-0 text-left">
          <p className="font-medium text-sm sm:text-base text-foreground truncate hover:underline">
            {song.title}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</p>
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

          {/* External Link */}
          {song.external_link && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-primary"
              onClick={(e) => {
                e.stopPropagation()
                window.open(song.external_link!, "_blank", "noopener,noreferrer")
              }}
            >
              <FileMusic className="w-4 h-4" />
            </Button>
          )}

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditClick}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy link
                  </>
                )}
              </DropdownMenuItem>
              {isCreator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Song
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Actions Row */}
      <div className="flex sm:hidden items-center justify-between gap-1 mt-2 pt-2 border-t border-border/50">
        {/* Added By - Mobile */}
        <div className="text-xs text-muted-foreground">
          {song.added_by && (
            <span className="font-medium">{song.added_by}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Vote Buttons */}
          <VoteButtons songId={song.id} currentUser={currentUser} />

          {/* External Link */}
          {song.external_link && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-primary"
              onClick={(e) => {
                e.stopPropagation()
                window.open(song.external_link!, "_blank", "noopener,noreferrer")
              }}
            >
              <FileMusic className="w-4 h-4" />
            </Button>
          )}

          {/* More Menu - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditClick}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy link
                  </>
                )}
              </DropdownMenuItem>
              {isCreator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Song
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
