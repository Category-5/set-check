import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import type { OdesliResponse } from "@/lib/types"
import { ensureSpotifyLink } from "@/lib/spotify"
import { isAppleMusicUrl, resolveAppleMusicUrl, ensureAppleMusicLink } from "@/lib/apple-music"

const ODESLI_API = "https://api.song.link/v1-alpha.1/links"

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

    // Odesli returns 400 for Apple Music URLs — use iTunes API directly instead.
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

    // Fetch song info from Odesli
    const odesliResponse = await fetch(
      `${ODESLI_API}?url=${encodeURIComponent(url)}&userCountry=US`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!odesliResponse.ok) {
      if (odesliResponse.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: "Could not find song. Make sure you pasted a valid music link." },
        { status: 404 }
      )
    }

    const data = await odesliResponse.json()

    // Find the main entity (the song)
    const entityId = data.entityUniqueId
    const entity = data.entitiesByUniqueId?.[entityId]

    if (!entity) {
      return NextResponse.json(
        { error: "Could not parse song information" },
        { status: 404 }
      )
    }

    // Extract platform links
    const platformLinks: Record<string, string> = {}
    
    if (data.linksByPlatform) {
      const platformMappings: Record<string, string> = {
        spotify: "spotify",
        appleMusic: "appleMusic",
        youtube: "youtube",
        youtubeMusic: "youtubeMusic",
        amazonMusic: "amazonMusic",
        amazonStore: "amazonStore",
        deezer: "deezer",
        tidal: "tidal",
        soundcloud: "soundcloud",
        pandora: "pandora",
        audiomack: "audiomack",
      }

      for (const [platform, key] of Object.entries(platformMappings)) {
        const link = data.linksByPlatform[platform]
        if (link?.url) {
          platformLinks[key] = link.url
        }
      }
    }

    const title = entity.title || "Unknown Title"
    const artist = entity.artistName || "Unknown Artist"

    await ensureSpotifyLink(platformLinks, title, artist)
    await ensureAppleMusicLink(platformLinks, title, artist)

    const songId = nanoid(10)
    const supabase = await createClient()

    const { error: insertError } = await supabase
      .from("shared_songs")
      .insert({
        id: songId,
        original_url: url,
        title,
        artist,
        album: entity.albumName || null,
        thumbnail_url: entity.thumbnailUrl || null,
        platform_links: platformLinks,
      })

    if (insertError) {
      console.error("Error inserting shared song:", insertError)
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: songId,
      title,
      artist,
      thumbnail_url: entity.thumbnailUrl || null,
    })
  } catch (error) {
    console.error("Share song error:", error)
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    )
  }
}
