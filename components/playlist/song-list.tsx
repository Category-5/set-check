"use client"

import { useState } from "react"
import { SongItem } from "./song-item"
import { PlatformLinksDialog } from "./platform-links-dialog"
import { NoteDialog } from "./note-dialog"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

interface SongListProps {
  songs: Song[]
  playlistId: string
  onSongRemoved: (songId: string) => void
  onSongsReordered: (songs: Song[]) => void
  onSongUpdated: (song: Song) => void
  onAddSongClick?: () => void
  showAddButton?: boolean
}

export function SongList({
  songs,
  playlistId,
  onSongRemoved,
  onSongsReordered,
  onSongUpdated,
  onAddSongClick,
  showAddButton = true,
}: SongListProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = songs.findIndex((s) => s.id === active.id)
      const newIndex = songs.findIndex((s) => s.id === over.id)

      const newSongs = arrayMove(songs, oldIndex, newIndex)
      onSongsReordered(newSongs)

      // Update positions in database
      const updates = newSongs.map((song, index) => ({
        id: song.id,
        position: index,
      }))

      for (const update of updates) {
        await supabase
          .from("songs")
          .update({ position: update.position })
          .eq("id", update.id)
      }
    }
  }

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

  if (songs.length === 0) {
    return null
  }

  return (
    <>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={songs} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {songs.map((song, index) => (
              <SongItem
                key={song.id}
                song={song}
                index={index}
                onRemove={() => handleRemoveSong(song.id)}
                onClick={() => handleSongClick(song)}
                onNoteClick={() => handleNoteClick(song)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
