import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import type { OdesliResponse } from "@/lib/types"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_BASE = "https://api.spotify.com/v1"
const ODESLI_API = "https://api.song.link/v1-alpha.1/links"

// Rate limiting: delay between Odesli API calls to avoid 429
const ODESLI_DELAY_MS = 300

interface SpotifyTrack {
  track: {
    id: string
    name: string
    artists: { name: string }[]
    album: {
      name: string
      images: { url: string }[]
    }
    external_urls: {
      spotify: string
    }
  } | null
}

interface SpotifyPlaylistResponse {
  name: string
  images: { url: string }[]
  tracks: {
    items: SpotifyTrack[]
    next: string | null
    total: number
  }
}

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured")
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token")
  }

  const data = await response.json()
  return data.access_token
}

function extractPlaylistId(url: string): string | null {
  // Match patterns like:
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const webMatch = url.match(/playlist\/([a-zA-Z0-9]+)/)
  if (webMatch) return webMatch[1]

  const uriMatch = url.match(/spotify:playlist:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  return null
}

async function fetchOdesliData(spotifyUrl: string): Promise<OdesliResponse | null> {
  try {
    const response = await fetch(
      `${ODESLI_API}?url=${encodeURIComponent(spotifyUrl)}&userCountry=US`
    )

    if (!response.ok) {
      console.log(`[v0] Odesli failed for ${spotifyUrl}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const entityId = data.entityUniqueId
    const entity = data.entitiesByUniqueId?.[entityId]

    if (!entity) return null

    const platformLinks: Record<string, string> = {}
    if (data.linksByPlatform) {
      const platformMappings: Record<string, string> = {
        spotify: "spotify",
        appleMusic: "appleMusic",
        youtube: "youtube",
        youtubeMusic: "youtubeMusic",
        amazonMusic: "amazonMusic",
        deezer: "deezer",
        tidal: "tidal",
        soundcloud: "soundcloud",
        pandora: "pandora",
      }

      for (const [platform, key] of Object.entries(platformMappings)) {
        const link = data.linksByPlatform[platform]
        if (link?.url) {
          platformLinks[key] = link.url
        }
      }
    }

    return {
      title: entity.title || "Unknown Title",
      artistName: entity.artistName || "Unknown Artist",
      album: entity.albumName,
      thumbnailUrl: entity.thumbnailUrl || null,
      platformLinks,
      odesliUrl: data.pageUrl || null,
    }
  } catch (error) {
    console.error(`[v0] Odesli error for ${spotifyUrl}:`, error)
    return null
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistUrl, createdBy } = body as {
      playlistUrl: string
      createdBy?: string | null
    }

    if (!playlistUrl) {
      return NextResponse.json(
        { error: "Playlist URL is required" },
        { status: 400 }
      )
    }

    const spotifyPlaylistId = extractPlaylistId(playlistUrl)
    if (!spotifyPlaylistId) {
      return NextResponse.json(
        { error: "Invalid Spotify playlist URL" },
        { status: 400 }
      )
    }

    // Get Spotify access token
    let accessToken: string
    try {
      accessToken = await getSpotifyAccessToken()
    } catch {
      return NextResponse.json(
        { error: "Spotify integration not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
        { status: 500 }
      )
    }

    // Fetch playlist from Spotify (without fields filter to ensure we get all data)
    const playlistResponse = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${spotifyPlaylistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!playlistResponse.ok) {
      if (playlistResponse.status === 404) {
        return NextResponse.json(
          { error: "Playlist not found. Make sure the playlist is public." },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "Failed to fetch Spotify playlist" },
        { status: 500 }
      )
    }

    const playlistData = await playlistResponse.json()
    
    console.log("[v0] Spotify playlist response keys:", Object.keys(playlistData))
    console.log("[v0] Tracks structure:", playlistData.tracks ? Object.keys(playlistData.tracks) : "no tracks key")
    console.log("[v0] Tracks items count:", playlistData.tracks?.items?.length ?? "no items")
    console.log("[v0] Tracks total:", playlistData.tracks?.total ?? "no total")
    console.log("[v0] First track sample:", JSON.stringify(playlistData.tracks?.items?.[0], null, 2)?.substring(0, 500))

    // Handle different API response structures
    let trackItems: SpotifyTrack[] = []
    if (playlistData.tracks?.items) {
      // Standard structure: { tracks: { items: [...] } }
      trackItems = playlistData.tracks.items
    } else if (Array.isArray(playlistData.tracks)) {
      // Alternative structure: { tracks: [...] }
      trackItems = playlistData.tracks
    } else if (playlistData.items) {
      // Direct items structure
      trackItems = playlistData.items
    }
    
    console.log("[v0] Found track items:", trackItems.length)

    // Create the setlist in our database
    const supabase = await createClient()
    const newPlaylistId = nanoid(10)

    const { error: createError } = await supabase.from("playlists").insert({
      id: newPlaylistId,
      name: playlistData.name || "Imported Setlist",
      description: `Imported from Spotify`,
      cover_url: playlistData.images?.[0]?.url || null,
      created_by: createdBy,
      external_link: playlistUrl,
    })

    if (createError) {
      console.error("[v0] Error creating playlist:", createError)
      return NextResponse.json(
        { error: "Failed to create setlist" },
        { status: 500 }
      )
    }

    // Process tracks and add them to the setlist
    const tracks = trackItems.filter(item => item.track !== null)
    const addedSongs: { title: string; artist: string; success: boolean }[] = []
    let position = 0

    for (const item of tracks) {
      if (!item.track) continue

      const spotifyUrl = item.track.external_urls.spotify
      
      // Fetch magic links from Odesli
      const odesliData = await fetchOdesliData(spotifyUrl)
      
      // Prepare song data - use Odesli data if available, otherwise use Spotify data
      const songData = {
        id: nanoid(10),
        playlist_id: newPlaylistId,
        title: odesliData?.title || item.track.name,
        artist: odesliData?.artistName || item.track.artists.map(a => a.name).join(", "),
        album: odesliData?.album || item.track.album.name || null,
        thumbnail_url: odesliData?.thumbnailUrl || item.track.album.images?.[0]?.url || null,
        platform_links: odesliData?.platformLinks || { spotify: spotifyUrl },
        position,
        added_by: createdBy || null,
        is_promoted: true, // Imported songs go directly to setlist
      }

      const { error: songError } = await supabase.from("songs").insert(songData)

      addedSongs.push({
        title: songData.title,
        artist: songData.artist,
        success: !songError,
      })

      if (!songError) {
        position++
      }

      // Delay to avoid rate limiting from Odesli
      await delay(ODESLI_DELAY_MS)
    }

    const successCount = addedSongs.filter(s => s.success).length

    return NextResponse.json({
      playlistId: newPlaylistId,
      playlistName: playlistData.name,
      totalTracks: tracks.length,
      addedTracks: successCount,
      songs: addedSongs,
    })
  } catch (error) {
    console.error("[v0] Import Spotify playlist error:", error)
    return NextResponse.json(
      { error: "Failed to import playlist" },
      { status: 500 }
    )
  }
}
