"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PrimaryAction } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Wordmark } from "@/components/logo"
import { SetMark, IdeaMark, RubricMark } from "@/components/shapes"
import { Composition } from "@/components/home/composition"
import { createClient } from "@/lib/supabase/client"
import { nanoid } from "nanoid"
import { ImportSpotifyDialog } from "@/components/import-spotify-dialog"
import { ShareSongDialog } from "@/components/share-song-dialog"
import { RECENT_PLAYLISTS_KEY, SHARED_SONGS_KEY } from "@/lib/constants"

interface RecentPlaylist {
  id: string
  name: string
  cover_url: string | null
  viewedAt: number
}

interface RecentSharedSong {
  id: string
  title: string
  artist: string
  thumbnail_url: string | null
  sharedAt: number
}

interface Stats {
  setlistsCreated: number
  songsShared: number
}

const CHAT_NOISE = [
  { text: "what key was way maker in again", x: 4, y: 2, w: 58, r: -2 },
  { text: "can we do gratitude sunday", x: 30, y: 17, w: 52, r: 3 },
  { text: "that link is spotify, i'm on apple", x: 8, y: 33, w: 62, r: -1 },
  { text: "[screenshot_2.jpg]", x: 52, y: 47, w: 34, r: 4 },
  { text: "is this the final list??", x: 2, y: 58, w: 44, r: 2 },
  { text: "sorry just seeing this now", x: 34, y: 70, w: 50, r: -3 },
  { text: "who's leading again", x: 12, y: 84, w: 40, r: 1 },
]

const PLATFORMS = [
  "Spotify",
  "Apple Music",
  "YouTube",
  "YouTube Music",
  "Amazon Music",
  "Tidal",
  "Deezer",
  "SoundCloud",
  "Pandora",
]

type OrderRow =
  | { kind: "song"; no: string; title: string; songKey: string }
  | { kind: "spoken"; title: string; detail: string }

const RUNNING_ORDER: OrderRow[] = [
  { kind: "spoken", title: "Call to worship", detail: "Psalm 95:1–3, read together" },
  { kind: "song", no: "01", title: "Great Are You Lord", songKey: "G" },
  { kind: "song", no: "02", title: "Goodness of God", songKey: "A" },
  { kind: "spoken", title: "Scripture", detail: "Romans 8:38–39, over the instrumental" },
  { kind: "song", no: "03", title: "Way Maker", songKey: "E" },
  { kind: "spoken", title: "Prayer", detail: "Two minutes, before the last song" },
  { kind: "song", no: "04", title: "Gratitude", songKey: "C" },
]

export default function HomePage() {
  const router = useRouter()
  const [recentPlaylists, setRecentPlaylists] = useState<RecentPlaylist[]>([])
  const [recentSharedSongs, setRecentSharedSongs] = useState<RecentSharedSong[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showShareSongDialog, setShowShareSongDialog] = useState(false)
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ setlistsCreated: 0, songsShared: 0 })

  const loadSharedSongs = useCallback(() => {
    const raw = localStorage.getItem(SHARED_SONGS_KEY)
    if (!raw) return
    try {
      setRecentSharedSongs(JSON.parse(raw) as RecentSharedSong[])
    } catch {
    }
  }, [])

  const loadStats = useCallback(async () => {
    const supabase = createClient()
    const [playlistsResult, sharedSongsResult] = await Promise.all([
      supabase.from("playlists").select("*", { count: "exact", head: true }),
      supabase.from("shared_songs").select("*", { count: "exact", head: true }),
    ])
    setStats({
      setlistsCreated: playlistsResult.count ?? 0,
      songsShared: sharedSongsResult.count ?? 0,
    })
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentPlaylist[]
        parsed.sort((a, b) => b.viewedAt - a.viewedAt)
        setRecentPlaylists(parsed)
      } catch {
      }
    }
    loadSharedSongs()
    loadStats()
    setIsLoaded(true)
  }, [loadSharedSongs, loadStats])

  const copySongUrl = useCallback(async (id: string) => {
    const url = `${window.location.origin}/song/${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopiedSongId(id)
    setTimeout(() => setCopiedSongId(null), 2000)
  }, [])

  const scrollToSets = useCallback(() => {
    document.getElementById("my-sets")?.scrollIntoView({ behavior: "smooth" })
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
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return `${Math.floor(days / 7)}w ago`
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Set Check",
    description:
      "A completely free way to collaborate on a setlist. Share songs, vote on them, and link to any music streamer.",
    url: "https://setcheck.app",
    applicationCategory: "MusicApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: { "@type": "Organization", name: "Category 5", email: "hello@category5.co" },
  }

  return (
    <main className="min-h-screen bg-stock">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-40 border-b border-rule bg-stock/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-5 sm:px-8">
          <Wordmark size={22} />
          <nav className="ml-auto flex items-center gap-1">
            <button
              onClick={scrollToSets}
              className="hidden h-10 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-ink sm:flex"
            >
              My sets
            </button>
            <button
              onClick={() => setShowShareSongDialog(true)}
              className="hidden h-10 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-ink sm:flex"
            >
              Share a song
            </button>
            <ThemeToggle />
            <button
              onClick={createNewPlaylist}
              disabled={isCreating}
              className="ml-2 flex h-10 items-center rounded-[3px] bg-rubric px-4 text-sm font-medium text-on-rubric shadow-lift transition-[filter] hover:brightness-[1.08] disabled:opacity-45"
            >
              {isCreating ? "Creating…" : "Create a setlist"}
            </button>
          </nav>
        </div>
      </header>

      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:items-center lg:gap-20 lg:py-28">
          <div>
            <h1 className="font-display text-[2.875rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[4.25rem]">
              Your setlist,
              <br />
              out of the
              <br />
              <span className="italic text-rubric">group chat.</span>
            </h1>

            <p className="prose-paper mt-7 max-w-[46ch] text-lg">
              Send one link. Your team adds songs, votes on them, and opens
              everything in whatever they listen on. You arrange the order.
            </p>

            <div className="mt-9">
              <PrimaryAction scale="lg" onClick={createNewPlaylist} disabled={isCreating}>
                {isCreating ? "Creating…" : "Create a setlist"}
              </PrimaryAction>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Free · no account · every streaming service
            </p>

            <button
              onClick={() => setShowImportDialog(true)}
              className="mt-3 text-sm text-muted-foreground underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
            >
              Or start from a Spotify playlist
            </button>
          </div>

          <div className="lg:pl-2">
            <Composition />
            <p className="mt-4 text-xs text-muted-foreground">
              A real set, made of demo songs. Drag an idea into the set — it
              becomes part of the order.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display max-w-[16ch] text-3xl font-semibold leading-[1.1] sm:text-[2.625rem]">
            The same songs, twice.
          </h2>
          <p className="prose-paper mt-5 max-w-[62ch] text-base">
            Nothing is wrong with your team&rsquo;s ideas. They just arrive somewhere
            nothing can be ordered, keyed, or agreed on.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="sheet flex flex-col overflow-hidden">
              <div className="flex items-baseline gap-3 border-b border-rule px-5 py-3.5">
                <IdeaMark size={9} tone="var(--muted)" />
                <h3 className="font-display text-sm font-semibold">The group chat</h3>
                <span className="label ml-auto">Tension</span>
              </div>
              <div className="relative h-[340px] flex-1 overflow-hidden px-4 py-4">
                {CHAT_NOISE.map((m) => (
                  <span
                    key={m.text}
                    className="absolute rounded-[2px] border border-rule bg-sunk px-3 py-2 text-xs leading-tight text-muted-foreground shadow-lift"
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${m.w}%`,
                      transform: `rotate(${m.r}deg)`,
                    }}
                  >
                    {m.text}
                  </span>
                ))}
              </div>
              <p className="border-t border-rule px-5 py-3.5 text-xs text-muted-foreground">
                Off the grid. No order, no key, no decision.
              </p>
            </div>

            <div className="sheet flex flex-col overflow-hidden">
              <div className="flex items-baseline gap-3 border-b border-rule px-5 py-3.5">
                <SetMark size={9} />
                <h3 className="font-display text-sm font-semibold">The set</h3>
                <span className="label ml-auto">Balance</span>
              </div>
              <ul className="h-[340px] flex-1 px-5 py-4">
                {[
                  ["01", "Great Are You Lord", "G"],
                  ["", "Call to worship", ""],
                  ["02", "Goodness of God", "A"],
                  ["03", "Way Maker", "E"],
                  ["04", "King of Kings", "D"],
                  ["", "Prayer", ""],
                  ["05", "Gratitude", "C"],
                ].map(([no, title, key]) => (
                  <li key={title} className="flex items-center gap-3 border-b border-rule py-2.5 last:border-0">
                    <span className="num w-5 shrink-0 text-[0.6875rem] text-muted-foreground">
                      {no}
                    </span>
                    {key ? <SetMark size={8} /> : <RubricMark size={12} />}
                    <span
                      className={`font-display flex-1 truncate text-sm ${
                        key ? "font-medium" : "italic text-rubric"
                      }`}
                    >
                      {title}
                    </span>
                    {key && (
                      <span className="num rounded-[2px] border border-rule px-1.5 py-0.5 text-[0.6875rem]">
                        {key}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="border-t border-rule px-5 py-3.5 text-xs text-muted-foreground">
                One order. Keyed. Everyone looking at the same thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-sunk">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-[1.1] sm:text-[2.625rem]">
              Nine services.
              <br />
              <span className="italic">No favourite.</span>
            </h2>
            <p className="prose-paper mt-5 max-w-[56ch] text-base">
              Every song added to Set Check carries a link to all of them. The
              person on Apple Music and the person on Tidal contribute to the same
              list and each open it where they already are. Nobody converts, and
              nobody is a second-class member of the team.
            </p>
          </div>
          <div>
            <ul className="sheet divide-y divide-rule overflow-hidden">
              {PLATFORMS.map((p) => (
                <li key={p} className="flex items-baseline gap-4 px-5 py-4 sm:px-6">
                  <span className="font-display text-base font-medium sm:text-lg">{p}</span>
                  <span className="rule-leader mx-2 self-center" aria-hidden="true" />
                  <span className="num shrink-0 text-[0.6875rem] text-muted-foreground">
                    1 link
                  </span>
                </li>
              ))}
            </ul>
            <p className="num mt-4 text-center text-[0.6875rem] text-muted-foreground">
              1 song · 9 links · 0 conversions
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display max-w-[18ch] text-3xl font-semibold leading-[1.1] sm:text-[2.625rem]">
                A service isn&rsquo;t only songs.
              </h2>
              <p className="prose-paper mt-5 max-w-[60ch] text-base">
                Scripture, prayer, and the call to worship sit in the running
                order with everything else — numbered alongside the songs, not
                pencilled in a margin.
              </p>
            </div>
          </div>

          <div className="sheet mx-auto mt-12 max-w-[42rem] overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-rule px-6 py-3.5">
              <p className="label">Sunday · running order</p>
              <p className="label flex shrink-0 items-center gap-2.5">
                <RubricMark size={14} />
                The third form
              </p>
            </div>
            <ul className="px-6 py-3">
              {RUNNING_ORDER.map((row) =>
                row.kind === "song" ? (
                  <li
                    key={row.title}
                    className="flex items-center gap-4 border-b border-rule py-3.5 last:border-0"
                  >
                    <span className="num w-5 shrink-0 text-xs text-muted-foreground">
                      {row.no}
                    </span>
                    <SetMark size={8} />
                    <span className="font-display flex-1 truncate text-[0.9375rem] font-medium">
                      {row.title}
                    </span>
                    <span className="num rounded-[2px] border border-rule px-1.5 py-0.5 text-[0.6875rem]">
                      {row.songKey}
                    </span>
                  </li>
                ) : (
                  <li
                    key={row.title}
                    className="-mx-6 flex items-baseline gap-4 border-b border-rule bg-rubric-wash px-6 py-3.5 last:border-0"
                  >
                    <span className="w-5 shrink-0" aria-hidden="true" />
                    <RubricMark size={12} className="self-center" />
                    <span className="min-w-0 flex-1">
                      <span className="font-display block text-[0.9375rem] italic text-rubric">
                        {row.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.detail}
                      </span>
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 sm:py-28">
          <figure className="mx-auto max-w-[44rem] text-center">
            <blockquote className="font-display text-2xl italic leading-[1.4] sm:text-[1.875rem] sm:leading-[1.38]">
              &ldquo;Now I can work together with my team to find songs for the
              worship nights I plan even though we all use different music
              platforms. The voting and promoting feature helps provide clarity on
              which songs feel right.&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3 text-sm">
              <SetMark size={8} />
              <span className="font-medium">Josh</span>
              <span className="text-muted-foreground">worship night planner</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="my-sets" className="scroll-mt-16 border-b border-rule bg-sunk">
        <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex items-baseline gap-4">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">My sets</h2>
            <span className="num text-[0.6875rem] text-muted-foreground">
              {isLoaded ? String(recentPlaylists.length).padStart(2, "0") : "—"} on this device
            </span>
          </div>

          {!isLoaded ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="sheet h-[84px] opacity-50" />
              ))}
            </div>
          ) : recentPlaylists.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentPlaylists.map((playlist) => (
                <li key={playlist.id}>
                  <button
                    onClick={() => router.push(`/p/${playlist.id}`)}
                    className="sheet group flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-shadow hover:shadow-lift-raised"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-rule bg-sunk">
                      {playlist.cover_url ? (
                        <img
                          src={playlist.cover_url}
                          alt=""
                          className="size-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <SetMark size={9} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block truncate text-sm font-medium group-hover:text-rubric">
                        {playlist.name}
                      </span>
                      <span className="num block text-[0.6875rem] text-muted-foreground">
                        {formatTimeAgo(playlist.viewedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-start gap-6 rounded-[3px] border border-dashed border-rule-strong px-6 py-12 sm:px-10 sm:py-16">
              <div className="flex items-center gap-2.5" aria-hidden="true">
                <IdeaMark size={11} />
                <IdeaMark size={11} tone="var(--rule-strong)" />
                <IdeaMark size={11} tone="var(--rule-strong)" />
              </div>
              <p className="prose-paper max-w-[58ch] text-base">
                Nothing here yet. Sets you open on this device show up here — no
                account, so nothing follows you between browsers.
              </p>
              <PrimaryAction onClick={createNewPlaylist} disabled={isCreating}>
                {isCreating ? "Creating…" : "Make the first one"}
              </PrimaryAction>
            </div>
          )}

          {recentSharedSongs.length > 0 && (
            <div className="mt-14">
              <div className="flex items-baseline gap-4">
                <h3 className="font-display text-lg font-semibold">Songs you shared</h3>
                <span className="num text-[0.6875rem] text-muted-foreground">
                  {String(recentSharedSongs.length).padStart(2, "0")}
                </span>
              </div>
              <ul className="sheet mt-5 divide-y divide-rule overflow-hidden">
                {recentSharedSongs.map((song) => (
                  <li key={song.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-rule bg-sunk">
                      {song.thumbnail_url ? (
                        <img
                          src={song.thumbnail_url}
                          alt=""
                          className="size-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <IdeaMark size={9} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block truncate text-sm font-medium">
                        {song.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {song.artist}
                      </span>
                    </span>
                    <button
                      onClick={() => copySongUrl(song.id)}
                      className="h-8 shrink-0 cursor-pointer rounded-[3px] border border-rule-strong px-3 text-xs transition-colors hover:bg-ink hover:text-stock"
                    >
                      {copiedSongId === song.id ? "Copied" : "Copy link"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="bg-rubric text-on-rubric">
        <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="font-display max-w-[15ch] text-4xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.25rem]">
            Send the link. See what your team <span className="italic">brings.</span>
          </h2>

          <div className="mt-12">
            <PrimaryAction
              scale="lg"
              tone="stock"
              onClick={createNewPlaylist}
              disabled={isCreating}
            >
              {isCreating ? "Creating…" : "Create a setlist"}
            </PrimaryAction>
          </div>

          {(stats.setlistsCreated > 0 || stats.songsShared > 0) && (
            <dl className="num mt-16 flex flex-wrap items-baseline gap-x-12 gap-y-4 border-t border-on-rubric/25 pt-6 text-sm">
              <div className="flex items-baseline gap-3">
                <dt className="text-on-rubric/75">Sets built</dt>
                <dd>{stats.setlistsCreated.toLocaleString()}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="text-on-rubric/75">Songs shared</dt>
                <dd>{stats.songsShared.toLocaleString()}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="text-on-rubric/75">Price</dt>
                <dd>0.00</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <Wordmark size={18} className="text-muted-foreground" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground sm:ml-auto">
            <a href="mailto:hello@category5.co" className="transition-colors hover:text-ink">
              hello@category5.co
            </a>
            <a
              href="https://category5.co"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
              aria-label="Category5"
            >
              <img src="/cat5-logo.svg" alt="Category5" className="h-4 w-auto dark:invert" />
            </a>
          </div>
        </div>
      </footer>

      <ImportSpotifyDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      <ShareSongDialog
        open={showShareSongDialog}
        onOpenChange={(open) => {
          setShowShareSongDialog(open)
          if (!open) loadSharedSongs()
        }}
      />
    </main>
  )
}
