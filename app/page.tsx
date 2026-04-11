"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Music, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"

interface RecentPlaylist {
  id: string
  name: string
  cover_url: string | null
  viewedAt: number
}

const RECENT_PLAYLISTS_KEY = "set-check-recent-playlists"

export default function HomePage() {
  const router = useRouter()
  const [recentPlaylists, setRecentPlaylists] = useState<RecentPlaylist[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentPlaylist[]
        // Sort by most recently viewed
        parsed.sort((a, b) => b.viewedAt - a.viewedAt)
        setRecentPlaylists(parsed)
      } catch {
        // Invalid JSON, ignore
      }
    }
    setIsLoaded(true)
  }, [])

  const createNewPlaylist = async () => {
    setIsCreating(true)
    const supabase = createClient()
    const playlistId = nanoid(10)
    const username = localStorage.getItem("setcheck_username")

    const { error } = await supabase.from("playlists").insert({
      id: playlistId,
      name: "My Setlist",
      description: "A collaborative setlist",
      created_by: username,
    })

    if (!error) {
      router.push(`/p/${playlistId}`)
    } else {
      console.error("Error creating playlist:", error)
      setIsCreating(false)
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    return `${weeks}w ago`
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-12">
        {/* Header */}
        <header className="mb-12 text-center max-w-xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Set Check</h1>
          <p className="text-muted-foreground text-balance">
            A completely free way to collaborate on a setlist. No account needed. Share songs and vote on them, and then link to any music streamer.
          </p>
        </header>

        {/* Create New Playlist Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={createNewPlaylist}
            disabled={isCreating}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            {isCreating ? "Creating..." : "Create New Setlist"}
          </Button>
        </div>

        {/* Recent Playlists Section */}
        {recentPlaylists.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Recently Viewed
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => router.push(`/p/${playlist.id}`)}
                  className="group text-left p-3 rounded-lg bg-card hover:bg-secondary transition-colors"
                >
                  <div className="aspect-square rounded-md bg-secondary mb-3 overflow-hidden flex items-center justify-center">
                    {playlist.cover_url ? (
                      <img
                        src={playlist.cover_url}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Music className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(playlist.viewedAt)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recentPlaylists.length === 0 && (
          <section className="text-center py-16">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No setlists yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first setlist to get started
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
