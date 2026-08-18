import { createClient } from "@/lib/supabase/client"
import { RECENT_PLAYLISTS_KEY } from "@/lib/constants"

export interface RecentPlaylist {
  id: string
  name: string
  cover_url: string | null
  viewedAt: number
}

export function readRecentPlaylists(): RecentPlaylist[] {
  const stored = localStorage.getItem(RECENT_PLAYLISTS_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored) as RecentPlaylist[]
    if (!Array.isArray(parsed)) return []
    return [...parsed].sort((a, b) => b.viewedAt - a.viewedAt)
  } catch {
    return []
  }
}

export function writeRecentPlaylists(playlists: RecentPlaylist[]) {
  try {
    localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(playlists))
  } catch {
    // ignore localStorage errors
  }
}

export async function fetchExistingPlaylistIds(ids: string[]): Promise<string[] | null> {
  if (ids.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase.from("playlists").select("id").in("id", ids)
  if (error || !data) return null
  return data.map((row) => row.id as string)
}

export async function pruneDeletedPlaylists(playlists: RecentPlaylist[]): Promise<RecentPlaylist[]> {
  const existingIds = await fetchExistingPlaylistIds(playlists.map((p) => p.id))
  if (existingIds === null) return playlists
  const existing = new Set(existingIds)
  const remaining = playlists.filter((p) => existing.has(p.id))
  if (remaining.length !== playlists.length) writeRecentPlaylists(remaining)
  return remaining
}
