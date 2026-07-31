"use client"

import { useState, useEffect, useRef } from "react"
import { useStreamingPreference } from "@/hooks/use-streaming-preference"
import { PlatformButton } from "./platform-button"
import { SongPreferenceControls } from "./song-preference-controls"
import { openWithAppFallback } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle, Sparkles, X } from "lucide-react"

const PLATFORM_INFO: Record<string, { name: string; color: string }> = {
  spotify: { name: "Spotify", color: "bg-[#1DB954]" },
  appleMusic: { name: "Apple Music", color: "bg-[#FA243C]" },
  youtube: { name: "YouTube", color: "bg-[#FF0000]" },
  youtubeMusic: { name: "YouTube Music", color: "bg-[#FF0000]" },
  amazonMusic: { name: "Amazon Music", color: "bg-[#00A8E1]" },
  deezer: { name: "Deezer", color: "bg-[#FEAA2D]" },
  tidal: { name: "Tidal", color: "bg-[#000000]" },
  soundcloud: { name: "SoundCloud", color: "bg-[#FF5500]" },
  pandora: { name: "Pandora", color: "bg-[#005483]" },
  audiomack: { name: "Audiomack", color: "bg-[#FFA200]" },
}

interface SongPlatformListProps {
  availablePlatforms: [string, string][]
}

export function SongPlatformList({ availablePlatforms }: SongPlatformListProps) {
  const {
    preferredPlatform,
    rememberPreference,
    setPreferredPlatform,
    setRememberPreference,
    clearPreference,
    isLoaded,
  } = useStreamingPreference()

  const [autoOpenCancelled, setAutoOpenCancelled] = useState(false)
  const [autoOpenTriggered, setAutoOpenTriggered] = useState(false)
  const autoOpenTimerRef = useRef<NodeJS.Timeout | null>(null)

  const preferredUrl = preferredPlatform
    ? availablePlatforms.find(([platform]) => platform === preferredPlatform)?.[1]
    : null

  const isPreferredAvailable = Boolean(preferredUrl)
  const preferredName = preferredPlatform
    ? PLATFORM_INFO[preferredPlatform]?.name || preferredPlatform
    : undefined

  // Auto-open logic when preference is set and available
  useEffect(() => {
    if (!isLoaded || !rememberPreference || !preferredPlatform || !isPreferredAvailable || autoOpenCancelled || autoOpenTriggered) {
      return
    }

    // Set autoOpenTriggered state and trigger redirect
    setAutoOpenTriggered(true)
    
    autoOpenTimerRef.current = setTimeout(() => {
      if (preferredUrl) {
        openWithAppFallback(preferredUrl)
      }
    }, 600)

    return () => {
      if (autoOpenTimerRef.current) {
        clearTimeout(autoOpenTimerRef.current)
      }
    }
  }, [isLoaded, rememberPreference, preferredPlatform, isPreferredAvailable, preferredUrl, autoOpenCancelled, autoOpenTriggered])

  const handleCancelAutoOpen = () => {
    if (autoOpenTimerRef.current) {
      clearTimeout(autoOpenTimerRef.current)
    }
    setAutoOpenCancelled(true)
  }

  const handlePlatformClick = (platform: string) => {
    if (rememberPreference) {
      setPreferredPlatform(platform)
    }
  }

  return (
    <div className="space-y-6">
      {/* Auto-Open Banner */}
      {isLoaded && rememberPreference && preferredPlatform && isPreferredAvailable && !autoOpenCancelled && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between gap-3 text-sm text-foreground animate-in fade-in duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
            <span className="truncate">
              Opening in <strong>{preferredName}</strong>...
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => preferredUrl && openWithAppFallback(preferredUrl)}
              className="h-8 text-xs gap-1"
            >
              Open now <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelAutoOpen}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Cancel auto-open"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preferred platform missing warning banner */}
      {isLoaded && rememberPreference && preferredPlatform && !isPreferredAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>{preferredName}</strong> link is not available for this song. Please select an available streaming service below.
          </div>
        </div>
      )}

      {/* Platform Buttons */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Listen on
        </h2>
        {availablePlatforms.length > 0 ? (
          availablePlatforms.map(([platform, url]) => {
            const info = PLATFORM_INFO[platform] || { name: platform, color: "bg-muted" }
            const isPreferred = rememberPreference && platform === preferredPlatform

            return (
              <PlatformButton
                key={platform}
                platform={platform}
                url={url}
                name={info.name}
                color={info.color}
                isPreferred={isPreferred}
                onClick={() => handlePlatformClick(platform)}
              />
            )
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No streaming links available
          </p>
        )}
      </div>

      {/* Preference Controls */}
      <SongPreferenceControls
        rememberPreference={rememberPreference}
        preferredPlatform={preferredPlatform}
        preferredPlatformName={preferredName}
        onToggleRemember={setRememberPreference}
        onClearPreference={clearPreference}
        isLoaded={isLoaded}
      />
    </div>
  )
}
