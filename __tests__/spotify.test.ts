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

async function importSpotify() {
  return import("@/lib/spotify")
}

function mockToken() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: "test-token", expires_in: 3600 }),
  })
}

function mockSearch(items: unknown[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ tracks: { items } }),
  })
}

describe("searchSpotifyTrack", () => {
  it("returns null when credentials are missing", async () => {
    const { searchSpotifyTrack } = await importSpotify()
    const result = await searchSpotifyTrack("Song", "Artist")
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("returns null when token request fails", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    const { searchSpotifyTrack } = await importSpotify()
    const result = await searchSpotifyTrack("Song", "Artist")
    expect(result).toBeNull()
  })

  it("returns null when search returns no items", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { searchSpotifyTrack } = await importSpotify()
    const result = await searchSpotifyTrack("Song", "Artist")
    expect(result).toBeNull()
  })

  it("returns the Spotify URL on a successful search", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ external_urls: { spotify: "https://open.spotify.com/track/abc" } }])

    const { searchSpotifyTrack } = await importSpotify()
    const result = await searchSpotifyTrack("Song", "Artist")
    expect(result).toBe("https://open.spotify.com/track/abc")
  })

  it("strips parenthetical/bracket qualifiers and uses primary artist before searching", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { searchSpotifyTrack } = await importSpotify()
    await searchSpotifyTrack("Song (Remastered 2011)", "Artist & Feat. Guest")

    const searchCall = mockFetch.mock.calls[1][0] as string
    expect(searchCall).toContain("track%3ASong")
    expect(searchCall).toContain("artist%3AArtist")
    expect(searchCall).not.toContain("Remastered")
    expect(searchCall).not.toContain("Feat")
  })
})

describe("ensureSpotifyLink", () => {
  it("returns early without fetching if spotify link already present", async () => {
    const { ensureSpotifyLink } = await importSpotify()
    const links = { spotify: "https://open.spotify.com/track/existing" }
    const result = await ensureSpotifyLink(links, "Song", "Artist")
    expect(result).toBe(links)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("adds spotify link when missing and search succeeds", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([{ external_urls: { spotify: "https://open.spotify.com/track/new" } }])

    const { ensureSpotifyLink } = await importSpotify()
    const links: Record<string, string> = { apple: "https://music.apple.com/..." }
    await ensureSpotifyLink(links, "Song", "Artist")
    expect(links.spotify).toBe("https://open.spotify.com/track/new")
  })

  it("leaves links unchanged when search finds nothing", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "id")
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret")
    mockToken()
    mockSearch([])

    const { ensureSpotifyLink } = await importSpotify()
    const links: Record<string, string> = { apple: "https://music.apple.com/..." }
    await ensureSpotifyLink(links, "Song", "Artist")
    expect(links.spotify).toBeUndefined()
  })
})
