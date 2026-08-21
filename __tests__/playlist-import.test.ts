import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

vi.spyOn(console, "warn").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

beforeEach(() => {
  mockFetch.mockReset()
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe("playlist URL detection", () => {
  it("detects Spotify playlist URLs and URIs only", async () => {
    const { isSpotifyPlaylistUrl } = await import("@/lib/spotify")
    expect(isSpotifyPlaylistUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x")).toBe(true)
    expect(isSpotifyPlaylistUrl("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")).toBe(true)
    expect(isSpotifyPlaylistUrl("https://open.spotify.com/track/abc123")).toBe(false)
    expect(isSpotifyPlaylistUrl("https://tidal.com/browse/playlist/0d7307f4-d5f4-47c0-92a4-3f12833f8257")).toBe(false)
  })

  it("detects Apple Music playlist URLs only", async () => {
    const { isAppleMusicPlaylistUrl } = await import("@/lib/apple-music")
    expect(isAppleMusicPlaylistUrl("https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb")).toBe(true)
    expect(isAppleMusicPlaylistUrl("https://music.apple.com/us/album/name/123?i=456")).toBe(false)
    expect(isAppleMusicPlaylistUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toBe(false)
  })

  it("detects Tidal playlist URLs only", async () => {
    const { isTidalPlaylistUrl } = await import("@/lib/tidal")
    expect(isTidalPlaylistUrl("https://tidal.com/browse/playlist/0d7307f4-d5f4-47c0-92a4-3f12833f8257")).toBe(true)
    expect(isTidalPlaylistUrl("https://tidal.com/playlist/0d7307f4-d5f4-47c0-92a4-3f12833f8257")).toBe(true)
    expect(isTidalPlaylistUrl("https://tidal.com/browse/track/120402351")).toBe(false)
    expect(isTidalPlaylistUrl("https://music.apple.com/us/playlist/x/pl.abc")).toBe(false)
  })
})

describe("parseSpotifyEmbedPlaylist", () => {
  function embedHtml(entity: unknown): string {
    const nextData = { props: { pageProps: { state: { data: { entity } } } } }
    return `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></html>`
  }

  it("extracts name, cover, and tracks from trackList", async () => {
    const { parseSpotifyEmbedPlaylist } = await import("@/lib/spotify")
    const result = parseSpotifyEmbedPlaylist(
      embedHtml({
        name: "My Mix",
        coverArt: { sources: [{ url: "https://img/cover.jpg" }] },
        trackList: [
          {
            uri: "spotify:track:abc123",
            title: "Song One",
            subtitle: "Artist One",
            album: { name: "Album One" },
            images: [{ url: "https://img/1.jpg" }],
          },
          { title: "No URI, skipped" },
        ],
      })
    )

    expect(result).toEqual({
      name: "My Mix",
      coverUrl: "https://img/cover.jpg",
      tracks: [
        {
          title: "Song One",
          artistName: "Artist One",
          album: "Album One",
          thumbnailUrl: "https://img/1.jpg",
          url: "https://open.spotify.com/track/abc123",
        },
      ],
    })
  })

  it("returns null when the page has no __NEXT_DATA__", async () => {
    const { parseSpotifyEmbedPlaylist } = await import("@/lib/spotify")
    expect(parseSpotifyEmbedPlaylist("<html>nope</html>")).toBeNull()
  })
})

describe("parseAppleMusicPlaylistPage", () => {
  function pageHtml(sections: unknown[]): string {
    const serialized = { data: [{ intent: {}, data: { sections } }] }
    return `<html><script type="application/json" id="serialized-server-data">${JSON.stringify(serialized)}</script></html>`
  }

  it("extracts name, cover, and tracks", async () => {
    const { parseAppleMusicPlaylistPage } = await import("@/lib/apple-music")
    const result = parseAppleMusicPlaylistPage(
      pageHtml([
        {
          id: "playlist-detail-header-section - pl.x",
          items: [
            {
              title: "Today's Hits",
              artwork: { dictionary: { url: "https://img/cover/{w}x{h}bb.{f}" } },
            },
          ],
        },
        {
          id: "track-list - pl.x",
          items: [
            {
              title: "Song One",
              artistName: "Artist One",
              tertiaryLinks: [{ title: "Album One" }],
              artwork: { dictionary: { url: "https://img/track/{w}x{h}bb.{f}" } },
              contentDescriptor: { url: "https://music.apple.com/us/album/song-one/1?i=2" },
            },
            { title: "No URL, skipped" },
          ],
        },
      ])
    )

    expect(result).toEqual({
      name: "Today's Hits",
      coverUrl: "https://img/cover/500x500bb.jpg",
      tracks: [
        {
          title: "Song One",
          artistName: "Artist One",
          album: "Album One",
          thumbnailUrl: "https://img/track/500x500bb.jpg",
          url: "https://music.apple.com/us/album/song-one/1?i=2",
        },
      ],
    })
  })

  it("returns null when the page has no serialized data", async () => {
    const { parseAppleMusicPlaylistPage } = await import("@/lib/apple-music")
    expect(parseAppleMusicPlaylistPage("<html>nope</html>")).toBeNull()
  })
})

describe("resolveTidalPlaylist", () => {
  it("assembles playlist name, cover, and ordered tracks", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "token", expires_in: 3600 }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          attributes: { name: "Viral Hits" },
          relationships: {
            coverArt: { data: [{ id: "art-1", type: "artworks" }] },
            items: {
              data: [
                { id: "t2", type: "tracks" },
                { id: "t1", type: "tracks" },
              ],
            },
          },
        },
        included: [
          {
            id: "art-1",
            type: "artworks",
            attributes: { files: [{ href: "https://img/cover.jpg", meta: { width: 640, height: 640 } }] },
          },
        ],
      }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "t1",
            type: "tracks",
            attributes: {
              title: "Song One",
              externalLinks: [{ href: "https://tidal.com/browse/track/t1", meta: { type: "TIDAL_SHARING" } }],
            },
            relationships: {
              artists: { data: [{ id: "a1", type: "artists" }] },
              albums: { data: [{ id: "al1", type: "albums" }] },
            },
          },
          {
            id: "t2",
            type: "tracks",
            attributes: { title: "Song Two" },
            relationships: { artists: { data: [{ id: "a2", type: "artists" }] } },
          },
        ],
        included: [
          { id: "a1", type: "artists", attributes: { name: "Artist One" } },
          { id: "a2", type: "artists", attributes: { name: "Artist Two" } },
          {
            id: "al1",
            type: "albums",
            attributes: { title: "Album One" },
            relationships: { coverArt: { data: [{ id: "art-2", type: "artworks" }] } },
          },
          {
            id: "art-2",
            type: "artworks",
            attributes: { files: [{ href: "https://img/track.jpg", meta: { width: 320, height: 320 } }] },
          },
        ],
      }),
    })

    const { resolveTidalPlaylist } = await import("@/lib/tidal")
    const result = await resolveTidalPlaylist(
      "https://tidal.com/browse/playlist/0d7307f4-d5f4-47c0-92a4-3f12833f8257"
    )

    expect(result).toEqual({
      name: "Viral Hits",
      coverUrl: "https://img/cover.jpg",
      tracks: [
        {
          title: "Song Two",
          artistName: "Artist Two",
          album: null,
          thumbnailUrl: null,
          url: "https://tidal.com/browse/track/t2",
        },
        {
          title: "Song One",
          artistName: "Artist One",
          album: "Album One",
          thumbnailUrl: "https://img/track.jpg",
          url: "https://tidal.com/browse/track/t1",
        },
      ],
    })
  })

  it("returns null for a URL without a playlist ID", async () => {
    const { resolveTidalPlaylist } = await import("@/lib/tidal")
    expect(await resolveTidalPlaylist("https://tidal.com/browse/track/123")).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe("expandSpotifyShortLink", () => {
  it("follows spotify.link redirects to the canonical URL", async () => {
    mockFetch.mockResolvedValueOnce({
      url: "https://open.spotify.com/track/abc123",
    })

    const { expandSpotifyShortLink } = await import("@/lib/spotify")
    const result = await expandSpotifyShortLink("https://spotify.link/xyz")
    expect(result).toBe("https://open.spotify.com/track/abc123")
    expect(mockFetch).toHaveBeenCalledWith("https://spotify.link/xyz", {
      method: "HEAD",
      redirect: "follow",
    })
  })

  it("passes non-short links through without fetching", async () => {
    const { expandSpotifyShortLink } = await import("@/lib/spotify")
    const result = await expandSpotifyShortLink("https://open.spotify.com/track/abc123")
    expect(result).toBe("https://open.spotify.com/track/abc123")
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe("searchAppleMusicTrack normalization", () => {
  it("strips qualifiers and uses the primary artist like other providers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })

    const { searchAppleMusicTrack } = await import("@/lib/apple-music")
    await searchAppleMusicTrack("Song (Remastered 2011)", "Artist & Guest")

    const searchCall = mockFetch.mock.calls[0][0] as string
    expect(searchCall).toContain(encodeURIComponent("Song Artist"))
    expect(searchCall).not.toContain("Remastered")
    expect(searchCall).not.toContain("Guest")
  })
})
