"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { PlaylistHeader } from "./playlist-header"
import { SongList } from "./song-list"
import { IdeasSection } from "./ideas-section"
import { AddSongDialog } from "./add-song-dialog"
import { ShareDialog } from "./share-dialog"
import { ExternalLinkDialog } from "./external-link-dialog"
import { NamePromptDialog } from "./name-prompt-dialog"
import type { Playlist, Song } from "@/lib/types"
import { ArrowUp, Home } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

interface PlaylistViewProps {
  playlist: Playlist
  initialSongs: Song[]
}

export function PlaylistView({ playlist: initialPlaylist, initialSongs }: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [songs, setSongs] = useState(initialSongs)
  const [isAddSongOpen, setIsAddSongOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isExternalLinkOpen, setIsExternalLinkOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    const storedName = localStorage.getItem("setcheck_username")
    if (storedName) {
      setCurrentUser(storedName)
    }
  }, [])

  // Track recently viewed playlists in localStorage
  useEffect(() => {
    const RECENT_PLAYLISTS_KEY = "set-check-recent-playlists"
    const MAX_RECENT = 12

    try {
      const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
      const recent = stored ? JSON.parse(stored) : []

      // Remove existing entry for this playlist if present
      const filtered = recent.filter((p: { id: string }) => p.id !== playlist.id)

      // Add current playlist at the beginning
      const updated = [
        {
          id: playlist.id,
          name: playlist.name,
          cover_url: playlist.cover_url,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_RECENT)

      localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(updated))
    } catch {
      // localStorage not available or quota exceeded
    }
  }, [playlist.id, playlist.name, playlist.cover_url])

  // Check if current user is the playlist creator
  // If playlist has no creator set (null), treat the current user as the creator
  const isCreator = useMemo(() => {
    if (currentUser === null) return false
    // If no creator is set, the current user is treated as the creator
    if (playlist.created_by === null) return true
    return currentUser === playlist.created_by
  }, [currentUser, playlist.created_by])

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

  // Get the currently dragged song
  const activeSong = useMemo(() => 
    activeDragId ? songs.find(s => s.id === activeDragId) : null,
    [activeDragId, songs]
  )

  const handleNameSet = (name: string) => {
    setCurrentUser(name)
  }

  const handleSongAdded = (newSong: Song) => {
    setSongs((prev) => [...prev, newSong])
  }

  const handleSongRemoved = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId))
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeSong = songs.find(s => s.id === activeId)
    const overSong = songs.find(s => s.id === overId)

    if (!activeSong) return

    // Check if dropping onto a droppable zone (set or ideas)
    const isOverSet = overId === "set-droppable" || (overSong && overSong.is_promoted)
    const isOverIdeas = overId === "ideas-droppable" || (overSong && !overSong.is_promoted)

    // Only creator can move songs between sections
    if (isCreator && activeSong.is_promoted !== isOverSet) {
      // Moving between sections
      if (isOverSet && !activeSong.is_promoted) {
        // Moving from ideas to set
        const newPosition = promotedSongs.length
        const updatedSong = { ...activeSong, is_promoted: true, position: newPosition }
        
        setSongs(prev => prev.map(s => s.id === activeId ? updatedSong : s))
        
        await supabase
          .from("songs")
          .update({ is_promoted: true, position: newPosition })
          .eq("id", activeId)
      } else if (isOverIdeas && activeSong.is_promoted) {
        // Moving from set to ideas
        const newPosition = songs.filter(s => !s.is_promoted).length
        const updatedSong = { ...activeSong, is_promoted: false, position: newPosition }
        
        setSongs(prev => prev.map(s => s.id === activeId ? updatedSong : s))
        
        await supabase
          .from("songs")
          .update({ is_promoted: false, position: newPosition })
          .eq("id", activeId)
      }
    } else if (overSong && activeSong.is_promoted === overSong.is_promoted) {
      // Reordering within the same section (only for set songs and only for creator)
      if (activeSong.is_promoted && isCreator) {
        const oldIndex = promotedSongs.findIndex(s => s.id === activeId)
        const newIndex = promotedSongs.findIndex(s => s.id === overId)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedSongs = arrayMove(promotedSongs, oldIndex, newIndex)
          
          // Update local state immediately
          setSongs(prev => {
            const ideas = prev.filter(s => !s.is_promoted)
            return [...reorderedSongs.map((s, i) => ({ ...s, position: i })), ...ideas]
          })
          
          // Update database
          const updates = reorderedSongs.map((song, index) => ({
            id: song.id,
            position: index,
          }))

          // Use a single transaction-like approach
          for (const update of updates) {
            await supabase
              .from("songs")
              .update({ position: update.position })
              .eq("id", update.id)
          }
        }
      }
    }
  }, [songs, promotedSongs, isCreator, supabase])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto max-w-4xl px-2 sm:px-4 py-6 sm:py-8">
        {/* Home Button */}
        <div className="flex justify-end mb-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        <NamePromptDialog onNameSet={handleNameSet} />
        
        <PlaylistHeader
          playlist={playlist}
          songCount={promotedSongs.length}
          onPlaylistUpdated={handlePlaylistUpdated}
          onShareClick={() => setIsShareOpen(true)}
          onExternalLinkClick={() => setIsExternalLinkOpen(true)}
        />
        
        {/* The Set - Main promoted songs */}
        <div className="mt-6 sm:mt-8">
          <div className="mb-3 sm:mb-4 flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">The Set</h2>
            <span className="rounded-full bg-orange-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {promotedSongs.length} {promotedSongs.length === 1 ? "song" : "songs"}
            </span>
          </div>
          <div className="rounded-xl border-2 border-orange-500 bg-card/50 p-1.5 sm:p-3">
            <SongList
              songs={promotedSongs}
              playlistId={playlist.id}
              currentUser={currentUser}
              isCreator={isCreator}
              onSongRemoved={handleSongRemoved}
              onSongUpdated={handleSongUpdated}
              showAddButton={false}
              droppableId="set-droppable"
            />
            {promotedSongs.length === 0 && (
              <p className="py-6 sm:py-8 text-center text-sm sm:text-base text-muted-foreground">
                No songs in the set yet. {isCreator ? "Drag songs here or promote from Ideas!" : "Promote songs from Ideas below!"}
              </p>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-card">
            <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Ideas sections - grouped by person */}
        <div className="mt-4 sm:mt-6">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Ideas</h2>
            <button
              onClick={() => setIsAddSongOpen(true)}
              className="rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + Add Song
            </button>
          </div>
          
          <IdeasSection
            ideasByPerson={ideasByPerson}
            playlistId={playlist.id}
            currentUser={currentUser}
            isCreator={isCreator}
            onSongRemoved={handleSongRemoved}
            onSongUpdated={handleSongUpdated}
            onSongPromoted={handleSongPromoted}
            droppableId="ideas-droppable"
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

        <ExternalLinkDialog
          open={isExternalLinkOpen}
          onOpenChange={setIsExternalLinkOpen}
          playlistId={playlist.id}
          currentLink={playlist.external_link}
          onLinkUpdated={(link) => handlePlaylistUpdated({ external_link: link })}
        />
      </div>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeSong && (
          <div className="rounded-lg bg-card shadow-lg p-3 border border-primary">
            <p className="font-medium text-foreground truncate">{activeSong.title}</p>
            <p className="text-sm text-muted-foreground truncate">{activeSong.artist}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
