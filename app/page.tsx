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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Set Check",
    "description": "A completely free way to collaborate on a setlist. Share songs, vote on them, and link to any music streamer.",
    "url": "https://setcheck.app",
    "applicationCategory": "MusicApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Category 5",
      "email": "hello@category5.co"
    }
  }

  return (
    <main className="min-h-screen bg-background relative">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Music-themed background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="musicPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Music note */}
              <path d="M30 20 L30 45 C30 50 25 55 20 55 C15 55 10 50 10 45 C10 40 15 35 20 35 C23 35 26 36 28 38 L28 20 L40 15 L40 20 Z" fill="currentColor" className="text-foreground"/>
              {/* Sound wave bars */}
              <rect x="60" y="30" width="4" height="20" rx="2" fill="currentColor" className="text-foreground"/>
              <rect x="68" y="25" width="4" height="30" rx="2" fill="currentColor" className="text-foreground"/>
              <rect x="76" y="20" width="4" height="40" rx="2" fill="currentColor" className="text-foreground"/>
              <rect x="84" y="25" width="4" height="30" rx="2" fill="currentColor" className="text-foreground"/>
              <rect x="92" y="30" width="4" height="20" rx="2" fill="currentColor" className="text-foreground"/>
              {/* Vinyl record */}
              <circle cx="30" cy="90" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground"/>
              <circle cx="30" cy="90" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground"/>
              <circle cx="30" cy="90" r="3" fill="currentColor" className="text-foreground"/>
              {/* Headphones */}
              <path d="M75 85 C75 75 85 70 95 70 C105 70 115 75 115 85" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground"/>
              <rect x="72" y="82" width="8" height="14" rx="3" fill="currentColor" className="text-foreground"/>
              <rect x="110" y="82" width="8" height="14" rx="3" fill="currentColor" className="text-foreground"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#musicPattern)" />
        </svg>
      </div>

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

            {/* Testimonial */}
            <blockquote className="mt-12 max-w-xl mx-auto rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 relative">
              <div className="absolute -top-3 left-6 bg-background px-2">
                <span className="text-emerald-500 text-2xl font-serif">&ldquo;</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Now I can work together with my team to find songs for the worship nights I plan even though we all use different music platforms. The voting and promoting feature helps provide clarity on which songs feel right.
              </p>
              <footer className="mt-4 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-foreground">Josh</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
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
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm text-muted-foreground">
          <span>Built by Category 5</span>
          <span className="hidden sm:inline">·</span>
          <a 
            href="mailto:hello@category5.co" 
            className="hover:text-foreground transition-colors"
          >
            Contact hello@category5.co
          </a>
        </div>
      </footer>
    </main>
  )
}
