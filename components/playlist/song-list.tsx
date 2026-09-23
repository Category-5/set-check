"use client"

import { useState } from "react"
import { SongItem } from "./song-item"
import { SectionNoteItem } from "./section-note-item"
import { PlatformLinksDialog } from "./platform-links-dialog"
import { SongEditDialog } from "./song-edit-dialog"
import { createClient } from "@/lib/supabase/client"
import type { Song, SectionNote, SetItem } from "@/lib/types"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"

interface SongListProps {
  songs: Song[]
  setItems?: SetItem[]
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongDemoted?: (song: Song) => void
  onSectionNoteClick?: (note: SectionNote) => void
  onSectionNoteRemoved?: (noteId: string) => void
  onAddSongClick?: () => void
  showAddButton?: boolean
  droppableId?: string
  recentlyPromotedId?: string | null
}

export function SongList({
  songs,
  setItems,
  playlistId,
  currentUser,
  isCreator = false,
  onSongRemoved,
  onSongUpdated,
  onSongDemoted,
  onSectionNoteClick,
  onSectionNoteRemoved,
  droppableId,
  recentlyPromotedId,
}: SongListProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const supabase = createClient()

  const { setNodeRef, isOver } = useDroppable({ id: droppableId || "song-list" })

  const handleRemoveSong = async (songId: string) => {
    const { error } = await supabase.from("songs").delete().eq("id", songId)
    if (!error) onSongRemoved(songId)
  }

  const handleDemote = async (song: Song) => {
    const ideaCount = songs.filter((s) => !s.is_promoted).length
    const { error } = await supabase
      .from("songs")
      .update({ is_promoted: false, position: ideaCount })
      .eq("id", song.id)
    if (!error) {
      onSongDemoted?.({ ...song, is_promoted: false, position: ideaCount })
    }
  }

  const handleSongClick = (song: Song) => {
    setSelectedSong(song)
    setIsPlatformDialogOpen(true)
  }

  const handleEditClick = (song: Song) => {
    setSelectedSong(song)
    setIsEditDialogOpen(true)
  }

  const handleEditSave = async (data: { note: string; externalLink: string }) => {
    if (!selectedSong) return

    const { error } = await supabase
      .from("songs")
      .update({ note: data.note || null, external_link: data.externalLink || null })
      .eq("id", selectedSong.id)

    if (!error) {
      onSongUpdated({
        ...selectedSong,
        note: data.note || null,
        external_link: data.externalLink || null,
      })
    }
    setIsEditDialogOpen(false)
  }

  const itemsToRender = setItems || songs.map((s) => ({ ...s, type: "song" as const }))
  const sortableIds = itemsToRender.map((item) => item.id)

  let songIndex = 0

  return (
    <>
      <div
        ref={setNodeRef}
        className={`transition-colors ${isOver ? "bg-rubric/6 outline outline-1 outline-rubric" : ""}`}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div>
            {itemsToRender.map((item) => {
              if (item.type === "section_note") {
                return (
                  <SectionNoteItem
                    key={item.id}
                    note={item}
                    isCreator={isCreator}
                    onRemove={() => onSectionNoteRemoved?.(item.id)}
                    onClick={() => onSectionNoteClick?.(item)}
                  />
                )
              }
              const currentSongIndex = songIndex++
              return (
                <SongItem
                  key={item.id}
                  song={item}
                  index={currentSongIndex}
                  playlistId={playlistId}
                  currentUser={currentUser}
                  isCreator={isCreator}
                  justPromoted={recentlyPromotedId === item.id}
                  onRemove={() => handleRemoveSong(item.id)}
                  onClick={() => handleSongClick(item)}
                  onEditClick={() => handleEditClick(item)}
                  onSongUpdated={onSongUpdated}
                  onDemote={onSongDemoted ? () => handleDemote(item) : undefined}
                />
              )
            })}
          </div>
        </SortableContext>
      </div>

      <PlatformLinksDialog
        open={isPlatformDialogOpen}
        onOpenChange={setIsPlatformDialogOpen}
        song={selectedSong}
        playlistId={playlistId}
        onNoteSave={async (note) => {
          if (!selectedSong) return
          const { error } = await supabase
            .from("songs")
            .update({ note: note || null })
            .eq("id", selectedSong.id)
          if (!error) {
            const updated = { ...selectedSong, note: note || null }
            setSelectedSong(updated)
            onSongUpdated(updated)
          }
        }}
      />

      <SongEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        note={selectedSong?.note || ""}
        externalLink={selectedSong?.external_link || ""}
        onSave={handleEditSave}
      />
    </>
  )
}
