"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowUp, Music, MoreHorizontal, Trash2, StickyNote, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlatformLinksDialog } from "./platform-links-dialog"
import { NoteDialog } from "./note-dialog"
import { VoteButtons } from "./vote-buttons"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"

interface IdeaSongItemProps {
  song: Song
  playlistId: string
  currentUser: string | null
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
}

export function IdeaSongItem({
  song,
  playlistId,
  currentUser,
  onSongRemoved,
  onSongUpdated,
  onSongPromoted,
}: IdeaSongItemProps) {
  const [isLinksOpen, setIsLinksOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
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

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
        {/* Thumbnail */}
        <button
          onClick={() => setIsLinksOpen(true)}
          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted"
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
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium text-foreground">{song.title}</p>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
        </button>

        {/* Added at */}
        <span className="hidden text-xs text-muted-foreground sm:block">{addedAt}</span>

        {/* Vote Buttons */}
        <VoteButtons songId={song.id} currentUser={currentUser} />

        {/* Note indicator */}
        {song.note && (
          <button
            onClick={() => setIsNoteOpen(true)}
            className="rounded-full p-1 text-primary hover:bg-primary/10"
            title="Has note"
          >
            <StickyNote className="h-4 w-4" />
          </button>
        )}

        {/* Promote button */}
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
              <StickyNote className="mr-2 h-4 w-4" />
              {song.note ? "Edit note" : "Add note"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
