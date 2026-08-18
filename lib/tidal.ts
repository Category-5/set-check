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
