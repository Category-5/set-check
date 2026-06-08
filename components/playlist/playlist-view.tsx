"use client"

import { useState, useEffect, useMemo, useCallback, useId } from "react"
import { PlaylistHeader } from "./playlist-header"
import { SongList } from "./song-list"
import { IdeasSection } from "./ideas-section"
import { AddSongDialog } from "./add-song-dialog"
import { ShareDialog } from "./share-dialog"
import { ExternalLinkDialog } from "./external-link-dialog"
import { EditSetlistDialog } from "./edit-setlist-dialog"
import { NamePromptDialog } from "./name-prompt-dialog"
import { PlatformLinksDialog } from "./platform-links-dialog"
import { SectionNotePanel } from "./section-note-panel"
import type { Playlist, Song, SectionNote, SetItem } from "@/lib/types"
import { ArrowUp, Home, Pencil, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RECENT_PLAYLISTS_KEY } from "@/lib/constants"
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
  initialSectionNotes?: SectionNote[]
}

export function PlaylistView({ playlist: initialPlaylist, initialSongs, initialSectionNotes = [] }: PlaylistViewProps) {
  const dndId = useId()
  const [playlist, setPlaylist] = useState(initialPlaylist)
  const [songs, setSongs] = useState(initialSongs)
  const [sectionNotes, setSectionNotes] = useState<SectionNote[]>(initialSectionNotes)
  const [isAddSongOpen, setIsAddSongOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isExternalLinkOpen, setIsExternalLinkOpen] = useState(false)
  const [isEditSetlistOpen, setIsEditSetlistOpen] = useState(false)
  const [showDeletePlaylistConfirm, setShowDeletePlaylistConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [sharedSongDialogOpen, setSharedSongDialogOpen] = useState(false)
  const [sharedSong, setSharedSong] = useState<Song | null>(null)
  const [selectedNote, setSelectedNote] = useState<SectionNote | null>(null)
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

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

  // Handle shared song link - auto-open the song dialog when ?song=id is present
  useEffect(() => {
    const songId = searchParams.get("song")
    if (songId && songs.length > 0) {
      const song = songs.find((s) => s.id === songId)
      if (song) {
        setSharedSong(song)
        setSharedSongDialogOpen(true)
        // Clean up the URL without causing a navigation
        const url = new URL(window.location.href)
        url.searchParams.delete("song")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [searchParams, songs])

  // Track recently viewed playlists in localStorage
  useEffect(() => {
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

  const canEdit = isCreator || playlist.public_edit

  // Separate promoted songs (the Set) from ideas
  const promotedSongs = useMemo(() =>
    songs.filter((s) => s.is_promoted).sort((a, b) => a.position - b.position),
    [songs]
  )

  // Merge promoted songs and section notes into a single ordered set list
  const setItems: SetItem[] = useMemo(() => {
    const songItems: SetItem[] = promotedSongs.map(s => ({ ...s, type: 'song' as const }))
    const noteItems: SetItem[] = sectionNotes.map(n => ({ ...n, type: 'section_note' as const }))
    return [...songItems, ...noteItems].sort((a, b) => a.position - b.position)
  }, [promotedSongs, sectionNotes])

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

  // Get the currently dragged item (song or section note)
  const activeSong = useMemo(() =>
    activeDragId ? songs.find(s => s.id === activeDragId) : null,
    [activeDragId, songs]
  )

  const activeDragItem: SetItem | null = useMemo(() => {
    if (!activeDragId) return null
    return setItems.find(item => item.id === activeDragId) || null
  }, [activeDragId, setItems])

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

  const handleAddSectionNote = () => {
    const tempNote: SectionNote = {
      id: `temp_${Date.now()}`,
      playlist_id: playlist.id,
      title: "",
      content: "",
      icon: "hand-heart",
      color: "slate",
      position: setItems.length,
      created_at: new Date().toISOString(),
      type: 'section_note',
    }
    setSelectedNote(tempNote)
    setIsNotePanelOpen(true)
  }

  const handleSectionNoteRemoved = async (noteId: string) => {
    const res = await fetch(`/api/section-notes?id=${noteId}`, { method: "DELETE" })
    if (res.ok) {
      setSectionNotes(prev => prev.filter(n => n.id !== noteId))
    }
  }

  const handleSectionNoteSave = async (id: string, updates: { title: string; content: string; icon: string; color: string }) => {
    const isNew = id.startsWith("temp_")

    if (isNew) {
      const res = await fetch("/api/section-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlist_id: playlist.id,
          position: setItems.length,
          ...updates,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSectionNotes(prev => [...prev, { ...data, type: 'section_note' }])
      }
    } else {
      const res = await fetch("/api/section-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setSectionNotes(prev => prev.map(n => n.id === id ? { ...data, type: 'section_note' } : n))
      }
    }
  }

  const handleSectionNoteClick = (note: SectionNote) => {
    setSelectedNote(note)
    setIsNotePanelOpen(true)
  }

  const handleDeletePlaylist = async () => {
    setDeleteError(null)
    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlist.id)
      if (error) throw error
      try {
        const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
        if (stored) {
          const recent = JSON.parse(stored) as { id: string }[]
          localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(recent.filter((p) => p.id !== playlist.id)))
        }
      } catch {
        // ignore localStorage errors
      }
      router.push("/")
    } catch (error) {
      console.error("Failed to delete playlist:", error)
      setDeleteError("Something went wrong. Please try again.")
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const reorderSetItems = useCallback(async (activeId: string, overId: string) => {
    const oldIndex = setItems.findIndex(item => item.id === activeId)
    const newIndex = setItems.findIndex(item => item.id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedItems = arrayMove(setItems, oldIndex, newIndex)

    setSongs(prev => {
      const ideas = prev.filter(s => !s.is_promoted)
      const updatedPromoted = prev.filter(s => s.is_promoted).map(s => {
        const idx = reorderedItems.findIndex(item => item.id === s.id)
        return idx !== -1 ? { ...s, position: idx } : s
      })
      return [...updatedPromoted, ...ideas]
    })

    setSectionNotes(prev => prev.map(n => {
      const idx = reorderedItems.findIndex(item => item.id === n.id)
      return idx !== -1 ? { ...n, position: idx } : n
    }))

    for (let i = 0; i < reorderedItems.length; i++) {
      const item = reorderedItems[i]
      if (item.type === 'song') {
        await supabase.from("songs").update({ position: i }).eq("id", item.id)
      } else {
        await supabase.from("section_notes").update({ position: i }).eq("id", item.id)
      }
    }
  }, [setItems, supabase])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeSong = songs.find(s => s.id === activeId)
    const overSong = songs.find(s => s.id === overId)
    const isActiveSetItem = setItems.some(item => item.id === activeId)
    const isOverSetItem = setItems.some(item => item.id === overId) || overId === "set-droppable"

    // Section note being reordered within the set
    if (!activeSong && isActiveSetItem && canEdit) {
      await reorderSetItems(activeId, overId)
      return
    }

    if (!activeSong) return

    // Check if dropping onto a droppable zone (set or ideas)
    const isOverSet = overId === "set-droppable" || (overSong && overSong.is_promoted) || isOverSetItem
    const isOverIdeas = overId === "ideas-droppable" || (overSong && !overSong.is_promoted)

    if (canEdit && activeSong.is_promoted !== isOverSet) {
      if (isOverSet && !activeSong.is_promoted) {
        const newPosition = setItems.length
        const updatedSong = { ...activeSong, is_promoted: true, position: newPosition }

        setSongs(prev => prev.map(s => s.id === activeId ? updatedSong : s))

        await supabase
          .from("songs")
          .update({ is_promoted: true, position: newPosition })
          .eq("id", activeId)
      } else if (isOverIdeas && activeSong.is_promoted) {
        const newPosition = songs.filter(s => !s.is_promoted).length
        const updatedSong = { ...activeSong, is_promoted: false, position: newPosition }

        setSongs(prev => prev.map(s => s.id === activeId ? updatedSong : s))

        await supabase
          .from("songs")
          .update({ is_promoted: false, position: newPosition })
          .eq("id", activeId)
      }
    } else if (activeSong.is_promoted && canEdit) {
      await reorderSetItems(activeId, overId)
    }
  }, [songs, setItems, canEdit, supabase, reorderSetItems])

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto max-w-4xl px-2 sm:px-4 py-6 sm:py-8">
        {/* Top Actions */}
        <div className="flex justify-end gap-2 mb-4">
          {isCreator && (
            <button
              onClick={() => setShowDeletePlaylistConfirm(true)}
              className="flex items-center justify-center rounded-lg bg-secondary w-10 h-10 text-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Delete playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsEditSetlistOpen(true)}
            className="flex items-center justify-center rounded-lg bg-secondary w-10 h-10 text-foreground transition-colors hover:bg-secondary/80"
            aria-label="Edit setlist"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg bg-secondary w-10 h-10 text-foreground transition-colors hover:bg-secondary/80"
            aria-label="Go home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>

        <NamePromptDialog onNameSet={handleNameSet} />
        
        <PlaylistHeader
          playlist={playlist}
          songCount={promotedSongs.length}
          onShareClick={() => setIsShareOpen(true)}
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
              setItems={setItems}
              playlistId={playlist.id}
              currentUser={currentUser}
              isCreator={canEdit}
              onSongRemoved={handleSongRemoved}
              onSongUpdated={handleSongUpdated}
              onSectionNoteClick={handleSectionNoteClick}
              onSectionNoteRemoved={handleSectionNoteRemoved}
              showAddButton={false}
              droppableId="set-droppable"
            />
            {setItems.length === 0 && (
              <p className="py-6 sm:py-8 text-center text-sm sm:text-base text-muted-foreground">
                No songs in the set yet. {canEdit ? "Drag songs here or promote from Ideas!" : "Promote songs from Ideas below!"}
              </p>
            )}
            {canEdit && (
              <button
                onClick={handleAddSectionNote}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card/50 p-2 text-xs sm:text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add a call to worship or scripture or prayer
              </button>
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
            isCreator={canEdit}
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

        <EditSetlistDialog
          open={isEditSetlistOpen}
          onOpenChange={setIsEditSetlistOpen}
          playlist={playlist}
          isCreator={isCreator}
          onPlaylistUpdated={handlePlaylistUpdated}
        />

        <SectionNotePanel
          open={isNotePanelOpen}
          onOpenChange={setIsNotePanelOpen}
          note={selectedNote}
          isCreator={canEdit}
          onSave={handleSectionNoteSave}
        />

        {/* Dialog for shared song links */}
        <PlatformLinksDialog
          open={sharedSongDialogOpen}
          onOpenChange={setSharedSongDialogOpen}
          song={sharedSong}
          playlistId={playlist.id}
        />
      </div>

      <AlertDialog open={showDeletePlaylistConfirm} onOpenChange={(open) => { setShowDeletePlaylistConfirm(open); if (!open) setDeleteError(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{playlist.name}&quot;? This will permanently remove the playlist and all its songs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeDragItem && (
          <div className="rounded-lg bg-card shadow-lg p-3 border border-primary">
            <p className="font-medium text-foreground truncate">{activeDragItem.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {activeDragItem.type === 'song' ? activeDragItem.artist : activeDragItem.content.slice(0, 40)}
            </p>
          </div>
        )}
        {activeSong && !activeDragItem && (
          <div className="rounded-lg bg-card shadow-lg p-3 border border-primary">
            <p className="font-medium text-foreground truncate">{activeSong.title}</p>
            <p className="text-sm text-muted-foreground truncate">{activeSong.artist}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
