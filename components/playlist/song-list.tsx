"use client"

import { useState } from "react"
import { SongItem } from "./song-item"
import { PlatformLinksDialog } from "./platform-links-dialog"
import { NoteDialog } from "./note-dialog"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"

interface SongListProps {
  songs: Song[]
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onAddSongClick?: () => void
  showAddButton?: boolean
  droppableId?: string
}

export function SongList({
  songs,
  playlistId,
  currentUser,
  isCreator = false,
  onSongRemoved,
  onSongUpdated,
  onAddSongClick,
  showAddButton = true,
  droppableId,
}: SongListProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const supabase = createClient()

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId || "song-list",
  })

  const handleRemoveSong = async (songId: string) => {
    const { error } = await supabase.from("songs").delete().eq("id", songId)

    if (!error) {
      onSongRemoved(songId)
    }
  }

  const handleSongClick = (song: Song) => {
    setSelectedSong(song)
    setIsPlatformDialogOpen(true)
  }

  const handleNoteClick = (song: Song) => {
    setSelectedSong(song)
    setIsNoteDialogOpen(true)
  }

  const handleNoteSave = async (note: string) => {
    if (!selectedSong) return

    const { error } = await supabase
      .from("songs")
      .update({ note: note || null })
      .eq("id", selectedSong.id)

    if (!error) {
      onSongUpdated({ ...selectedSong, note: note || null })
    }
    setIsNoteDialogOpen(false)
  }

  return (
    <>
      <div 
        ref={setNodeRef}
        className={`min-h-[60px] transition-colors rounded-lg ${isOver ? "bg-primary/10 ring-2 ring-primary ring-dashed" : ""}`}
      >
        <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5 sm:space-y-2">
            {songs.map((song, index) => (
              <SongItem
                key={song.id}
                song={song}
                index={index}
                currentUser={currentUser}
                isCreator={isCreator}
                onRemove={() => handleRemoveSong(song.id)}
                onClick={() => handleSongClick(song)}
                onNoteClick={() => handleNoteClick(song)}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <PlatformLinksDialog
        open={isPlatformDialogOpen}
        onOpenChange={setIsPlatformDialogOpen}
        song={selectedSong}
      />

      <NoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        note={selectedSong?.note || ""}
        onSave={handleNoteSave}
      />
    </>
  )
}
