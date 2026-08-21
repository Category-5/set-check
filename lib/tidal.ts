// Tidal API v2 helpers using the OAuth Client Credentials flow.
// Used to resolve Tidal track links directly.

import { normalizeForSearch, primaryArtist } from "./search-normalization"
import type { ResolvedPlaylist, ResolvedPlaylistTrack } from "./types"

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

export function isTidalPlaylistUrl(url: string): boolean {
  return /tidal\.com\/(?:browse\/)?playlist\/[0-9a-fA-F-]{36}/.test(url)
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/\/playlist\/([0-9a-fA-F-]{36})/)
  return match ? match[1] : null
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
      `${API_BASE}/searchResults?filter%5Bquery%5D=${query}&countryCode=US&include=tracks`,
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

const MAX_PLAYLIST_TRACKS = 200
const TRACK_BATCH_SIZE = 20

interface JsonApiRelationship {
  data?: { id: string; type: string }[]
}

interface JsonApiTrackResource {
  id: string
  type: string
  attributes?: {
    title?: string
    externalLinks?: { href: string; meta?: { type: string } }[]
  }
  relationships?: {
    artists?: JsonApiRelationship
    albums?: JsonApiRelationship
    coverArt?: JsonApiRelationship
  }
}

interface PlaylistResponse {
  data: {
    attributes: { name?: string }
    relationships: {
      coverArt?: JsonApiRelationship
      items?: JsonApiRelationship & { links?: { next?: string } }
    }
  }
  included?: (JsonApiTrackResource | JsonApiArtwork)[]
}

interface RelationshipPage {
  data?: { id: string; type: string }[]
  links?: { next?: string }
}

function pickArtworkUrl(artwork: JsonApiArtwork | undefined): string | null {
  if (!artwork) return null
  const files = [...artwork.attributes.files].sort((a, b) => a.meta.width - b.meta.width)
  return files[Math.min(2, files.length - 1)]?.href ?? null
}

async function fetchTrackIds(
  playlistId: string,
  initial: PlaylistResponse,
  headers: Record<string, string>
): Promise<string[]> {
  const ids = (initial.data.relationships.items?.data ?? [])
    .filter((item) => item.type === "tracks")
    .map((item) => item.id)

  let next = initial.data.relationships.items?.links?.next
  while (next && ids.length < MAX_PLAYLIST_TRACKS) {
    const response = await fetch(`${API_BASE}${next.replace(/^\/v2/, "")}`, { headers })
    if (!response.ok) break

    const page = (await response.json()) as RelationshipPage
    for (const item of page.data ?? []) {
      if (item.type === "tracks") ids.push(item.id)
    }
    next = page.links?.next
  }

  return ids.slice(0, MAX_PLAYLIST_TRACKS)
}

async function fetchTrackBatch(
  ids: string[],
  headers: Record<string, string>
): Promise<ResolvedPlaylistTrack[]> {
  const response = await fetch(
    `${API_BASE}/tracks?countryCode=US&filter%5Bid%5D=${ids.join(",")}&include=artists,albums.coverArt`,
    { headers }
  )
  if (!response.ok) return []

  const body = (await response.json()) as { data?: JsonApiTrackResource[]; included?: unknown[] }
  const included = (body.included ?? []) as (JsonApiTrackResource | JsonApiArtwork | JsonApiArtist)[]

  const artistsById = new Map(
    included
      .filter((item): item is JsonApiArtist => item.type === "artists")
      .map((artist) => [artist.id, artist.attributes.name])
  )
  const artworksById = new Map(
    included
      .filter((item): item is JsonApiArtwork => item.type === "artworks")
      .map((artwork) => [artwork.id, artwork])
  )
  const albumsById = new Map(
    included
      .filter((item): item is JsonApiTrackResource => item.type === "albums")
      .map((album) => [album.id, album])
  )

  const tracksById = new Map(
    (body.data ?? []).map((track) => {
      const artistName = (track.relationships?.artists?.data ?? [])
        .map((ref) => artistsById.get(ref.id))
        .filter(Boolean)
        .join(", ")

      const album = albumsById.get(track.relationships?.albums?.data?.[0]?.id ?? "")
      const artworkId = album?.relationships?.coverArt?.data?.[0]?.id
      const sharingLink = track.attributes?.externalLinks?.find(
        (link) => link.meta?.type === "TIDAL_SHARING"
      )

      const resolved: ResolvedPlaylistTrack = {
        title: track.attributes?.title ?? "Unknown Title",
        artistName: artistName || "Unknown Artist",
        album: (album?.attributes as { title?: string } | undefined)?.title ?? null,
        thumbnailUrl: pickArtworkUrl(artworkId ? artworksById.get(artworkId) : undefined),
        url: sharingLink?.href ?? `https://tidal.com/browse/track/${track.id}`,
      }
      return [track.id, resolved]
    })
  )

  return ids
    .map((id) => tracksById.get(id))
    .filter((track): track is ResolvedPlaylistTrack => Boolean(track))
}

// Resolve a public Tidal playlist via the Tidal API: playlist metadata,
// then the paginated item list, then batched track lookups for artists,
// album titles, and artwork.
export async function resolveTidalPlaylist(url: string): Promise<ResolvedPlaylist | null> {
  const id = extractPlaylistId(url)
  if (!id) return null

  const token = await getAccessToken()
  if (!token) return null

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.api+json",
  }

  try {
    const response = await fetch(
      `${API_BASE}/playlists/${id}?countryCode=US&include=items,coverArt`,
      { headers }
    )
    if (!response.ok) return null

    const playlist = (await response.json()) as PlaylistResponse
    const coverArtId = playlist.data.relationships.coverArt?.data?.[0]?.id
    const coverArt = (playlist.included ?? []).find(
      (item): item is JsonApiArtwork => item.type === "artworks" && item.id === coverArtId
    )

    const trackIds = await fetchTrackIds(id, playlist, headers)

    const tracks: ResolvedPlaylistTrack[] = []
    for (let i = 0; i < trackIds.length; i += TRACK_BATCH_SIZE) {
      tracks.push(...(await fetchTrackBatch(trackIds.slice(i, i + TRACK_BATCH_SIZE), headers)))
    }

    return {
      name: playlist.data.attributes.name || "Imported Setlist",
      coverUrl: pickArtworkUrl(coverArt),
      tracks,
    }
  } catch (error) {
    console.error("[tidal] Playlist lookup error:", error)
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
