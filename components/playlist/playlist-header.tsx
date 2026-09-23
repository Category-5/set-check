"use client"

import { useState, useRef } from "react"
import { RichTextDisplay } from "@/components/ui/rich-text-display"
import { Share2, ImagePlus, FileMusic } from "lucide-react"
import type { Playlist } from "@/lib/types"
import { openWithAppFallback } from "@/lib/utils"

interface PlaylistHeaderProps {
  playlist: Playlist
  songCount: number
  spokenCount?: number
  onShareClick: () => void
}

export function PlaylistHeader({
  playlist,
  songCount,
  spokenCount = 0,
  onShareClick,
}: PlaylistHeaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("playlistId", playlist.id)

      const response = await fetch("/api/upload-cover", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
      {playlist.cover_url && (
        <div className="group relative size-20 shrink-0 self-start sm:size-28">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-[3px] border border-rule bg-sunk shadow-lift">
            <img
              src={playlist.cover_url}
              alt=""
              className="size-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[3px] bg-ink/70 text-stock opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
            aria-label={isUploading ? "Uploading cover" : "Change cover image"}
          >
            <ImagePlus className="size-5" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="min-w-0 flex-1">

        <h1 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{playlist.name}</h1>

        <div className="mt-4 max-w-[62ch]">
          {playlist.description ? (
            <RichTextDisplay content={playlist.description} />
          ) : (
            <p className="text-sm text-muted-foreground">No description yet.</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="num text-[0.6875rem] text-muted-foreground">
            {String(songCount).padStart(2, "0")} {songCount === 1 ? "song" : "songs"}
            {spokenCount > 0 && ` · ${String(spokenCount).padStart(2, "0")} spoken`}
          </p>

          <div className="flex items-center gap-2">
            {playlist.external_link && (
              <button
                onClick={() => openWithAppFallback(playlist.external_link!)}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-[3px] border border-rule-strong bg-sheet px-3 text-sm shadow-lift transition-colors hover:bg-sunk"
              >
                <FileMusic className="size-4" />
                Chart
              </button>
            )}
            {!playlist.cover_url && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-[3px] px-2 text-sm text-muted-foreground transition-colors hover:text-ink disabled:opacity-45"
              >
                <ImagePlus className="size-4" />
                {isUploading ? "Adding cover…" : "Add a cover"}
              </button>
            )}
            <button
              onClick={onShareClick}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-[3px] bg-rubric px-4 text-sm font-medium text-on-rubric shadow-lift transition-[filter] hover:brightness-[1.08]"
            >
              <Share2 className="size-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
