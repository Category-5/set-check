"use client"

import { User } from "lucide-react"
import { IdeaSongItem } from "./idea-song-item"
import type { Song } from "@/lib/types"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

interface IdeasSectionProps {
  ideasByPerson: Record<string, Song[]>
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
  droppableId?: string
}

export function IdeasSection({
  ideasByPerson,
  playlistId,
  currentUser,
  isCreator = false,
  onSongRemoved,
  onSongUpdated,
  onSongPromoted,
  droppableId,
}: IdeasSectionProps) {
  const people = Object.keys(ideasByPerson)
  
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId || "ideas-section",
  })
  
  // Sort so current user is first
  const sortedPeople = people.sort((a, b) => {
    if (a === currentUser) return -1
    if (b === currentUser) return 1
    return a.localeCompare(b)
  })

  if (people.length === 0) {
    return (
      <div 
        ref={setNodeRef}
        className={`rounded-xl border border-dashed bg-card/30 p-6 sm:p-8 text-center transition-colors ${isOver ? "border-primary bg-primary/10" : "border-border"}`}
      >
        <p className="text-sm sm:text-base text-muted-foreground">
          {isOver ? "Drop here to move to Ideas" : "No ideas yet. Add a song to start sharing your picks!"}
        </p>
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-4 sm:space-y-6 rounded-xl transition-colors ${isOver ? "ring-2 ring-primary ring-dashed bg-primary/5" : ""}`}
    >
      {sortedPeople.map((person) => (
        <div key={person} className="rounded-xl border border-border bg-card/30 p-2 sm:p-4">
          <div className="mb-2 sm:mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-accent">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              {person === currentUser ? `${person} (You)` : person}&apos;s Ideas
            </h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {ideasByPerson[person].length}
            </span>
          </div>
          
          <SortableContext items={ideasByPerson[person].map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5 sm:space-y-2">
              {ideasByPerson[person].map((song) => (
                <IdeaSongItem
                  key={song.id}
                  song={song}
                  playlistId={playlistId}
                  currentUser={currentUser}
                  isCreator={isCreator}
                  onSongRemoved={onSongRemoved}
                  onSongUpdated={onSongUpdated}
                  onSongPromoted={onSongPromoted}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      ))}
    </div>
  )
}
