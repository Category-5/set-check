import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const playlistId = formData.get("playlistId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!playlistId) {
      return NextResponse.json({ error: "No playlist ID provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`playlist-covers/${playlistId}-${Date.now()}`, file, {
      access: "public",
    })

    // Update playlist with cover URL
    const supabase = await createClient()
    const { error } = await supabase
      .from("playlists")
      .update({ cover_url: blob.url })
      .eq("id", playlistId)

    if (error) {
      console.error("Error updating playlist:", error)
      return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
    }

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
