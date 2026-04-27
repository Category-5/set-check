import { NextRequest, NextResponse } from "next/server"
import type { OdesliResponse } from "@/lib/types"
import { ensureSpotifyLink } from "@/lib/spotify"
import { isAppleMusicUrl, resolveAppleMusicUrl, ensureAppleMusicLink } from "@/lib/apple-music"

const ODESLI_API = "https://api.song.link/v1-alpha.1/links"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  // Odesli returns 400 for Apple Music URLs — use iTunes API directly instead.
  if (isAppleMusicUrl(url)) {
    try {
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

      const result: OdesliResponse = {
        title: appleData.title,
        artistName: appleData.artistName,
        thumbnailUrl: appleData.thumbnailUrl,
        platformLinks,
        odesliUrl: null,
      }
      return NextResponse.json(result)
    } catch (error) {
      console.error("Apple Music lookup error:", error)
      return NextResponse.json({ error: "Failed to search for song" }, { status: 500 })
    }
  }

  try {
    const response = await fetch(
      `${ODESLI_API}?url=${encodeURIComponent(url)}&userCountry=US`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      
      // Handle rate limiting
      if (response.status === 429) {
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

    const data = await response.json()

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
    const artistName = entity.artistName || "Unknown Artist"

    await ensureSpotifyLink(platformLinks, title, artistName)
    await ensureAppleMusicLink(platformLinks, title, artistName)

    const result: OdesliResponse = {
      title,
      artistName,
      thumbnailUrl: entity.thumbnailUrl || null,
      platformLinks,
      odesliUrl: data.pageUrl || null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Odesli API error:", error)
    return NextResponse.json(
      { error: "Failed to search for song" },
      { status: 500 }
    )
  }
}
