import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import type { ResolvedPlaylist } from "@/lib/types"
import { ensureSpotifyLink, isSpotifyPlaylistUrl, resolveSpotifyPlaylist } from "@/lib/spotify"
import {
  ensureAppleMusicLink,
  isAppleMusicPlaylistUrl,
  resolveAppleMusicPlaylist,
} from "@/lib/apple-music"
import { ensureTidalLink, isTidalPlaylistUrl, resolveTidalPlaylist } from "@/lib/tidal"

const LOOKUP_DELAY_MS = 300

type EnsureLink = (
  platformLinks: Record<string, string>,
  title: string,
  artist: string
) => Promise<Record<string, string>>

interface PlaylistProvider {
  key: string
  name: string
  matches: (url: string) => boolean
  resolve: (url: string) => Promise<ResolvedPlaylist | null>
  ensureOthers: EnsureLink[]
}

const PROVIDERS: PlaylistProvider[] = [
  {
    key: "spotify",
    name: "Spotify",
    matches: isSpotifyPlaylistUrl,
    resolve: resolveSpotifyPlaylist,
    ensureOthers: [ensureAppleMusicLink, ensureTidalLink],
  },
  {
    key: "appleMusic",
    name: "Apple Music",
    matches: isAppleMusicPlaylistUrl,
    resolve: resolveAppleMusicPlaylist,
    ensureOthers: [ensureSpotifyLink, ensureTidalLink],
  },
  {
    key: "tidal",
    name: "Tidal",
    matches: isTidalPlaylistUrl,
    resolve: resolveTidalPlaylist,
    ensureOthers: [ensureSpotifyLink, ensureAppleMusicLink],
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistUrl, createdBy } = body as {
      playlistUrl: string
      createdBy?: string | null
    }

    if (!playlistUrl) {
      return NextResponse.json({ error: "Playlist URL is required" }, { status: 400 })
    }

    const provider = PROVIDERS.find((p) => p.matches(playlistUrl))
    if (!provider) {
      return NextResponse.json(
        { error: "Unsupported link. Paste a Spotify, Apple Music, or Tidal playlist link." },
        { status: 400 }
      )
    }

    const playlist = await provider.resolve(playlistUrl)
    if (!playlist) {
      return NextResponse.json(
        { error: `Failed to fetch playlist from ${provider.name}. Make sure the playlist is public.` },
        { status: 500 }
      )
    }

    if (playlist.tracks.length === 0) {
      return NextResponse.json({ error: "No tracks found in playlist" }, { status: 400 })
    }

    const supabase = await createClient()
    const newPlaylistId = nanoid(10)

    const { error: createError } = await supabase.from("playlists").insert({
      id: newPlaylistId,
      name: playlist.name,
      description: `Imported from ${provider.name}`,
      cover_url: playlist.coverUrl,
      created_by: createdBy,
      external_link: playlistUrl,
    })

    if (createError) {
      console.error("Error creating playlist:", createError)
      return NextResponse.json({ error: "Failed to create setlist" }, { status: 500 })
    }

    const addedSongs: { title: string; artist: string; success: boolean }[] = []
    let position = 0

    for (const track of playlist.tracks) {
      const platformLinks: Record<string, string> = { [provider.key]: track.url }
      for (const ensureLink of provider.ensureOthers) {
        await ensureLink(platformLinks, track.title, track.artistName)
      }

      const { error: songError } = await supabase.from("songs").insert({
        id: nanoid(10),
        playlist_id: newPlaylistId,
        title: track.title,
        artist: track.artistName,
        album: track.album,
        thumbnail_url: track.thumbnailUrl,
        platform_links: platformLinks,
        position,
        added_by: createdBy || null,
        is_promoted: true,
      })

      addedSongs.push({
        title: track.title,
        artist: track.artistName,
        success: !songError,
      })

      if (!songError) {
        position++
      }

      await delay(LOOKUP_DELAY_MS)
    }

    return NextResponse.json({
      playlistId: newPlaylistId,
      playlistName: playlist.name,
      totalTracks: playlist.tracks.length,
      addedTracks: addedSongs.filter((s) => s.success).length,
      songs: addedSongs,
    })
  } catch (error) {
    console.error("Import playlist error:", error)
    return NextResponse.json({ error: "Failed to import playlist" }, { status: 500 })
  }
}
