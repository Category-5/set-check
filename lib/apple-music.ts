// Apple Music / iTunes API helpers.
// The iTunes Search and Lookup APIs are public and require no key.

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
const ITUNES_LOOKUP_URL = "https://itunes.apple.com/lookup"

export function isAppleMusicUrl(url: string): boolean {
  return url.includes("music.apple.com") || url.includes("itunes.apple.com")
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
    const q = `${title} ${artist}`
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
