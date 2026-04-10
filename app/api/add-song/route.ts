import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { OdesliResponse } from "@/lib/types"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playlistId, position, odesliData } = body as {
      playlistId: string
      position: number
      odesliData: OdesliResponse
    }

    if (!playlistId || position === undefined || !odesliData) {
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

    // Create the song
    const songData = {
      id: nanoid(10),
      playlist_id: playlistId,
      title: odesliData.title,
      artist: odesliData.artistName,
      album: odesliData.album || null,
      thumbnail_url: odesliData.thumbnailUrl,
      platform_links: odesliData.platformLinks,
      position,
    }
    
    console.log("[v0] Adding song with data:", JSON.stringify(songData, null, 2))
    
    const { data: song, error: songError } = await supabase
      .from("songs")
      .insert(songData)
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
