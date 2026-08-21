// Spotify Web API helper using Client Credentials Flow.
// Used as a fallback to fill in a Spotify link when resolving from Apple Music or Tidal.

import { normalizeForSearch, primaryArtist } from "./search-normalization"
import type { ResolvedPlaylist, ResolvedPlaylistTrack } from "./types"

const TOKEN_URL = "https://accounts.spotify.com/api/token"
const SEARCH_URL = "https://api.spotify.com/v1/search"

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn("[spotify] SPOTIFY_CLIENT_ID/SECRET not set — cannot use Spotify fallback")
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
    console.error(`[spotify] Token request failed: ${response.status}`)
    return null
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

export function isSpotifyUrl(url: string): boolean {
  return url.includes("open.spotify.com/track") || url.includes("spotify.link")
}

export function isSpotifyPlaylistUrl(url: string): boolean {
  return /open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/.test(url) ||
    /spotify:playlist:[a-zA-Z0-9]+/.test(url)
}

function extractTrackId(url: string): string | null {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

// spotify.link short URLs carry no track ID; follow the redirect chain to
// the canonical open.spotify.com URL first.
export async function expandSpotifyShortLink(url: string): Promise<string> {
  if (!url.includes("spotify.link")) return url
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" })
    return response.url || url
  } catch {
    return url
  }
}

export interface SpotifyResolvedTrack {
  title: string
  artistName: string
  thumbnailUrl: string | null
  spotifyUrl: string
}

// Resolve a Spotify track URL directly via the Spotify API (GET /v1/tracks/{id}).
export async function resolveSpotifyUrl(url: string): Promise<SpotifyResolvedTrack | null> {
  const expandedUrl = await expandSpotifyShortLink(url)
  const id = extractTrackId(expandedUrl)
  if (!id) return null

  const token = await getAccessToken()
  if (!token) return null

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${id}?market=US`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null

    const track = (await response.json()) as {
      name: string
      artists: { name: string }[]
      album: { images: { url: string; width: number }[] }
      external_urls: { spotify: string }
    }

    return {
      title: track.name,
      artistName: track.artists.map((a) => a.name).join(", "),
      thumbnailUrl: track.album.images?.[0]?.url ?? null,
      spotifyUrl: track.external_urls.spotify,
    }
  } catch (error) {
    console.error("[spotify] Track lookup error:", error)
    return null
  }
}

export interface SpotifyTrackResult {
  title: string
  artist: string
  album: string
  thumbnailUrl: string | null
  spotifyUrl: string
  durationMs: number
}

export async function searchSpotifyTrack(
  title: string,
  artist: string
): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null

  const cleanTitle = normalizeForSearch(title)
  const cleanArtist = normalizeForSearch(primaryArtist(artist))
  if (!cleanTitle || !cleanArtist) return null

  const q = `track:${cleanTitle} artist:${cleanArtist}`
  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&type=track&limit=1&market=US`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error(`[spotify] Search failed (${response.status}) for "${title}" / "${artist}"`)
      return null
    }

    const data = (await response.json()) as {
      tracks?: { items?: { external_urls?: { spotify?: string } }[] }
    }
    return data.tracks?.items?.[0]?.external_urls?.spotify ?? null
  } catch (error) {
    console.error("[spotify] Search error:", error)
    return null
  }
}

export async function searchSpotifyTracks(
  query: string,
  limit = 10
): Promise<SpotifyTrackResult[]> {
  const token = await getAccessToken()
  if (!token) return []

  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=US`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error(`[spotify] Search failed (${response.status}) for query "${query}"`)
      return []
    }

    const data = (await response.json()) as {
      tracks?: {
        items?: {
          name: string
          artists: { name: string }[]
          album: { name: string; images: { url: string; width: number }[] }
          external_urls: { spotify: string }
          duration_ms: number
        }[]
      }
    }

    return (data.tracks?.items ?? []).map((track) => ({
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      thumbnailUrl: track.album.images?.[1]?.url ?? track.album.images?.[0]?.url ?? null,
      spotifyUrl: track.external_urls.spotify,
      durationMs: track.duration_ms,
    }))
  } catch (error) {
    console.error("[spotify] Search error:", error)
    return []
  }
}

interface SpotifyEmbedTrack {
  uri: string
  title: string
  subtitle?: string
  album?: { name: string }
  artists?: { name: string }[]
  images?: { url: string }[]
}

interface SpotifyEmbedEntity {
  name?: string
  images?: { url: string }[]
  coverArt?: { sources: { url: string }[] }
  tracks?: { items: SpotifyEmbedTrack[] }
  trackList?: SpotifyEmbedTrack[]
}

function extractPlaylistId(url: string): string | null {
  const webMatch = url.match(/playlist\/([a-zA-Z0-9]+)/)
  if (webMatch) return webMatch[1]

  const uriMatch = url.match(/spotify:playlist:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  return null
}

function spotifyUriToUrl(uri: string): string {
  const parts = uri.split(":")
  if (parts.length === 3) {
    return `https://open.spotify.com/${parts[1]}/${parts[2]}`
  }
  return uri
}

// Parse the playlist entity out of a Spotify embed page's __NEXT_DATA__ JSON.
// Exported for tests.
export function parseSpotifyEmbedPlaylist(embedHtml: string): ResolvedPlaylist | null {
  const scriptMatch = embedHtml.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  )
  if (!scriptMatch) return null

  let nextData: Record<string, unknown>
  try {
    nextData = JSON.parse(scriptMatch[1])
  } catch {
    return null
  }

  const pageProps = (nextData.props as Record<string, unknown>)?.pageProps as Record<string, unknown>
  const state = pageProps?.state as Record<string, unknown>

  const entity =
    ((state?.data as Record<string, unknown>)?.entity as SpotifyEmbedEntity) ||
    (pageProps?.name ? (pageProps as unknown as SpotifyEmbedEntity) : null) ||
    (pageProps?.data as SpotifyEmbedEntity) ||
    (state?.item as SpotifyEmbedEntity)

  if (!entity) return null

  // The Spotify embed keeps tracks in `trackList`; older payloads used `tracks.items`.
  const trackItems = entity.trackList || entity.tracks?.items || []

  const tracks: ResolvedPlaylistTrack[] = trackItems
    .filter((track) => track.uri)
    .map((track) => ({
      title: track.title,
      artistName:
        track.subtitle || track.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
      album: track.album?.name ?? null,
      thumbnailUrl: track.images?.[0]?.url ?? null,
      url: spotifyUriToUrl(track.uri),
    }))

  return {
    name: entity.name || "Imported Setlist",
    coverUrl: entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || null,
    tracks,
  }
}

// Resolve a public Spotify playlist without authentication via the embed
// page, which serializes the full track list into __NEXT_DATA__. The
// official API refuses playlist tracks under Client Credentials Flow.
export async function resolveSpotifyPlaylist(url: string): Promise<ResolvedPlaylist | null> {
  const id = extractPlaylistId(url)
  if (!id) return null

  try {
    const response = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    })
    if (!response.ok) return null

    return parseSpotifyEmbedPlaylist(await response.text())
  } catch (error) {
    console.error("[spotify] Playlist lookup error:", error)
    return null
  }
}

// Fill in a missing Spotify link via Spotify search using the resolved
// title/artist. Mutates and returns the same object.
export async function ensureSpotifyLink(
  platformLinks: Record<string, string>,
  title: string,
  artist: string
): Promise<Record<string, string>> {
  if (platformLinks.spotify) return platformLinks

  const spotifyUrl = await searchSpotifyTrack(title, artist)
  if (spotifyUrl) {
    platformLinks.spotify = spotifyUrl
  }
  return platformLinks
}
