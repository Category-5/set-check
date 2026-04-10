export interface PlatformLinks {
  spotify?: string
  appleMusic?: string
  youtube?: string
  youtubeMusic?: string
  amazonMusic?: string
  tidal?: string
  deezer?: string
  soundcloud?: string
  pandora?: string
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
  added_at: string
  added_by: string | null
  is_promoted: boolean
  platform_links: PlatformLinks
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Vote {
  id: string
  song_id: string
  user_name: string
  vote_type: 'up' | 'down'
  created_at: string
}

// Transformed response from our search-song API
export interface OdesliResponse {
  title: string
  artistName: string
  album?: string | null
  thumbnailUrl: string | null
  platformLinks: Record<string, string>
  odesliUrl?: string | null
}

// Raw Odesli API response (for reference)
export interface RawOdesliResponse {
  entityUniqueId: string
  userCountry: string
  pageUrl: string
  entitiesByUniqueId: {
    [key: string]: {
      id: string
      type: string
      title?: string
      artistName?: string
      thumbnailUrl?: string
      thumbnailWidth?: number
      thumbnailHeight?: number
      apiProvider: string
      platforms: string[]
    }
  }
  linksByPlatform: {
    [platform: string]: {
      country: string
      url: string
      entityUniqueId: string
    }
  }
}
