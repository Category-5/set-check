import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SongLookupResult } from "@/lib/types"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, position, songData: lookupResult, addedBy } = body as {
      playlistId: string
      position: number
      songData: SongLookupResult
      addedBy?: string | null
    }

    if (!playlistId || position === undefined || !lookupResult) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify playlist exists
    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", playlistId)
      .single()

    if (playlistError || !playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      )
    }

    // Create the song - new songs start in Ideas (is_promoted = false)
    const newSong = {
      id: nanoid(10),
      playlist_id: playlistId,
      title: lookupResult.title,
      artist: lookupResult.artistName,
      album: lookupResult.album || null,
      thumbnail_url: lookupResult.thumbnailUrl,
      platform_links: lookupResult.platformLinks,
      position,
      added_by: addedBy || null,
      is_promoted: false,
    }

    const { data: song, error: songError } = await supabase
      .from("songs")
      .insert(newSong)
      .select()
      .single()

    if (songError) {
      console.error("Error creating song:", songError)
      return NextResponse.json(
        { error: "Failed to add song" },
        { status: 500 }
      )
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error("Add song error:", error)
    return NextResponse.json(
      { error: "Failed to add song" },
      { status: 500 }
    )
  }
}
