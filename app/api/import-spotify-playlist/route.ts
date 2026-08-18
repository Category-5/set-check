/**
 * Spotify Playlist Import API
 * 
 * IMPORTANT: This uses Spotify's PUBLIC EMBED endpoint, NOT the official Spotify API.
 * 
 * Why not use the Spotify API?
 * - The Spotify API with Client Credentials Flow (app-only auth) returns 403 Forbidden
 *   when trying to access playlist tracks via the /playlists/{id}/tracks endpoint.
 * - The main /playlists/{id} endpoint also does NOT include tracks in the response
 *   when using Client Credentials Flow (as of 2026).
 * - User OAuth would require users to log in with Spotify, which is not needed for
 *   importing public playlists.
 * 
 * Solution: Fetch Spotify's embed page (open.spotify.com/embed/playlist/{id})
 * The embed page contains a __NEXT_DATA__ script tag with all playlist data including tracks.
 * This is publicly accessible and doesn't require authentication.
 * 
 * Track data location in __NEXT_DATA__:
 * - Path: props.pageProps.state.data.entity
 * - Tracks are in the `trackList` property (NOT `tracks.items`)
 * - Each track has: uri, title, subtitle (artist), album, images, duration, etc.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import type { SongLookupResult } from "@/lib/types"
import { ensureAppleMusicLink } from "@/lib/apple-music"

// Rate limiting: delay between iTunes lookups to avoid getting throttled
const LOOKUP_DELAY_MS = 300

interface SpotifyEmbedTrack {
  uri: string
  uid: string
  title: string
  subtitle: string
  isExplicit: boolean
  duration: number
  isPlayable: boolean
  album?: {
    name: string
    uri: string
  }
  artists?: {
    name: string
    uri: string
  }[]
  images?: {
    url: string
    width: number
    height: number
  }[]
}

interface SpotifyEmbedResponse {
  type: string
  name: string
  images?: { url: string }[]
  coverArt?: { sources: { url: string }[] }
  tracks?: {
    items: SpotifyEmbedTrack[]
  }
  trackList?: SpotifyEmbedTrack[]
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

function spotifyUriToUrl(uri: string): string {
  // Convert spotify:track:xxx to https://open.spotify.com/track/xxx
  const parts = uri.split(":")
  if (parts.length === 3) {
    return `https://open.spotify.com/${parts[1]}/${parts[2]}`
  }
  return uri
}

// Resolves cross-platform links for a track pulled from the Spotify embed page.
// The source is always Spotify here, so we only need to fill in Apple Music.
async function resolveCrossPlatformLinks(
  spotifyUrl: string,
  title: string,
  artistName: string,
  thumbnailUrl: string | null
): Promise<SongLookupResult> {
  const platformLinks: Record<string, string> = { spotify: spotifyUrl }
  await ensureAppleMusicLink(platformLinks, title, artistName)

  return {
    title,
    artistName,
    thumbnailUrl,
    platformLinks,
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

    // Use Spotify's embed endpoint which doesn't require authentication
    const embedUrl = `https://open.spotify.com/embed/playlist/${spotifyPlaylistId}`
    
    // Fetch the embed HTML page
    const embedResponse = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    })

    if (!embedResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch playlist. Make sure the playlist is public." },
        { status: 500 }
      )
    }

    const embedHtml = await embedResponse.text()
    
    // Extract the __NEXT_DATA__ JSON from the embed page
    const scriptMatch = embedHtml.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    
    if (!scriptMatch) {
      return NextResponse.json(
        { error: "Failed to parse playlist data" },
        { status: 500 }
      )
    }

    let nextData: Record<string, unknown>
    try {
      nextData = JSON.parse(scriptMatch[1])
    } catch {
      return NextResponse.json(
        { error: "Failed to parse playlist data" },
        { status: 500 }
      )
    }

    // Extract pageProps from the Next.js data structure
    const pageProps = (nextData.props as Record<string, unknown>)?.pageProps as Record<string, unknown>
    
    // Try different possible paths to find the playlist data (Spotify's structure may vary)
    let playlistData: SpotifyEmbedResponse | null = null
    
    // Path 1: state.data.entity (primary path for Spotify embeds)
    const state = pageProps?.state as Record<string, unknown>
    if (state?.data) {
      playlistData = (state.data as Record<string, unknown>)?.entity as SpotifyEmbedResponse
    }
    
    // Path 2: Direct pageProps
    if (!playlistData && pageProps?.name) {
      playlistData = pageProps as unknown as SpotifyEmbedResponse
    }
    
    // Path 3: pageProps.data
    if (!playlistData && pageProps?.data) {
      console.log("[v0] pageProps.data keys:", Object.keys(pageProps.data as object))
      playlistData = pageProps.data as SpotifyEmbedResponse
    }

    // Path 4: state.item
    if (!playlistData && state?.item) {
      console.log("[v0] state.item found")
      playlistData = state.item as SpotifyEmbedResponse
    }
    
    console.log("[v0] Playlist data found:", !!playlistData)
    console.log("[v0] Playlist name:", playlistData?.name)
    console.log("[v0] Playlist type:", playlistData?.type)
    console.log("[v0] Playlist keys:", playlistData ? Object.keys(playlistData) : "none")
    console.log("[v0] Has trackList:", !!playlistData?.trackList)
    console.log("[v0] TrackList count:", playlistData?.trackList?.length)
    console.log("[v0] Has tracks:", !!playlistData?.tracks)
    console.log("[v0] Track count:", playlistData?.tracks?.items?.length)

    if (!playlistData) {
      console.log("[v0] No playlist data found in any path")
      return NextResponse.json(
        { error: "Failed to extract playlist data" },
        { status: 500 }
      )
    }

    // IMPORTANT: Spotify embed uses `trackList` (array on entity) NOT `tracks.items`
    // This was the key fix - the Spotify embed format changed and tracks are now in trackList
    const trackItems = playlistData.trackList || playlistData.tracks?.items || []
    console.log("[v0] Found tracks:", trackItems.length)

    if (trackItems.length === 0) {
      return NextResponse.json(
        { error: "No tracks found in playlist" },
        { status: 400 }
      )
    }

    // Create the setlist in our database
    const supabase = await createClient()
    const newPlaylistId = nanoid(10)

    const coverUrl = playlistData.coverArt?.sources?.[0]?.url || 
                     playlistData.images?.[0]?.url || 
                     null

    const { error: createError } = await supabase.from("playlists").insert({
      id: newPlaylistId,
      name: playlistData.name || "Imported Setlist",
      description: `Imported from Spotify`,
      cover_url: coverUrl,
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
    const addedSongs: { title: string; artist: string; success: boolean }[] = []
    let position = 0

    for (const track of trackItems) {
      if (!track.uri) continue

      const spotifyUrl = spotifyUriToUrl(track.uri)

      // Get artist name from track data
      const artistName = track.subtitle ||
                         track.artists?.map(a => a.name).join(", ") ||
                         "Unknown Artist"

      // Get thumbnail from track images or album
      const thumbnailUrl = track.images?.[0]?.url || null

      const lookupResult = await resolveCrossPlatformLinks(
        spotifyUrl,
        track.title,
        artistName,
        thumbnailUrl
      )

      const songData = {
        id: nanoid(10),
        playlist_id: newPlaylistId,
        title: lookupResult.title,
        artist: lookupResult.artistName,
        album: track.album?.name || null,
        thumbnail_url: lookupResult.thumbnailUrl,
        platform_links: lookupResult.platformLinks,
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

      // Delay to avoid hammering the iTunes Search API
      await delay(LOOKUP_DELAY_MS)
    }

    const successCount = addedSongs.filter(s => s.success).length

    return NextResponse.json({
      playlistId: newPlaylistId,
      playlistName: playlistData.name,
      totalTracks: trackItems.length,
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
