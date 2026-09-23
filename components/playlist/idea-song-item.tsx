"use client"

import { useState } from "react"
import Image from "next/image"
import { MoreHorizontal, Trash2, FileMusic, Pencil } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { PlatformLinksDialog } from "./platform-links-dialog"
import { SongEditDialog } from "./song-edit-dialog"
import { VoteButtons } from "./vote-buttons"
import { createClient } from "@/lib/supabase/client"
import type { Song } from "@/lib/types"

interface IdeaSongItemProps {
  song: Song
  playlistId: string
  currentUser: string | null
  isCreator?: boolean
  onSongRemoved: (songId: string) => void
  onSongUpdated: (song: Song) => void
  onSongPromoted: (song: Song) => void
}

export function IdeaSongItem({
  song,
  playlistId,
  currentUser,
  isCreator = false,
  onSongRemoved,
  onSongUpdated,
  onSongPromoted,
}: IdeaSongItemProps) {
  const [isLinksOpen, setIsLinksOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: song.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handlePromote = async () => {
    setIsPromoting(true)
    try {
      const { data: maxPositionData } = await supabase
        .from("songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .eq("is_promoted", true)
        .order("position", { ascending: false })
        .limit(1)
        .single()

      const newPosition = (maxPositionData?.position ?? -1) + 1

      const { error } = await supabase
        .from("songs")
        .update({ is_promoted: true, position: newPosition })
        .eq("id", song.id)

      if (error) throw error

      onSongPromoted({ ...song, is_promoted: true, position: newPosition })
    } catch (error) {
      console.error("Failed to promote song:", error)
    } finally {
      setIsPromoting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("songs").delete().eq("id", song.id)
      if (error) throw error
      onSongRemoved(song.id)
    } catch (error) {
      console.error("Failed to delete song:", error)
    }
  }

  const handleEditSave = async (data: { note: string; externalLink: string }) => {
    try {
      const { error } = await supabase
        .from("songs")
        .update({ note: data.note || null, external_link: data.externalLink || null })
        .eq("id", song.id)

      if (error) throw error
      onSongUpdated({
        ...song,
        note: data.note || null,
        external_link: data.externalLink || null,
      })
    } catch (error) {
      console.error("Failed to update song:", error)
    }
  }

  const addedAt = new Date(song.added_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  const canRemove = currentUser && song.added_by === currentUser

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-stretch border-b border-rule bg-stock transition-colors last:border-b-0 hover:bg-sunk ${
          isDragging ? "opacity-40" : ""
        }`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 px-2 py-2 sm:items-center sm:gap-3 sm:px-3">
          <span
            {...(isCreator ? { ...attributes, ...listeners } : {})}
            className={`mt-3.5 block size-3 shrink-0 touch-none rounded-full border-[1.5px] border-ballpoint sm:mt-0 ${
              isCreator ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            aria-hidden="true"
          />

          {song.thumbnail_url && (
            <button
              onClick={() => setIsLinksOpen(true)}
              className="relative size-10 shrink-0 overflow-hidden rounded-[2px] border border-rule bg-sunk"
              aria-label={`Open links for ${song.title}`}
            >
              <Image
                src={song.thumbnail_url}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
                crossOrigin="anonymous"
              />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <button onClick={() => setIsLinksOpen(true)} className="block w-full min-w-0 text-left">
              <span className="flex items-center gap-2">
                <span className="font-display truncate text-sm font-medium leading-tight sm:text-base">{song.title}</span>
                {song.note && (
                  <span className="label shrink-0 border border-rule px-1 py-0.5 leading-none">
                    note
                  </span>
                )}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                {song.artist}
              </span>
            </button>

            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <VoteButtons songId={song.id} currentUser={currentUser} />
              {song.external_link && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-rubric"
                  aria-label="Open attached link"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(song.external_link!, "_blank", "noopener,noreferrer")
                  }}
                >
                  <FileMusic className="h-4 w-4" />
                </Button>
              )}
              <span className="ml-auto num text-[0.625rem] text-muted-foreground">
                {addedAt}
              </span>
            </div>
          </div>

          <span className="hidden num text-[0.625rem] text-muted-foreground sm:block">
            {addedAt}
          </span>

          <span className="hidden sm:block">
            <VoteButtons songId={song.id} currentUser={currentUser} />
          </span>

          {song.external_link && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden text-rubric sm:inline-flex"
              aria-label="Open attached link"
              onClick={(e) => {
                e.stopPropagation()
                window.open(song.external_link!, "_blank", "noopener,noreferrer")
              }}
            >
              <FileMusic className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions for ${song.title}`}
                className="mt-2 shrink-0 text-muted-foreground sm:mt-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit note &amp; link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLinksOpen(true)}>
                <FileMusic className="mr-2 h-4 w-4" />
                Open links
              </DropdownMenuItem>
              {canRemove && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rubric focus:text-rubric"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove idea
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isCreator && (
          <button
            type="button"
            onClick={handlePromote}
            disabled={isPromoting}
            aria-label={`Move ${song.title} into the set`}
            className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-l border-rule text-muted-foreground transition-colors hover:bg-rubric hover:text-on-rubric disabled:opacity-40 sm:w-16"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden text-[0.625rem] leading-none sm:block">
              {isPromoting ? "…" : "to set"}
            </span>
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {song.title} from your ideas?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the song and its votes. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="border border-rubric bg-transparent text-rubric hover:bg-rubric hover:text-on-rubric"
            >
              Remove idea
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlatformLinksDialog
        open={isLinksOpen}
        onOpenChange={setIsLinksOpen}
        song={song}
        onNoteSave={async (note) => {
          try {
            const { error } = await supabase
              .from("songs")
              .update({ note: note || null })
              .eq("id", song.id)
            if (error) throw error
            onSongUpdated({ ...song, note: note || null })
          } catch (error) {
            console.error("Failed to update note:", error)
          }
        }}
      />

      <SongEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        note={song.note || ""}
        externalLink={song.external_link || ""}
        onSave={handleEditSave}
      />
    </>
  )
}
