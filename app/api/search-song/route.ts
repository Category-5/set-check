import { NextRequest, NextResponse } from "next/server"
import type { SongLookupResult } from "@/lib/types"
import { ensureSpotifyLink, isSpotifyUrl, resolveSpotifyUrl } from "@/lib/spotify"
import { isAppleMusicUrl, resolveAppleMusicUrl, ensureAppleMusicLink } from "@/lib/apple-music"
import { isTidalUrl, resolveTidalUrl, ensureTidalLink } from "@/lib/tidal"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

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
      await ensureTidalLink(platformLinks, appleData.title, appleData.artistName)

      const result: SongLookupResult = {
        title: appleData.title,
        artistName: appleData.artistName,
        thumbnailUrl: appleData.thumbnailUrl,
        platformLinks,
      }
      return NextResponse.json(result)
    } catch (error) {
      console.error("Apple Music lookup error:", error)
      return NextResponse.json({ error: "Failed to search for song" }, { status: 500 })
    }
  }

  if (isSpotifyUrl(url)) {
    try {
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
      await ensureTidalLink(platformLinks, spotifyData.title, spotifyData.artistName)

      const result: SongLookupResult = {
        title: spotifyData.title,
        artistName: spotifyData.artistName,
        thumbnailUrl: spotifyData.thumbnailUrl,
        platformLinks,
      }
      return NextResponse.json(result)
    } catch (error) {
      console.error("Spotify lookup error:", error)
      return NextResponse.json({ error: "Failed to search for song" }, { status: 500 })
    }
  }

  if (isTidalUrl(url)) {
    try {
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

      const result: SongLookupResult = {
        title: tidalData.title,
        artistName: tidalData.artistName,
        thumbnailUrl: tidalData.thumbnailUrl,
        platformLinks,
      }
      return NextResponse.json(result)
    } catch (error) {
      console.error("Tidal lookup error:", error)
      return NextResponse.json({ error: "Failed to search for song" }, { status: 500 })
    }
  }

  return NextResponse.json(
    { error: "Unsupported link. Paste a Spotify, Apple Music, or Tidal track link." },
    { status: 400 }
  )
}
