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
  platform_links: PlatformLinks
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface OdesliResponse {
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
