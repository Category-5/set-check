"use client"

import { useState, useEffect, useMemo, useCallback, useId, useRef } from "react"
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
import { Wordmark } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { SetMark, IdeaMark, RubricMark } from "@/components/shapes"
import type { Playlist, Song, SectionNote, SetItem } from "@/lib/types"
import { Pencil, Trash2, Plus } from "lucide-react"
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

export function PlaylistView({
  playlist: initialPlaylist,
  initialSongs,
  initialSectionNotes = [],
}: PlaylistViewProps) {
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
  const [recentlyPromotedId, setRecentlyPromotedId] = useState<string | null>(null)
  const announceRef = useRef<HTMLParagraphElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => {
    const storedName = localStorage.getItem("setcheck_username")
    if (storedName) setCurrentUser(storedName)
  }, [])

  useEffect(() => {
    const songId = searchParams.get("song")
    if (songId && songs.length > 0) {
      const song = songs.find((s) => s.id === songId)
      if (song) {
        setSharedSong(song)
        setSharedSongDialogOpen(true)
        const url = new URL(window.location.href)
        url.searchParams.delete("song")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [searchParams, songs])

  useEffect(() => {
    const MAX_RECENT = 12
    try {
      const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
      const recent = stored ? JSON.parse(stored) : []
      const filtered = recent.filter((p: { id: string }) => p.id !== playlist.id)
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
    }
  }, [playlist.id, playlist.name, playlist.cover_url])

  const isCreator = useMemo(() => {
    if (currentUser === null) return false
    if (playlist.created_by === null) return true
    return currentUser === playlist.created_by
  }, [currentUser, playlist.created_by])

  const canEdit = isCreator || playlist.public_edit

  const promotedSongs = useMemo(
    () => songs.filter((s) => s.is_promoted).sort((a, b) => a.position - b.position),
    [songs],
  )

  const setItems: SetItem[] = useMemo(() => {
    const songItems: SetItem[] = promotedSongs.map((s) => ({ ...s, type: "song" as const }))
    const noteItems: SetItem[] = sectionNotes.map((n) => ({ ...n, type: "section_note" as const }))
    return [...songItems, ...noteItems].sort((a, b) => a.position - b.position)
  }, [promotedSongs, sectionNotes])

  const ideasByPerson = useMemo(() => {
    const ideas = songs.filter((s) => !s.is_promoted)
    const grouped: Record<string, Song[]> = {}
    ideas.forEach((song) => {
      const person = song.added_by || "Anonymous"
      if (!grouped[person]) grouped[person] = []
      grouped[person].push(song)
    })
    Object.keys(grouped).forEach((person) => {
      grouped[person].sort((a, b) => a.position - b.position)
    })
    return grouped
  }, [songs])

  const ideaCount = useMemo(() => songs.filter((s) => !s.is_promoted).length, [songs])

  const activeSong = useMemo(
    () => (activeDragId ? songs.find((s) => s.id === activeDragId) : null),
    [activeDragId, songs],
  )

  const activeDragItem: SetItem | null = useMemo(() => {
    if (!activeDragId) return null
    return setItems.find((item) => item.id === activeDragId) || null
  }, [activeDragId, setItems])

  const announce = useCallback((message: string) => {
    if (announceRef.current) announceRef.current.textContent = message
  }, [])

  const markPromoted = useCallback(
    (song: Song) => {
      setRecentlyPromotedId(song.id)
      announce(`${song.title} moved into the set.`)
      setTimeout(() => setRecentlyPromotedId(null), 900)
    },
    [announce],
  )

  const handleNameSet = (name: string) => setCurrentUser(name)

  const handleSongAdded = (newSong: Song) => setSongs((prev) => [...prev, newSong])

  const handleSongRemoved = (songId: string) =>
    setSongs((prev) => prev.filter((s) => s.id !== songId))

  const handleSongUpdated = (updatedSong: Song) =>
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)))

  const handleSongPromoted = (promotedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === promotedSong.id ? promotedSong : s)))
    markPromoted(promotedSong)
  }

  const handleSongDemoted = (demotedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === demotedSong.id ? demotedSong : s)))
    announce(`${demotedSong.title} moved back to ideas.`)
  }

  const handlePlaylistUpdated = (updated: Partial<Playlist>) =>
    setPlaylist((prev) => ({ ...prev, ...updated }))

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
      type: "section_note",
    }
    setSelectedNote(tempNote)
    setIsNotePanelOpen(true)
  }

  const handleSectionNoteRemoved = async (noteId: string) => {
    const res = await fetch(`/api/section-notes?id=${noteId}`, { method: "DELETE" })
    if (res.ok) setSectionNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  const handleSectionNoteSave = async (
    id: string,
    updates: { title: string; content: string; icon: string; color: string },
  ) => {
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
        setSectionNotes((prev) => [...prev, { ...data, type: "section_note" }])
      }
    } else {
      const res = await fetch("/api/section-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setSectionNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...data, type: "section_note" } : n)),
        )
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
          localStorage.setItem(
            RECENT_PLAYLISTS_KEY,
            JSON.stringify(recent.filter((p) => p.id !== playlist.id)),
          )
        }
      } catch {
      }
      router.push("/")
    } catch (error) {
      console.error("Failed to delete playlist:", error)
      setDeleteError("The setlist could not be deleted. Check your connection and try again.")
    }
  }

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string)

  const reorderSetItems = useCallback(
    async (activeId: string, overId: string) => {
      const oldIndex = setItems.findIndex((item) => item.id === activeId)
      const newIndex = setItems.findIndex((item) => item.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedItems = arrayMove(setItems, oldIndex, newIndex)

      setSongs((prev) => {
        const ideas = prev.filter((s) => !s.is_promoted)
        const updatedPromoted = prev
          .filter((s) => s.is_promoted)
          .map((s) => {
            const idx = reorderedItems.findIndex((item) => item.id === s.id)
            return idx !== -1 ? { ...s, position: idx } : s
          })
        return [...updatedPromoted, ...ideas]
      })

      setSectionNotes((prev) =>
        prev.map((n) => {
          const idx = reorderedItems.findIndex((item) => item.id === n.id)
          return idx !== -1 ? { ...n, position: idx } : n
        }),
      )

      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i]
        if (item.type === "song") {
          await supabase.from("songs").update({ position: i }).eq("id", item.id)
        } else {
          await supabase.from("section_notes").update({ position: i }).eq("id", item.id)
        }
      }
    },
    [setItems, supabase],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragId(null)

      if (!over || active.id === over.id) return

      const activeId = active.id as string
      const overId = over.id as string

      const draggedSong = songs.find((s) => s.id === activeId)
      const overSong = songs.find((s) => s.id === overId)
      const isActiveSetItem = setItems.some((item) => item.id === activeId)
      const isOverSetItem = setItems.some((item) => item.id === overId) || overId === "set-droppable"

      if (!draggedSong && isActiveSetItem && canEdit) {
        await reorderSetItems(activeId, overId)
        return
      }

      if (!draggedSong) return

      const isOverSet = overId === "set-droppable" || (overSong && overSong.is_promoted) || isOverSetItem
      const isOverIdeas = overId === "ideas-droppable" || (overSong && !overSong.is_promoted)

      if (canEdit && draggedSong.is_promoted !== isOverSet) {
        if (isOverSet && !draggedSong.is_promoted) {
          const newPosition = setItems.length
          const updatedSong = { ...draggedSong, is_promoted: true, position: newPosition }
          setSongs((prev) => prev.map((s) => (s.id === activeId ? updatedSong : s)))
          markPromoted(updatedSong)
          await supabase
            .from("songs")
            .update({ is_promoted: true, position: newPosition })
            .eq("id", activeId)
        } else if (isOverIdeas && draggedSong.is_promoted) {
          const newPosition = songs.filter((s) => !s.is_promoted).length
          const updatedSong = { ...draggedSong, is_promoted: false, position: newPosition }
          setSongs((prev) => prev.map((s) => (s.id === activeId ? updatedSong : s)))
          announce(`${draggedSong.title} moved back to ideas.`)
          await supabase
            .from("songs")
            .update({ is_promoted: false, position: newPosition })
            .eq("id", activeId)
        }
      } else if (draggedSong.is_promoted && canEdit) {
        await reorderSetItems(activeId, overId)
      }
    },
    [songs, setItems, canEdit, supabase, reorderSetItems, markPromoted, announce],
  )

  const spokenCount = sectionNotes.length

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <header className="sticky top-0 z-40 border-b border-rule bg-stock">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-3 sm:px-4">
          <Link href="/" aria-label="Set Check home" className="mr-auto">
            <Wordmark size={19} />
          </Link>
          <ThemeToggle />
          <button
            onClick={() => setIsEditSetlistOpen(true)}
            className="flex size-10 items-center justify-center transition-colors hover:bg-sunk"
            aria-label="Edit setlist details"
          >
            <Pencil className="size-4" />
          </button>
          {isCreator && (
            <button
              onClick={() => setShowDeletePlaylistConfirm(true)}
              className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:bg-rubric hover:text-primary-foreground"
              aria-label="Delete this setlist"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-3 py-8 sm:px-4 sm:py-12">
        <NamePromptDialog onNameSet={handleNameSet} />

        <PlaylistHeader
          playlist={playlist}
          songCount={promotedSongs.length}
          spokenCount={spokenCount}
          onShareClick={() => setIsShareOpen(true)}
        />

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 border-b-2 border-rubric pb-2">
            <div className="flex items-baseline gap-3">
              <SetMark size={12} />
              <h2 className="font-display text-xl font-semibold sm:text-2xl">The set</h2>
            </div>
            <p className="num text-[0.6875rem] text-muted-foreground">
              {String(promotedSongs.length).padStart(2, "0")} songs
              {spokenCount > 0 && ` · ${String(spokenCount).padStart(2, "0")} spoken`}
            </p>
          </div>

          <div className="sheet overflow-hidden rounded-t-none border-t-0">
            <SongList
              songs={promotedSongs}
              setItems={setItems}
              playlistId={playlist.id}
              currentUser={currentUser}
              isCreator={canEdit}
              recentlyPromotedId={recentlyPromotedId}
              onSongRemoved={handleSongRemoved}
              onSongUpdated={handleSongUpdated}
              onSongDemoted={canEdit ? handleSongDemoted : undefined}
              onSectionNoteClick={handleSectionNoteClick}
              onSectionNoteRemoved={handleSectionNoteRemoved}
              showAddButton={false}
              droppableId="set-droppable"
            />

            {setItems.length === 0 && (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex w-fit items-center gap-2">
                  <SetMark size={12} finish="outline" />
                  <SetMark size={12} finish="outline" />
                  <SetMark size={12} finish="outline" />
                </span>
                <p className="mx-auto mt-5 max-w-[40ch] text-sm text-muted-foreground">
                  Nothing in the set yet.{" "}
                  {canEdit
                    ? "Move an idea up from below, and it takes its place in the order."
                    : "Ask whoever made this setlist to move an idea up."}
                </p>
              </div>
            )}

            {canEdit && (
              <button
                onClick={handleAddSectionNote}
                className="flex w-full items-center justify-center gap-2 border-t border-dashed border-rule-strong py-3 text-xs text-muted-foreground transition-colors hover:bg-rubric-wash hover:text-rubric"
              >
                <RubricMark size={11} tone="currentColor" />
                <Plus className="size-3.5" />
                Add scripture, prayer, or a call to worship
              </button>
            )}
          </div>
        </section>

        <div className="flex items-center gap-4 py-8" aria-hidden="true">
          <span className="h-px flex-1 bg-rule" />
          <span className="flex items-center gap-3 num text-[0.625rem] text-muted-foreground">
            <IdeaMark size={10} />
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <SetMark size={10} />
            <span className="label">Promote</span>
          </span>
          <span className="h-px flex-1 bg-rule" />
        </div>

        <section>
          <div className="flex items-end justify-between gap-4 border-b border-rule-strong pb-2">
            <div className="flex items-baseline gap-3">
              <IdeaMark size={12} />
              <h2 className="font-display text-xl font-semibold sm:text-2xl">Ideas</h2>
              <span className="num text-[0.6875rem] text-muted-foreground">
                {String(ideaCount).padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={() => setIsAddSongOpen(true)}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-[3px] border border-ballpoint/45 bg-transparent px-4 text-sm font-medium text-ballpoint transition-colors hover:bg-ballpoint-wash hover:border-ballpoint"
            >
              <Plus className="size-4" />
              Add a song
            </button>
          </div>

          <div className="mt-4">
            <IdeasSection
              ideasByPerson={ideasByPerson}
              playlistId={playlist.id}
              currentUser={currentUser}
              isCreator={canEdit}
              onSongRemoved={handleSongRemoved}
              onSongUpdated={handleSongUpdated}
              onSongPromoted={handleSongPromoted}
              onAddSongClick={() => setIsAddSongOpen(true)}
              droppableId="ideas-droppable"
            />
          </div>
        </section>

        <p ref={announceRef} className="sr-only" role="status" aria-live="polite" />

        <AddSongDialog
          open={isAddSongOpen}
          onOpenChange={setIsAddSongOpen}
          playlistId={playlist.id}
          currentPosition={songs.length}
          currentUser={currentUser}
          onSongAdded={handleSongAdded}
        />

        <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} playlist={playlist} />

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

        <PlatformLinksDialog
          open={sharedSongDialogOpen}
          onOpenChange={setSharedSongDialogOpen}
          song={sharedSong}
          playlistId={playlist.id}
        />
      </div>

      <AlertDialog
        open={showDeletePlaylistConfirm}
        onOpenChange={(open) => {
          setShowDeletePlaylistConfirm(open)
          if (!open) setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {playlist.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the setlist, every song in it, and everyone&apos;s
              votes. Anyone holding the link will find nothing there. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-rubric">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaylist}
              className="border border-rubric bg-transparent text-rubric hover:bg-rubric hover:text-primary-foreground"
            >
              Delete setlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DragOverlay>
        {(activeDragItem || activeSong) && (
          <div className="flex items-center gap-3 rounded-[3px] border border-rule-strong bg-sheet px-3 py-2 shadow-lift-raised">
            <span
              className={
                activeDragItem?.type === "section_note"
                  ? "block h-[1.5px] w-3.5 rounded-full bg-rubric"
                  : activeSong?.is_promoted
                    ? "block size-3 rounded-full bg-rubric"
                    : "block size-3 rounded-full border-[1.5px] border-ballpoint"
              }
            />
            <span className="min-w-0">
              <span className="font-display block truncate text-sm font-medium">
                {activeDragItem?.title ?? activeSong?.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {activeDragItem?.type === "section_note"
                  ? activeDragItem.content.replace(/<[^>]*>/g, "").slice(0, 40)
                  : (activeDragItem?.type === "song" ? activeDragItem.artist : activeSong?.artist)}
              </span>
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
