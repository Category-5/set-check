import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export default async function HomePage() {
  const supabase = await createClient()
  
  // Create a new playlist
  const playlistId = nanoid(10)
  
  const { error } = await supabase
    .from("playlists")
    .insert({
      id: playlistId,
      name: "My Playlist",
      description: "A collaborative playlist",
    })
  
  if (error) {
    console.error("Error creating playlist:", error)
    // Still redirect, the page will handle the error
  }
  
  redirect(`/p/${playlistId}`)
}
