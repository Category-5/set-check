import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Music } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import type { Metadata } from "next"
import type { PlatformLinks } from "@/lib/types"
import { SongPlatformList } from "./song-platform-list"

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

  const title = `${song.title || "Shared Song"} by ${song.artist || "Unknown Artist"}`
  const description = `Listen to ${song.title} by ${song.artist} on your favorite streaming platform.`

  return {
    title: `${title} | SetCheck`,
    description,
    openGraph: {
      title,
      description,
      ...(song.thumbnail_url ? { images: [song.thumbnail_url] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(song.thumbnail_url ? { images: [song.thumbnail_url] } : {}),
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
  const availablePlatforms = Object.entries(links).filter(([, url]) => url) as [string, string][]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size={48} />
          </Link>
        </div>

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

          {/* Platform Links & Preference Controls */}
          <SongPlatformList availablePlatforms={availablePlatforms} />
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
