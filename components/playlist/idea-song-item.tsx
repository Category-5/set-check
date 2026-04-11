"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowUp, Music, MoreHorizontal, Trash2, MessageCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { PlatformLinksDialog } from "./platform-links-dialog"
import { NoteDialog } from "./note-dialog"
import { VoteButtons } from "./vote-buttons"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"

interface IdeaSongItemProps {
  song: Song
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
}

export function IdeaSongItem({
  song,
  playlistId,
  currentUser,
  isCreator = false,
  onSongRemoved,
  onSongUpdated,
  onSongPromoted,
}: IdeaSongItemProps) {
  const [isLinksOpen, setIsLinksOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()

  const handlePromote = async () => {
    setIsPromoting(true)
    try {
      // Get current max position of promoted songs
      const { data: maxPositionData } = await supabase
        .from("songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .eq("is_promoted", true)
        .order("position", { ascending: false })
        .limit(1)
        .single()

      const newPosition = (maxPositionData?.position ?? -1) + 1

      const { error } = await supabase
        .from("songs")
        .update({ is_promoted: true, position: newPosition })
        .eq("id", song.id)

      if (error) throw error
      
      onSongPromoted({ ...song, is_promoted: true, position: newPosition })
    } catch (error) {
      console.error("Failed to promote song:", error)
    } finally {
      setIsPromoting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("songs").delete().eq("id", song.id)
      if (error) throw error
      onSongRemoved(song.id)
    } catch (error) {
      console.error("Failed to delete song:", error)
    }
  }

  const handleNoteUpdate = async (note: string) => {
    try {
      const { error } = await supabase
        .from("songs")
        .update({ note })
        .eq("id", song.id)

      if (error) throw error
      onSongUpdated({ ...song, note })
    } catch (error) {
      console.error("Failed to update note:", error)
    }
  }

  const addedAt = new Date(song.added_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  // Check if the current user is the one who added this song
  const canRemove = currentUser && song.added_by === currentUser

  return (
    <>
      <div className="group rounded-lg bg-card hover:bg-secondary/50 transition-colors p-3">
        {/* Main Row */}
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <button
            onClick={() => setIsLinksOpen(true)}
            className="shrink-0 w-12 h-12 rounded bg-secondary flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
          >
            {song.thumbnail_url ? (
              <Image
                src={song.thumbnail_url}
                alt={song.title}
                fill
                className="object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </button>

          {/* Song info */}
          <button
            onClick={() => setIsLinksOpen(true)}
            className="flex-1 min-w-0 text-left"
          >
            <p className="font-medium text-foreground truncate hover:underline">{song.title}</p>
            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          </button>

          {/* Added at - Hidden on mobile */}
          <span className="hidden sm:block text-xs text-muted-foreground">{addedAt}</span>

          {/* Actions - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Vote Buttons */}
            <VoteButtons songId={song.id} currentUser={currentUser} />

            {/* Note indicator */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNoteOpen(true)}
              className={`shrink-0 relative ${song.note ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
            >
              <MessageCircle className="h-4 w-4" />
              {song.note && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>

            {/* Promote button - only shown to creator */}
            {isCreator && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePromote}
                disabled={isPromoting}
                className="gap-1 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="hidden sm:inline">Promote</span>
              </Button>
            )}

            {/* Remove - only shown to the user who added the song */}
            {canRemove && (
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

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsLinksOpen(true)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open links
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsNoteOpen(true)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {song.note ? "Edit note" : "Add note"}
                </DropdownMenuItem>
                {canRemove && (
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Actions Row */}
        <div className="flex sm:hidden items-center justify-end gap-1 mt-2 pt-2 border-t border-border/50">
          {/* Vote Buttons */}
          <VoteButtons songId={song.id} currentUser={currentUser} />

          {/* Note indicator */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNoteOpen(true)}
            className={`shrink-0 relative ${song.note ? "text-primary" : "text-muted-foreground"}`}
          >
            <MessageCircle className="h-4 w-4" />
            {song.note && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* Promote button - only shown to creator */}
          {isCreator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePromote}
              disabled={isPromoting}
              className="gap-1 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}

          {/* Remove - only shown to the user who added the song */}
          {canRemove && (
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

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsLinksOpen(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open links
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsNoteOpen(true)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {song.note ? "Edit note" : "Add note"}
              </DropdownMenuItem>
              {canRemove && (
                <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
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
              Are you sure you want to remove &quot;{song.title}&quot; from your ideas? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlatformLinksDialog
        open={isLinksOpen}
        onOpenChange={setIsLinksOpen}
        song={song}
      />

      <NoteDialog
        open={isNoteOpen}
        onOpenChange={setIsNoteOpen}
        note={song.note || ""}
        onSave={handleNoteUpdate}
      />
    </>
  )
}
