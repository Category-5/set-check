import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { ensureSpotifyLink, isSpotifyUrl, resolveSpotifyUrl } from "@/lib/spotify"
import { isAppleMusicUrl, resolveAppleMusicUrl, ensureAppleMusicLink } from "@/lib/apple-music"
import { isTidalUrl, resolveTidalUrl } from "@/lib/tidal"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body as { url: string }

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    if (isAppleMusicUrl(url)) {
      const appleData = await resolveAppleMusicUrl(url)
      if (!appleData) {
        return NextResponse.json(
          { error: "Could not find song. Paste a direct track link from Apple Music (not an album link)." },
          { status: 404 }
        )
      }

      const platformLinks: Record<string, string> = {
        appleMusic: appleData.appleMusicUrl,
      }
      await ensureSpotifyLink(platformLinks, appleData.title, appleData.artistName)

      const songId = nanoid(10)
      const supabase = await createClient()

      const { error: insertError } = await supabase
        .from("shared_songs")
        .insert({
          id: songId,
          original_url: url,
          title: appleData.title,
          artist: appleData.artistName,
          album: null,
          thumbnail_url: appleData.thumbnailUrl,
          platform_links: platformLinks,
        })

      if (insertError) {
        console.error("Error inserting shared song:", insertError)
        return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
      }

      return NextResponse.json({
        id: songId,
        title: appleData.title,
        artist: appleData.artistName,
        thumbnail_url: appleData.thumbnailUrl,
      })
    }

    if (isSpotifyUrl(url)) {
      const spotifyData = await resolveSpotifyUrl(url)
      if (!spotifyData) {
        return NextResponse.json(
          { error: "Could not find song. Make sure you pasted a valid music link." },
          { status: 404 }
        )
      }

      const platformLinks: Record<string, string> = {
        spotify: spotifyData.spotifyUrl,
      }
      await ensureAppleMusicLink(platformLinks, spotifyData.title, spotifyData.artistName)

      const songId = nanoid(10)
      const supabase = await createClient()

      const { error: insertError } = await supabase
        .from("shared_songs")
        .insert({
          id: songId,
          original_url: url,
          title: spotifyData.title,
          artist: spotifyData.artistName,
          album: null,
          thumbnail_url: spotifyData.thumbnailUrl,
          platform_links: platformLinks,
        })

      if (insertError) {
        console.error("Error inserting shared song:", insertError)
        return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
      }

      return NextResponse.json({
        id: songId,
        title: spotifyData.title,
        artist: spotifyData.artistName,
        thumbnail_url: spotifyData.thumbnailUrl,
      })
    }

    if (isTidalUrl(url)) {
      const tidalData = await resolveTidalUrl(url)
      if (!tidalData) {
        return NextResponse.json(
          { error: "Could not find song. Make sure you pasted a valid music link." },
          { status: 404 }
        )
      }

      const platformLinks: Record<string, string> = {
        tidal: tidalData.tidalUrl,
      }
      await ensureSpotifyLink(platformLinks, tidalData.title, tidalData.artistName)
      await ensureAppleMusicLink(platformLinks, tidalData.title, tidalData.artistName)

      const songId = nanoid(10)
      const supabase = await createClient()

      const { error: insertError } = await supabase
        .from("shared_songs")
        .insert({
          id: songId,
          original_url: url,
          title: tidalData.title,
          artist: tidalData.artistName,
          album: null,
          thumbnail_url: tidalData.thumbnailUrl,
          platform_links: platformLinks,
        })

      if (insertError) {
        console.error("Error inserting shared song:", insertError)
        return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
      }

      return NextResponse.json({
        id: songId,
        title: tidalData.title,
        artist: tidalData.artistName,
        thumbnail_url: tidalData.thumbnailUrl,
      })
    }

    return NextResponse.json(
      { error: "Unsupported link. Paste a Spotify, Apple Music, or Tidal track link." },
      { status: 400 }
    )
  } catch (error) {
    console.error("Share song error:", error)
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    )
  }
}
