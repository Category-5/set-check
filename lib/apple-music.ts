// Apple Music / iTunes API helpers.
// The iTunes Search and Lookup APIs are public and require no key.

import { normalizeForSearch, primaryArtist } from "./search-normalization"
import type { ResolvedPlaylist, ResolvedPlaylistTrack } from "./types"

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
const ITUNES_LOOKUP_URL = "https://itunes.apple.com/lookup"

export function isAppleMusicUrl(url: string): boolean {
  return url.includes("music.apple.com") || url.includes("itunes.apple.com")
}

export function isAppleMusicPlaylistUrl(url: string): boolean {
  return /music\.apple\.com\/[a-z-]+\/playlist\/[^/]+\/(pl\.[a-zA-Z0-9-]+)/.test(url)
}

// Extract the iTunes track ID from an Apple Music URL.
// Handles:
//   music.apple.com/us/song/title/1234567890
//   music.apple.com/us/album/name/albumId?i=trackId
//   itunes.apple.com/us/album/name/id1234567890?i=trackId
function extractTrackId(url: string): string | null {
  const trackParam = url.match(/[?&]i=(\d+)/)
  if (trackParam) return trackParam[1]

  const songPath = url.match(/\/song\/[^/]+\/(\d+)/)
  if (songPath) return songPath[1]

  return null
}

interface ItunesTrack {
  title: string
  artistName: string
  thumbnailUrl: string | null
  appleMusicUrl: string
}

async function lookupById(id: string): Promise<ItunesTrack | null> {
  try {
    const response = await fetch(`${ITUNES_LOOKUP_URL}?id=${id}&entity=song`)
    if (!response.ok) return null

    const data = (await response.json()) as {
      resultCount: number
      results: Array<{
        kind?: string
        trackName?: string
        artistName?: string
        artworkUrl100?: string
        trackViewUrl?: string
      }>
    }

    const item = data.results?.[0]
    if (!item || item.kind !== "song") return null

    return {
      title: item.trackName || "Unknown Title",
      artistName: item.artistName || "Unknown Artist",
      thumbnailUrl: item.artworkUrl100?.replace(/\d+x\d+bb\.jpg$/, "500x500bb.jpg") ?? null,
      appleMusicUrl: item.trackViewUrl || "",
    }
  } catch {
    return null
  }
}

export async function resolveAppleMusicUrl(url: string): Promise<ItunesTrack | null> {
  const id = extractTrackId(url)
  if (!id) return null
  return lookupById(id)
}

export async function searchAppleMusicTrack(
  title: string,
  artist: string
): Promise<string | null> {
  try {
    const q = `${normalizeForSearch(title)} ${normalizeForSearch(primaryArtist(artist))}`.trim()
    if (!q) return null
    const searchUrl = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5`

    const response = await fetch(searchUrl)
    if (!response.ok) return null

    const data = (await response.json()) as {
      results: Array<{
        kind?: string
        trackViewUrl?: string
      }>
    }

    const item = data.results?.find((r) => r.kind === "song")
    return item?.trackViewUrl ?? null
  } catch {
    return null
  }
}

interface ApplePageSection {
  id: string
  items?: {
    title?: string
    artistName?: string
    artwork?: { dictionary?: { url?: string } }
    contentDescriptor?: { url?: string }
    tertiaryLinks?: { title?: string }[]
  }[]
}

function appleArtworkUrl(template: string | undefined): string | null {
  if (!template) return null
  return template.replace("{w}x{h}bb.{f}", "500x500bb.jpg")
}

// Parse the playlist out of an Apple Music web page's serialized-server-data
// JSON. Exported for tests.
export function parseAppleMusicPlaylistPage(html: string): ResolvedPlaylist | null {
  const scriptMatch = html.match(
    /<script type="application\/json" id="serialized-server-data">([\s\S]*?)<\/script>/
  )
  if (!scriptMatch) return null

  let sections: ApplePageSection[]
  try {
    const serialized = JSON.parse(scriptMatch[1]) as { data?: { data?: { sections?: ApplePageSection[] } }[] }
    const found = serialized.data?.[0]?.data?.sections
    if (!found) return null
    sections = found
  } catch {
    return null
  }

  const header = sections.find((s) => s.id.startsWith("playlist-detail-header"))?.items?.[0]
  const trackItems = sections.find((s) => s.id.startsWith("track-list"))?.items ?? []

  const tracks: ResolvedPlaylistTrack[] = trackItems
    .filter((item) => item.contentDescriptor?.url)
    .map((item) => ({
      title: item.title || "Unknown Title",
      artistName: item.artistName || "Unknown Artist",
      album: item.tertiaryLinks?.[0]?.title ?? null,
      thumbnailUrl: appleArtworkUrl(item.artwork?.dictionary?.url),
      url: item.contentDescriptor!.url!,
    }))

  return {
    name: header?.title || "Imported Setlist",
    coverUrl: appleArtworkUrl(header?.artwork?.dictionary?.url),
    tracks,
  }
}

// Resolve a public Apple Music playlist by scraping its web page, which
// serializes the full track list. The Apple Music API proper requires a
// developer token, which the app does not have.
export async function resolveAppleMusicPlaylist(url: string): Promise<ResolvedPlaylist | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    })
    if (!response.ok) return null

    return parseAppleMusicPlaylistPage(await response.text())
  } catch (error) {
    console.error("[apple-music] Playlist lookup error:", error)
    return null
  }
}

export async function ensureAppleMusicLink(
  platformLinks: Record<string, string>,
  title: string,
  artist: string
): Promise<Record<string, string>> {
  if (platformLinks.appleMusic) return platformLinks

  const appleMusicUrl = await searchAppleMusicTrack(title, artist)
  if (appleMusicUrl) {
    platformLinks.appleMusic = appleMusicUrl
  }
  return platformLinks
}
