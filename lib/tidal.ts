// Tidal API v2 helpers using the OAuth Client Credentials flow.
// Used to resolve Tidal track links directly.

const TOKEN_URL = "https://auth.tidal.com/v1/oauth2/token"
const API_BASE = "https://openapi.tidal.com/v2"

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.TIDAL_CLIENT_ID
  const clientSecret = process.env.TIDAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn("[tidal] TIDAL_CLIENT_ID/SECRET not set — cannot resolve Tidal links")
    return null
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    console.error(`[tidal] Token request failed: ${response.status}`)
    return null
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

export function isTidalUrl(url: string): boolean {
  return url.includes("tidal.com")
}

// Strip parenthetical/bracketed qualifiers ("(feat. X)", "[Remastered 2011]")
// that hurt match quality across platforms.
function normalizeForSearch(s: string): string {
  return s
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Take only the first artist when multiple are joined by ", " or " & " /
// " feat. " — the lead artist gives the most reliable cross-platform match.
function primaryArtist(artist: string): string {
  return artist.split(/,| & | feat\.? | with /i)[0].trim()
}

function extractTrackId(url: string): string | null {
  const match = url.match(/\/track\/(\d+)/)
  return match ? match[1] : null
}

interface JsonApiArtwork {
  id: string
  type: "artworks"
  attributes: {
    files: { href: string; meta: { width: number; height: number } }[]
  }
}

interface JsonApiArtist {
  id: string
  type: "artists"
  attributes: { name: string }
}

interface JsonApiAlbum {
  id: string
  type: "albums"
}

interface TrackResponse {
  data: {
    id: string
    attributes: {
      title: string
      externalLinks?: { href: string; meta?: { type: string } }[]
    }
    relationships: {
      artists: { data: { id: string; type: string }[] }
      albums?: { data: { id: string; type: string }[] }
    }
  }
  included?: (JsonApiArtwork | JsonApiArtist | JsonApiAlbum)[]
}

export interface TidalResolvedTrack {
  title: string
  artistName: string
  thumbnailUrl: string | null
  tidalUrl: string
}

// Resolve a Tidal track URL directly via the Tidal API (GET /v2/tracks/{id}).
export async function resolveTidalUrl(url: string): Promise<TidalResolvedTrack | null> {
  const id = extractTrackId(url)
  if (!id) return null

  const token = await getAccessToken()
  if (!token) return null

  try {
    const response = await fetch(
      `${API_BASE}/tracks/${id}?countryCode=US&include=artists,albums.coverArt`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.api+json",
        },
      }
    )
    if (!response.ok) return null

    const data = (await response.json()) as TrackResponse
    const included = data.included ?? []

    const artistIds = new Set(data.data.relationships.artists.data.map((a) => a.id))
    const artistName = included
      .filter((item): item is JsonApiArtist => item.type === "artists" && artistIds.has(item.id))
      .map((artist) => artist.attributes.name)
      .join(", ")

    const artwork = included.find((item): item is JsonApiArtwork => item.type === "artworks")
    const thumbnailUrl =
      artwork?.attributes.files.sort((a, b) => a.meta.width - b.meta.width)[
        Math.min(2, artwork.attributes.files.length - 1)
      ]?.href ?? null

    const sharingLink = data.data.attributes.externalLinks?.find(
      (link) => link.meta?.type === "TIDAL_SHARING"
    )

    return {
      title: data.data.attributes.title,
      artistName: artistName || "Unknown Artist",
      thumbnailUrl,
      tidalUrl: sharingLink?.href ?? url,
    }
  } catch (error) {
    console.error("[tidal] Track lookup error:", error)
    return null
  }
}

interface SearchResultsResponse {
  included?: {
    id: string
    type: string
    attributes?: {
      externalLinks?: { href: string; meta?: { type: string } }[]
    }
  }[]
}

export async function searchTidalTrack(title: string, artist: string): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null

  const cleanTitle = normalizeForSearch(title)
  const cleanArtist = normalizeForSearch(primaryArtist(artist))
  if (!cleanTitle || !cleanArtist) return null

  const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`)

  try {
    const response = await fetch(
      `${API_BASE}/searchresults/${query}?countryCode=US&include=tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.api+json",
        },
      }
    )
    if (!response.ok) return null

    const data = (await response.json()) as SearchResultsResponse
    const track = data.included?.find((item) => item.type === "tracks")
    if (!track) return null

    const sharingLink = track.attributes?.externalLinks?.find(
      (link) => link.meta?.type === "TIDAL_SHARING"
    )
    return sharingLink?.href ?? null
  } catch (error) {
    console.error("[tidal] Search error:", error)
    return null
  }
}

// Fill in a missing Tidal link via Tidal search using the resolved
// title/artist. Mutates and returns the same object.
export async function ensureTidalLink(
  platformLinks: Record<string, string>,
  title: string,
  artist: string
): Promise<Record<string, string>> {
  if (platformLinks.tidal) return platformLinks

  const tidalUrl = await searchTidalTrack(title, artist)
  if (tidalUrl) {
    platformLinks.tidal = tidalUrl
  }
  return platformLinks
}
