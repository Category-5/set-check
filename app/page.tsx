"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Music, Clock, Users, Vote, Link2, ArrowRight } from "lucide-react"
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
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 text-sm font-medium text-orange-500 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              100% Free, No Account Required
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground mb-6">
              Build your setlist
              <span className="block text-primary">together</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              A completely free way to collaborate on a setlist. Share songs, vote on them, and link to any music streamer.
            </p>

            {/* CTA Button */}
            <Button
              onClick={createNewPlaylist}
              disabled={isCreating}
              size="lg"
              className="h-14 px-8 text-lg gap-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {isCreating ? "Creating..." : "Create a Setlist"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Collaborate</h3>
              <p className="text-muted-foreground text-sm">
                Share a link and let anyone add song ideas to your setlist.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Vote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Vote</h3>
              <p className="text-muted-foreground text-sm">
                Upvote your favorites and see what the group wants to play.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Link</h3>
              <p className="text-muted-foreground text-sm">
                Connect to Spotify, Apple Music, or any streaming service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Playlists Section */}
      {recentPlaylists.length > 0 && (
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center gap-3 mb-8">
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
                  className="group text-left p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all"
                >
                  <div className="aspect-square rounded-lg bg-secondary mb-3 overflow-hidden flex items-center justify-center">
                    {playlist.cover_url ? (
                      <img
                        src={playlist.cover_url}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          </div>
        </section>
      )}

      {/* Empty State */}
      {recentPlaylists.length === 0 && (
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary mb-6">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No setlists yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first setlist to get started
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Set Check - Free collaborative setlist builder
          </p>
        </div>
      </footer>
    </main>
  )
}
