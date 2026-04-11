"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Music, ImagePlus, Check, X, Pencil, Link2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Playlist } from "@/lib/types"

interface PlaylistHeaderProps {
  playlist: Playlist
  songCount: number
  onPlaylistUpdated: (updated: Partial<Playlist>) => void
  onShareClick: () => void
  onExternalLinkClick: () => void
}

export function PlaylistHeader({
  playlist,
  songCount,
  onPlaylistUpdated,
  onShareClick,
  onExternalLinkClick,
}: PlaylistHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || "")
  const [isUploading, setIsUploading] = useState(false)
  const [scrollScale, setScrollScale] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Handle scroll-based scaling for mobile only
  useEffect(() => {
    const handleScroll = () => {
      // Only apply scaling on mobile (sm breakpoint is 640px)
      if (window.innerWidth >= 640) {
        setScrollScale(1)
        return
      }
      const scrollY = window.scrollY
      const maxScroll = 150 // Max scroll distance for full shrink
      const minScale = 0.6 // Minimum scale
      const scale = Math.max(minScale, 1 - (scrollY / maxScroll) * (1 - minScale))
      setScrollScale(scale)
    }

    const handleResize = () => {
      // Reset scale on resize to desktop
      if (window.innerWidth >= 640) {
        setScrollScale(1)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

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
        onPlaylistUpdated({ cover_url: url })
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <header className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-start">
      {/* Cover Image - Centered on mobile with scroll shrinking */}
      <div className="relative group shrink-0 flex justify-center sm:justify-start">
        <div 
          className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shadow-xl origin-top will-change-transform"
          style={{ transform: `scale(${scrollScale})`, transition: 'none' }}
        >
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url}
              alt={playlist.name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <Music className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg will-change-transform"
          style={{ transform: `scale(${scrollScale})`, transformOrigin: 'top center', transition: 'none' }}
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

      {/* Info - Centered on mobile */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
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
            className="group/name mb-2 w-full sm:w-auto"
          >
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-4xl font-bold text-foreground truncate text-balance">
                {playlist.name}
              </h1>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-100 sm:opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
            </div>
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
            className="group/desc mb-4 w-full sm:w-auto"
          >
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <p className="text-muted-foreground text-sm">
                {playlist.description || "Add a description..."}
              </p>
              <Pencil className="w-3 h-3 text-muted-foreground opacity-100 sm:opacity-0 group-hover/desc:opacity-100 transition-opacity shrink-0" />
            </div>
          </button>
        )}

        {/* Stats & Actions - Centered on mobile */}
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="text-sm text-muted-foreground">
            {songCount} {songCount === 1 ? "song" : "songs"}
          </span>
          {playlist.external_link && (
            <Button 
              onClick={() => window.open(playlist.external_link!, '_blank')} 
              size="icon" 
              variant="outline"
              className="rounded-full h-10 w-10"
            >
              <Link2 className="w-5 h-5" />
            </Button>
          )}
          <Button 
            onClick={onExternalLinkClick} 
            size="sm" 
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {playlist.external_link ? "Edit Link" : "+ Add Link"}
          </Button>
          <Button onClick={onShareClick} size="icon" className="rounded-full h-10 w-10">
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
