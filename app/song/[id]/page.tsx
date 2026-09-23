import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Music } from "lucide-react"
import Link from "next/link"
import { Wordmark } from "@/components/logo"
import type { Metadata } from "next"
import { PlatformButton } from "./platform-button"

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

const PLATFORM_INFO: Record<string, { name: string }> = {
  spotify: { name: "Spotify" },
  appleMusic: { name: "Apple Music" },
  youtube: { name: "YouTube" },
  youtubeMusic: { name: "YouTube Music" },
  amazonMusic: { name: "Amazon Music" },
  deezer: { name: "Deezer" },
  tidal: { name: "Tidal" },
  soundcloud: { name: "SoundCloud" },
  pandora: { name: "Pandora" },
  audiomack: { name: "Audiomack" },
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
  const availablePlatforms = Object.entries(links).filter(([, url]) => url)

  return (
    <div className="min-h-screen bg-stock">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-lg items-center px-5">
          <Link href="/" aria-label="Set Check home">
            <Wordmark size={19} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="flex items-start gap-5">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-rule bg-sunk">
            {sharedSong.thumbnail_url ? (
              <img
                src={sharedSong.thumbnail_url}
                alt=""
                className="size-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Music className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.025em]">
              {sharedSong.title || "Unknown song"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {sharedSong.artist || "Unknown artist"}
            </p>
            {sharedSong.album && (
              <p className="mt-0.5 text-sm text-muted-foreground">{sharedSong.album}</p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">Someone shared this with you.</p>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between border-b-2 border-rubric pb-2">
            <h2 className="font-display text-lg font-semibold">Open it in</h2>
            <span className="num text-[0.6875rem] text-muted-foreground">
              {String(availablePlatforms.length).padStart(2, "0")}
            </span>
          </div>

          <div className="sheet overflow-hidden rounded-t-none border-t-0">
            {availablePlatforms.length > 0 ? (
              availablePlatforms.map(([platform, url]) => {
                const info = PLATFORM_INFO[platform] || { name: platform }
                return (
                  <PlatformButton
                    key={platform}
                    platform={platform}
                    url={url as string}
                    name={info.name}
                  />
                )
              })
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No streaming links were found for this song.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Whichever you use is the right one — this link works the same on all of them.
          </p>
        </section>

        <div className="mt-16 border-t border-rule pt-6">
          <p className="text-sm text-muted-foreground">
            Building a set with your team?
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex h-11 items-center rounded-[3px] bg-rubric px-4 text-sm font-medium text-on-rubric shadow-lift transition-[filter] hover:brightness-[1.08]"
          >
            make a setlist — free, no account
          </Link>
        </div>
      </main>
    </div>
  )
}
