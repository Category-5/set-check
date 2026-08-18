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

function mockSearch(included: unknown[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ included }),
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
    mockSearch([
      {
        id: "123",
        type: "tracks",
        attributes: {
          externalLinks: [
            { href: "https://tidal.com/browse/track/123", meta: { type: "TIDAL_SHARING" } },
          ],
        },
      },
    ])

    const { searchTidalTrack } = await importTidal()
    const result = await searchTidalTrack("Song", "Artist")
    expect(result).toBe("https://tidal.com/browse/track/123")
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
    mockSearch([
      {
        id: "456",
        type: "tracks",
        attributes: {
          externalLinks: [
            { href: "https://tidal.com/browse/track/456", meta: { type: "TIDAL_SHARING" } },
          ],
        },
      },
    ])

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
