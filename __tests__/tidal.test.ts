import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

vi.spyOn(console, "warn").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Reset modules each test so the module-level token cache starts fresh
beforeEach(() => {
  mockFetch.mockReset()
  vi.resetModules()
  vi.unstubAllEnvs()
})

async function importTidal() {
  return import("@/lib/tidal")
}

function mockToken() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: "test-token", expires_in: 3600 }),
  })
}

interface TrackFixture {
  id: string
  title: string
  artistName: string
  version?: string
}

function mockSearch(tracks: TrackFixture[]) {
  const included = tracks.flatMap((track) => {
    const artistNames = track.artistName.split(", ")
    return [
      {
        id: track.id,
        type: "tracks",
        attributes: {
          title: track.title,
          version: track.version ?? null,
          externalLinks: [
            { href: `https://tidal.com/browse/track/${track.id}`, meta: { type: "TIDAL_SHARING" } },
          ],
        },
        relationships: {
          artists: {
            data: artistNames.map((_, index) => ({ id: `artist-${track.id}-${index}`, type: "artists" })),
          },
        },
      },
      ...artistNames.map((name, index) => ({
        id: `artist-${track.id}-${index}`,
        type: "artists",
        attributes: { name },
      })),
    ]
  })

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [
        {
          relationships: {
            tracks: { data: tracks.map((track) => ({ id: track.id, type: "tracks" })) },
          },
        },
      ],
      included,
    }),
  })
}

describe("searchTidalTrack", () => {
  it("returns null when credentials are missing", async () => {
    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns null when token request fails", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBeNull()
  })

  it("returns null when search returns no track", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBeNull()
  })

  it("returns the Tidal sharing URL on a successful search", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ id: "123", title: "Song", artistName: "Artist" }])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBe("https://tidal.com/browse/track/123")
  })

  it("follows relevance order and skips tracks whose title or artist does not match", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([
      { id: "1", title: "Say It Right", artistName: "Asher" },
      { id: "2", title: "Say", artistName: "Someone Else" },
      { id: "3", title: "Say", artistName: "Asher Postman, Disero" },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Say", "Asher Postman")
    expect(result).toBe("https://tidal.com/browse/track/3")
  })

  it("returns null when no ranked result matches title and artist", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ id: "1", title: "Different Song", artistName: "Artist" }])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBeNull()
  })

  it("rejects an artist whose name only contains the requested artist", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ id: "1", title: "Say", artistName: "Marlon Asher" }])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Say", "Asher")
    expect(result).toBeNull()
  })

  it("skips versions that are different recordings, including Tidal's version field", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([
      { id: "1", title: "Same God", version: "Radio Version", artistName: "Elevation Worship" },
      { id: "2", title: "Same God (Live)", artistName: "Elevation Worship, Jonsal Barrientes" },
      { id: "3", title: "Same God (feat. Jonsal Barrientes)", artistName: "Elevation Worship, Jonsal Barrientes" },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack(
      "Same God (feat. Jonsal Barrientes)",
      "Elevation Worship, Jonsal Barrientes"
    )
    expect(result).toBe("https://tidal.com/browse/track/3")
  })

  it("prefers the result whose artist lineup matches", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([
      { id: "1", title: "10,000 Reasons (Bless The Lord) (Live)", artistName: "Passion, Matt Redman" },
      { id: "2", title: "10,000 Reasons (Bless The Lord)", version: "Live", artistName: "Matt Redman" },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("10,000 Reasons (Bless The Lord) - Live", "Matt Redman")
    expect(result).toBe("https://tidal.com/browse/track/2")
  })

  it("prefers the same named remix over another remix", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([
      { id: "1", title: "Say", version: "Kastra Remix", artistName: "Asher Postman" },
      { id: "2", title: "Say", version: "Mokita Remix", artistName: "Asher Postman" },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Say - Mokita Remix", "Asher Postman")
    expect(result).toBe("https://tidal.com/browse/track/2")
  })

  it("returns null when only covers of the song are found", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([
      { id: "1", title: "Uptown Funk (Piano Version)", artistName: "Bruno Mars, Piano Music Masters, Mark Ronson" },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Uptown Funk (feat. Bruno Mars)", "Mark Ronson, Bruno Mars")
    expect(result).toBeNull()
  })

  it("tolerates hyphen qualifiers when matching titles", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ id: "9", title: "Song (feat. Guest)", artistName: "Artist" }])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song - Remastered 2011", "Artist")
    expect(result).toBe("https://tidal.com/browse/track/9")
  })

  it("strips parenthetical/bracket qualifiers and uses primary artist before searching", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { searchTidalTrack } = await importTidal()
    await searchTidalTrack("Song (Remastered 2011)", "Artist & Feat. Guest")

    const searchCall = mockFetch.mock.calls[1][0] as string
    expect(searchCall).toContain(encodeURIComponent("Song Artist"))
    expect(searchCall).not.toContain("Remastered")
    expect(searchCall).not.toContain("Feat")
  })

  it("strips dash qualifiers before searching", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { searchTidalTrack } = await importTidal()
    await searchTidalTrack("Dreams - 2004 Remaster", "Fleetwood Mac")

    const searchCall = mockFetch.mock.calls[1][0] as string
    expect(searchCall).toContain(encodeURIComponent("Dreams Fleetwood Mac"))
  })
})

describe("ensureTidalLink", () => {
  it("returns early without fetching if tidal link already present", async () => {
    const { ensureTidalLink } = await importTidal()
    const links = { tidal: "https://tidal.com/browse/track/existing" }
    const result = await ensureTidalLink(links, "Song", "Artist")
    expect(result).toBe(links)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("adds tidal link when missing and search succeeds", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ id: "456", title: "Song", artistName: "Artist" }])

    const { ensureTidalLink } = await importTidal()
    const links: Record<string, string> = { spotify: "https://open.spotify.com/track/..." }
    await ensureTidalLink(links, "Song", "Artist")
    expect(links.tidal).toBe("https://tidal.com/browse/track/456")
  })

  it("leaves links unchanged when search finds nothing", async () => {
    vi.stubEnv("TIDAL_CLIENT_ID", "id")
    vi.stubEnv("TIDAL_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { ensureTidalLink } = await importTidal()
    const links: Record<string, string> = { spotify: "https://open.spotify.com/track/..." }
    await ensureTidalLink(links, "Song", "Artist")
    expect(links.tidal).toBeUndefined()
  })
})
