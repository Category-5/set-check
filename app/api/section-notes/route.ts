import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { playlist_id, title, content, icon, color, position } = body

  if (!playlist_id) {
    return NextResponse.json({ error: "playlist_id is required" }, { status: 400 })
  }

  const id = nanoid(10)

  const { data, error } = await supabase
    .from("section_notes")
    .insert({
      id,
      playlist_id,
      title: title || "Untitled",
      content: content || "",
      icon: icon || "hand-heart",
      color: color || "slate",
      position: position ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error("[section-notes] POST error:", JSON.stringify(error))
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const allowedFields = ["title", "content", "icon", "color", "position"]
  const filteredUpdates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in updates) {
      filteredUpdates[key] = updates[key]
    }
  }

  const { data, error } = await supabase
    .from("section_notes")
    .update(filteredUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("section_notes")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
