"use client"

import { useState } from "react"
import { PlaylistHeader } from "./playlist-header"
import { SongList } from "./song-list"
import { AddSongDialog } from "./add-song-dialog"
import { ShareDialog } from "./share-dialog"
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

  const handleSongAdded = (newSong: Song) => {
    setSongs((prev) => [...prev, newSong])
  }

  const handleSongRemoved = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId))
  }

  const handleSongsReordered = (newSongs: Song[]) => {
    setSongs(newSongs)
  }

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)))
  }

  const handlePlaylistUpdated = (updated: Partial<Playlist>) => {
    setPlaylist((prev) => ({ ...prev, ...updated }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PlaylistHeader
        playlist={playlist}
        songCount={songs.length}
        onPlaylistUpdated={handlePlaylistUpdated}
        onShareClick={() => setIsShareOpen(true)}
      />
      
      <div className="mt-8">
        <SongList
          songs={songs}
          playlistId={playlist.id}
          onSongRemoved={handleSongRemoved}
          onSongsReordered={handleSongsReordered}
          onSongUpdated={handleSongUpdated}
          onAddSongClick={() => setIsAddSongOpen(true)}
        />
      </div>

      <AddSongDialog
        open={isAddSongOpen}
        onOpenChange={setIsAddSongOpen}
        playlistId={playlist.id}
        currentPosition={songs.length}
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
