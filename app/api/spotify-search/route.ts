import { NextRequest, NextResponse } from "next/server"
import { searchSpotifyTracks } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")

  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const results = await searchSpotifyTracks(q.trim())
  return NextResponse.json(results)
}
