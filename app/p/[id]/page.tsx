import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PlaylistView } from "@/components/playlist/playlist-view"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: playlist } = await supabase
    .from("playlists")
    .select("name, description, cover_url")
    .eq("id", id)
    .single()
  
  if (!playlist) {
    return { title: "Playlist Not Found" }
  }
  
  const title = `${playlist.name} - Set check`
  const description = playlist.description || "A collaborative playlist on Set check"
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: playlist.cover_url ? [playlist.cover_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: playlist.cover_url ? [playlist.cover_url] : [],
    },
  }
}

export default async function PlaylistPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error || !playlist) {
    notFound()
  }
  
  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("playlist_id", id)
    .order("position", { ascending: true })
  
  return (
    <main className="min-h-screen bg-background">
      <PlaylistView playlist={playlist} initialSongs={songs || []} />
    </main>
  )
}
