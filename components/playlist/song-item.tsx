"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, MoreHorizontal, Share2, Check, FileMusic, Pencil } from "lucide-react"
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
  onDemote?: () => void
  justPromoted?: boolean
}

export function SongItem({
  song,
  index,
  playlistId,
  currentUser,
  isCreator = false,
  onRemove,
  onClick,
  onEditClick,
  onSongUpdated,
  onDemote,
  justPromoted = false,
}: SongItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentKey, setCurrentKey] = useState(song.song_key || "C")
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const shareUrl =
    typeof window !== "undefined"
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
        return
      } catch {
      }
    }
    handleCopy()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextKey = KEYS[(KEYS.indexOf(currentKey) + 1) % KEYS.length]
    setCurrentKey(nextKey)

    const { error } = await supabase
      .from("songs")
      .update({ song_key: nextKey })
      .eq("id", song.id)

    if (!error && onSongUpdated) {
      onSongUpdated({ ...song, song_key: nextKey })
    }
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: song.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const menu = (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={onEditClick}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit note &amp; link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleShare}>
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-ballpoint" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Copy link
          </>
        )}
      </DropdownMenuItem>
      {isCreator && onDemote && (
        <DropdownMenuItem onClick={onDemote}>
          <svg viewBox="0 0 24 24" className="mr-2 size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Move back to ideas
        </DropdownMenuItem>
      )}
      {isCreator && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="text-rubric focus:text-rubric"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from set
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border-b border-rule bg-stock transition-colors last:border-b-0 hover:bg-sunk ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-2 px-2 py-2.5 sm:items-center sm:gap-3 sm:px-3">
        <span
          {...(isCreator ? { ...attributes, ...listeners } : {})}
          className={`mt-1 block size-3.5 shrink-0 touch-none sm:mt-0 ${
            justPromoted ? "animate-promote" : "rounded-full bg-rubric"
          } ${isCreator ? "cursor-grab active:cursor-grabbing" : ""}`}
          aria-hidden="true"
        />

        <span className="mt-0.5 w-6 shrink-0 num text-[0.6875rem] tabular-nums text-muted-foreground sm:mt-0">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <button
            onClick={onClick}
            className="block w-full min-w-0 text-left"
            aria-label={`Open links for ${song.title}`}
          >
            <span className="flex items-center gap-2">
              <span className="font-display truncate text-sm font-medium leading-tight sm:text-base">{song.title}</span>
              {song.note && (
                <span className="label shrink-0 border border-rule px-1 py-0.5 leading-none">
                  note
                </span>
              )}
            </span>
            <span className="block truncate text-xs leading-tight text-muted-foreground sm:text-sm">
              {song.artist}
              {song.added_by && <span className="sm:hidden"> · {song.added_by}</span>}
            </span>
          </button>

          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <button
              onClick={handleKeyClick}
              className="num h-9 w-10 shrink-0 rounded-[2px] border border-rule text-xs text-muted-foreground transition-colors hover:border-ink hover:text-ink"
              aria-label={`Key of ${currentKey}. Change key.`}
            >
              {currentKey}
            </button>
            <VoteButtons songId={song.id} currentUser={currentUser} />
            {song.external_link && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-rubric"
                aria-label="Open attached link"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(song.external_link!, "_blank", "noopener,noreferrer")
                }}
              >
                <FileMusic className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${song.title}`}
                  className="ml-auto text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {menu}
            </DropdownMenu>
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <button
            onClick={handleKeyClick}
            className="num h-8 w-9 shrink-0 rounded-[2px] border border-rule text-xs text-muted-foreground transition-colors hover:border-ink hover:text-ink"
            title={`Key of ${currentKey} — tap to change`}
            aria-label={`Key of ${currentKey}. Change key.`}
          >
            {currentKey}
          </button>

          <span className="flex w-20 flex-col items-end whitespace-nowrap text-xs leading-tight text-muted-foreground">
            {song.added_by && <span className="max-w-full truncate">{song.added_by}</span>}
            <span className="num text-[0.625rem]">
              {formatDistanceToNow(new Date(song.added_at), { addSuffix: true })}
            </span>
          </span>

          <VoteButtons songId={song.id} currentUser={currentUser} />

          {song.external_link && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-rubric"
              aria-label="Open attached link"
              onClick={(e) => {
                e.stopPropagation()
                window.open(song.external_link!, "_blank", "noopener,noreferrer")
              }}
            >
              <FileMusic className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions for ${song.title}`}
                className="text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {menu}
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {song.title} from the set?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the song from this setlist entirely. To keep it around
              for later, move it back to ideas instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemove}
              className="border border-rubric bg-transparent text-rubric hover:bg-rubric hover:text-primary-foreground"
            >
              Remove song
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
