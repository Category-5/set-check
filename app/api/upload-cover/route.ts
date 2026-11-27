import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { COVER_BUCKET, coverPath, validateCover } from "@/lib/cover-upload"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const playlistId = formData.get("playlistId")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (typeof playlistId !== "string" || !playlistId) {
      return NextResponse.json({ error: "No playlist ID provided" }, { status: 400 })
    }

    const validation = validateCover(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      console.error("Upload error: SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Uploads are not configured" }, { status: 500 })
    }

    const { data: playlist } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", playlistId)
      .maybeSingle()

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const path = coverPath(playlistId, validation.extension)
    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" })

    if (uploadError) {
      console.error("Error uploading cover:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path)

    const { error } = await supabase
      .from("playlists")
      .update({ cover_url: publicUrl })
      .eq("id", playlistId)

    if (error) {
      console.error("Error updating playlist:", error)
      return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
