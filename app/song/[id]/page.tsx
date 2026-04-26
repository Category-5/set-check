import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Music, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

interface PlatformLinks {
  spotify?: string
  appleMusic?: string
  youtube?: string
  youtubeMusic?: string
  amazonMusic?: string
  deezer?: string
  tidal?: string
  soundcloud?: string
  pandora?: string
  audiomack?: string
}

interface SharedSong {
  id: string
  original_url: string
  title: string | null
  artist: string | null
  album: string | null
  thumbnail_url: string | null
  platform_links: PlatformLinks | null
  created_at: string
}

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: song } = await supabase
    .from("shared_songs")
    .select("*")
    .eq("id", id)
    .single()

  if (!song) {
    return {
      title: "Song Not Found | SetCheck",
    }
  }

  return {
    title: `${song.title || "Shared Song"} by ${song.artist || "Unknown Artist"} | SetCheck`,
    description: `Listen to ${song.title} by ${song.artist} on your favorite streaming platform.`,
    openGraph: {
      title: `${song.title || "Shared Song"} by ${song.artist || "Unknown Artist"}`,
      description: `Listen to ${song.title} by ${song.artist} on your favorite streaming platform.`,
      images: song.thumbnail_url ? [song.thumbnail_url] : undefined,
    },
  }
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: song, error } = await supabase
    .from("shared_songs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !song) {
    notFound()
  }

  const sharedSong = song as SharedSong
  const links = (sharedSong.platform_links || {}) as PlatformLinks
  const availablePlatforms = Object.entries(links).filter(([, url]) => url)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SetCheck</span>
        </Link>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          {/* Song Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="shrink-0 w-20 h-20 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
              {sharedSong.thumbnail_url ? (
                <img
                  src={sharedSong.thumbnail_url}
                  alt={sharedSong.title || "Song"}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <Music className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-lg text-foreground truncate">
                {sharedSong.title || "Unknown Song"}
              </h1>
              <p className="text-muted-foreground truncate">
                {sharedSong.artist || "Unknown Artist"}
              </p>
              {sharedSong.album && (
                <p className="text-sm text-muted-foreground/70 truncate">
                  {sharedSong.album}
                </p>
              )}
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Listen on
            </h2>
            {availablePlatforms.length > 0 ? (
              availablePlatforms.map(([platform, url]) => {
                const info = PLATFORM_INFO[platform] || { name: platform, color: "bg-muted" }
                return (
                  <Button
                    key={platform}
                    variant="secondary"
                    className="w-full justify-between h-12"
                    asChild
                  >
                    <a href={url as string} target="_blank" rel="noopener noreferrer">
                      <span className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${info.color}`} />
                        {info.name}
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </Button>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No streaming links available
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Shared via{" "}
          <Link href="/" className="text-primary hover:underline">
            SetCheck
          </Link>
        </p>
      </div>
    </div>
  )
}
