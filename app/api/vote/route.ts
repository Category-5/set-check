import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { songId, userName, voteType } = await request.json()

    if (!songId || !userName || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already voted on this song
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("song_id", songId)
      .eq("user_name", userName)
      .single()

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Same vote type - remove the vote (toggle off)
        await supabase.from("votes").delete().eq("id", existingVote.id)
      } else {
        // Different vote type - update the vote
        await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id)
      }
    } else {
      // No existing vote - create new one
      await supabase.from("votes").insert({
        id: nanoid(10),
        song_id: songId,
        user_name: userName,
        vote_type: voteType,
      })
    }

    // Get updated votes for this song
    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("song_id", songId)

    return NextResponse.json({ votes: votes || [] })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const songId = request.nextUrl.searchParams.get("songId")

    if (!songId) {
      return NextResponse.json(
        { error: "Missing songId" },
        { status: 400 }
      )
    }

    const { data: votes } = await supabase
      .from("votes")
      .select("*")
      .eq("song_id", songId)

    return NextResponse.json({ votes: votes || [] })
  } catch (error) {
    console.error("Get votes error:", error)
    return NextResponse.json({ error: "Failed to get votes" }, { status: 500 })
  }
}
