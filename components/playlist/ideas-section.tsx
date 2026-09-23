"use client"

import { IdeaSongItem } from "./idea-song-item"
import type { Song } from "@/lib/types"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { IdeaMark } from "@/components/shapes"

interface IdeasSectionProps {
  ideasByPerson: Record<string, Song[]>
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
  droppableId?: string
  onAddSongClick?: () => void
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
  onAddSongClick,
}: IdeasSectionProps) {
  const people = Object.keys(ideasByPerson)

  const { setNodeRef, isOver } = useDroppable({ id: droppableId || "ideas-section" })

  const sortedPeople = [...people].sort((a, b) => {
    if (a === currentUser) return -1
    if (b === currentUser) return 1
    return a.localeCompare(b)
  })

  if (people.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={`rounded-[3px] border border-dashed px-6 py-12 text-center transition-colors ${
          isOver ? "border-ballpoint bg-ballpoint/8" : "border-rule-strong"
        }`}
      >
        {isOver ? (
          <p className="text-sm text-ballpoint">drop here to move back to ideas</p>
        ) : (
          <>
            <span className="mx-auto flex w-fit items-center gap-2">
              <IdeaMark size={12} />
              <IdeaMark size={12} tone="var(--rule-strong)" />
              <IdeaMark size={12} tone="var(--rule-strong)" />
            </span>
            <p className="mx-auto mt-5 max-w-[38ch] text-sm text-muted-foreground">
              No ideas yet. Add a song yourself, or send the link to your team and
              let them bring the first one.
            </p>
            {onAddSongClick && (
              <button
                onClick={onAddSongClick}
                className="mt-5 h-10 cursor-pointer rounded-[3px] border border-rule-strong bg-sheet px-4 text-sm shadow-lift transition-colors hover:border-ballpoint hover:bg-ballpoint hover:text-on-ballpoint"
              >
                Add a song
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? "bg-ballpoint/6 outline outline-1 outline-ballpoint" : ""}`}
    >
      {sortedPeople.map((person) => (
        <section key={person} className="sheet mb-4 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-rule bg-sunk px-3 py-2.5">
            <IdeaMark size={10} />
            <h3 className="text-sm font-medium">
              {person === currentUser ? `${person} — you` : person}
            </h3>
            <span className="ml-auto num text-[0.6875rem] tabular-nums text-muted-foreground">
              {String(ideasByPerson[person].length).padStart(2, "0")}
            </span>
          </div>

          <SortableContext
            items={ideasByPerson[person].map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
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
        </section>
      ))}
    </div>
  )
}
