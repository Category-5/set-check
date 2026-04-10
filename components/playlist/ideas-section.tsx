"use client"

import { User } from "lucide-react"
import { IdeaSongItem } from "./idea-song-item"
import type { Song } from "@/lib/types"

interface IdeasSectionProps {
  ideasByPerson: Record<string, Song[]>
  playlistId: string
  currentUser: string | null
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
}

export function IdeasSection({
  ideasByPerson,
  playlistId,
  currentUser,
  onSongRemoved,
  onSongUpdated,
  onSongPromoted,
}: IdeasSectionProps) {
  const people = Object.keys(ideasByPerson)
  
  // Sort so current user is first
  const sortedPeople = people.sort((a, b) => {
    if (a === currentUser) return -1
    if (b === currentUser) return 1
    return a.localeCompare(b)
  })

  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center">
        <p className="text-muted-foreground">
          No ideas yet. Add a song to start sharing your picks!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedPeople.map((person) => (
        <div key={person} className="rounded-xl border border-border bg-card/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">
              {person === currentUser ? `${person} (You)` : person}&apos;s Ideas
            </h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {ideasByPerson[person].length}
            </span>
          </div>
          
          <div className="space-y-2">
            {ideasByPerson[person].map((song) => (
              <IdeaSongItem
                key={song.id}
                song={song}
                playlistId={playlistId}
                onSongRemoved={onSongRemoved}
                onSongUpdated={onSongUpdated}
                onSongPromoted={onSongPromoted}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
