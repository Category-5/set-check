"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RichTextDisplay } from "@/components/ui/rich-text-display"
import { Share2, Music, ImagePlus, FileMusic } from "lucide-react"
import type { Playlist } from "@/lib/types"
import { openWithAppFallback } from "@/lib/utils"

interface PlaylistHeaderProps {
  playlist: Playlist
  songCount: number
  onShareClick: () => void
}

export function PlaylistHeader({
  playlist,
  songCount,
  onShareClick,
}: PlaylistHeaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [scrollScale, setScrollScale] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        // Refresh the page to get updated cover
        window.location.reload()
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
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground truncate text-balance mb-2">
          {playlist.name}
        </h1>

        {/* Description */}
        {playlist.description ? (
          <RichTextDisplay content={playlist.description} className="mb-4" />
        ) : (
          <p className="text-muted-foreground text-sm mb-4">No description</p>
        )}

        {/* Stats & Actions - Centered on mobile */}
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="text-sm text-muted-foreground">
            {songCount} {songCount === 1 ? "song" : "songs"}
          </span>
          {playlist.external_link && (
            <Button 
              onClick={() => openWithAppFallback(playlist.external_link!)} 
              size="icon" 
              variant="outline"
              className="rounded-full h-10 w-10"
            >
              <FileMusic className="w-5 h-5" />
            </Button>
          )}
          <Button onClick={onShareClick} size="icon" className="rounded-full h-10 w-10">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
