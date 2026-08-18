export interface PlatformLinks {
  spotify?: string
  appleMusic?: string
  tidal?: string
}

export interface Song {
  id: string
  playlist_id: string
  title: string
  artist: string
  album: string | null
  thumbnail_url: string | null
  position: number
  note: string | null
  external_link: string | null
  added_at: string
  added_by: string | null
  is_promoted: boolean
  platform_links: PlatformLinks
  song_key: string
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  external_link: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  public_edit: boolean
}

export interface Vote {
  id: string
  song_id: string
  user_name: string
  vote_type: 'up' | 'down'
  created_at: string
}

// Transformed response from our search-song API
export interface SongLookupResult {
  title: string
  artistName: string
  album?: string | null
  thumbnailUrl: string | null
  platformLinks: Record<string, string>
}

export interface SectionNote {
  id: string
  playlist_id: string
  title: string
  content: string
  icon: string
  color: string
  position: number
  created_at: string
  type: 'section_note'
}

export type SetItem = (Song & { type: 'song' }) | SectionNote
