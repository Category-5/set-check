"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Music, ImagePlus, Check, X, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Playlist } from "@/lib/types"

interface PlaylistHeaderProps {
  playlist: Playlist
  songCount: number
  onPlaylistUpdated: (updated: Partial<Playlist>) => void
  onShareClick: () => void
}

export function PlaylistHeader({
  playlist,
  songCount,
  onPlaylistUpdated,
  onShareClick,
}: PlaylistHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || "")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSaveName = async () => {
    if (name.trim() === playlist.name) {
      setIsEditingName(false)
      return
    }

    const { error } = await supabase
      .from("playlists")
      .update({ name: name.trim() })
      .eq("id", playlist.id)

    if (!error) {
      onPlaylistUpdated({ name: name.trim() })
    }
    setIsEditingName(false)
  }

  const handleSaveDescription = async () => {
    if (description === playlist.description) {
      setIsEditingDescription(false)
      return
    }

    const { error } = await supabase
      .from("playlists")
      .update({ description: description.trim() || null })
      .eq("id", playlist.id)

    if (!error) {
      onPlaylistUpdated({ description: description.trim() || null })
    }
    setIsEditingDescription(false)
  }

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
        const { url } = await response.json()
        onPlaylistUpdated({ image_url: url })
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
      {/* Cover Image */}
      <div className="relative group shrink-0">
        <div className="w-48 h-48 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shadow-xl">
          {playlist.image_url ? (
            <img
              src={playlist.image_url}
              alt={playlist.name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <Music className="w-20 h-20 text-muted-foreground" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
        >
          <ImagePlus className="w-8 h-8 text-white" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
          Set Check
        </p>

        {/* Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-bold h-auto py-1 bg-secondary border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName()
                if (e.key === "Escape") {
                  setName(playlist.name)
                  setIsEditingName(false)
                }
              }}
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName}>
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setName(playlist.name)
                setIsEditingName(false)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="group/name flex items-center gap-2 text-left mb-2"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground truncate text-balance">
              {playlist.name}
            </h1>
            <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
          </button>
        )}

        {/* Description */}
        {isEditingDescription ? (
          <div className="flex items-start gap-2 mb-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="resize-none bg-secondary border-primary"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleSaveDescription()
                if (e.key === "Escape") {
                  setDescription(playlist.description || "")
                  setIsEditingDescription(false)
                }
              }}
            />
            <Button size="icon" variant="ghost" onClick={handleSaveDescription}>
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setDescription(playlist.description || "")
                setIsEditingDescription(false)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingDescription(true)}
            className="group/desc flex items-center gap-2 text-left mb-4"
          >
            <p className="text-muted-foreground text-sm">
              {playlist.description || "Add a description..."}
            </p>
            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0" />
          </button>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {songCount} {songCount === 1 ? "song" : "songs"}
          </span>
          <Button onClick={onShareClick} size="icon" className="rounded-full h-10 w-10">
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
