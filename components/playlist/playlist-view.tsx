"use client"

import { useState, useEffect, useMemo } from "react"
import { PlaylistHeader } from "./playlist-header"
import { SongList } from "./song-list"
import { IdeasSection } from "./ideas-section"
import { AddSongDialog } from "./add-song-dialog"
import { ShareDialog } from "./share-dialog"
import { NamePromptDialog } from "./name-prompt-dialog"
import type { Playlist, Song } from "@/lib/types"

interface PlaylistViewProps {
  playlist: Playlist
  initialSongs: Song[]
}

export function PlaylistView({ playlist: initialPlaylist, initialSongs }: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [songs, setSongs] = useState(initialSongs)
  const [isAddSongOpen, setIsAddSongOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    const storedName = localStorage.getItem("setcheck_username")
    if (storedName) {
      setCurrentUser(storedName)
    }
  }, [])

  // Separate promoted songs (the Set) from ideas
  const promotedSongs = useMemo(() => 
    songs.filter((s) => s.is_promoted).sort((a, b) => a.position - b.position),
    [songs]
  )

  // Group ideas by person
  const ideasByPerson = useMemo(() => {
    const ideas = songs.filter((s) => !s.is_promoted)
    const grouped: Record<string, Song[]> = {}
    
    ideas.forEach((song) => {
      const person = song.added_by || "Anonymous"
      if (!grouped[person]) {
        grouped[person] = []
      }
      grouped[person].push(song)
    })
    
    // Sort each person's ideas by position
    Object.keys(grouped).forEach((person) => {
      grouped[person].sort((a, b) => a.position - b.position)
    })
    
    return grouped
  }, [songs])

  const handleNameSet = (name: string) => {
    setCurrentUser(name)
  }

  const handleSongAdded = (newSong: Song) => {
    setSongs((prev) => [...prev, newSong])
  }

  const handleSongRemoved = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId))
  }

  const handleSongsReordered = (newSongs: Song[]) => {
    // Update only the promoted songs positions
    setSongs((prev) => {
      const ideas = prev.filter((s) => !s.is_promoted)
      return [...newSongs, ...ideas]
    })
  }

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)))
  }

  const handleSongPromoted = (promotedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === promotedSong.id ? promotedSong : s)))
  }

  const handlePlaylistUpdated = (updated: Partial<Playlist>) => {
    setPlaylist((prev) => ({ ...prev, ...updated }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <NamePromptDialog onNameSet={handleNameSet} />
      
      <PlaylistHeader
        playlist={playlist}
        songCount={promotedSongs.length}
        onPlaylistUpdated={handlePlaylistUpdated}
        onShareClick={() => setIsShareOpen(true)}
      />
      
      {/* The Set - Main promoted songs */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">The Set</h2>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            {promotedSongs.length} {promotedSongs.length === 1 ? "song" : "songs"}
          </span>
        </div>
        <div className="rounded-xl border-2 border-orange-500 bg-card/50 p-4">
          <SongList
            songs={promotedSongs}
            playlistId={playlist.id}
            currentUser={currentUser}
            onSongRemoved={handleSongRemoved}
            onSongsReordered={handleSongsReordered}
            onSongUpdated={handleSongUpdated}
            showAddButton={false}
          />
          {promotedSongs.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No songs in the set yet. Promote songs from Ideas below!
            </p>
          )}
        </div>
      </div>

      {/* Ideas sections - grouped by person */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Ideas</h2>
          <button
            onClick={() => setIsAddSongOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Add Song
          </button>
        </div>
        
        <IdeasSection
          ideasByPerson={ideasByPerson}
          playlistId={playlist.id}
          currentUser={currentUser}
          onSongRemoved={handleSongRemoved}
          onSongUpdated={handleSongUpdated}
          onSongPromoted={handleSongPromoted}
        />
      </div>

      <AddSongDialog
        open={isAddSongOpen}
        onOpenChange={setIsAddSongOpen}
        playlistId={playlist.id}
        currentPosition={songs.length}
        currentUser={currentUser}
        onSongAdded={handleSongAdded}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        playlist={playlist}
      />
    </div>
  )
}
