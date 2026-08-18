import { describe, it, expect, vi, beforeEach } from "vitest"

const selectMock = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        in: (_column: string, ids: string[]) => selectMock(ids),
      }),
    }),
  }),
}))

import { RECENT_PLAYLISTS_KEY } from "@/lib/constants"
import { pruneDeletedPlaylists, readRecentPlaylists, type RecentPlaylist } from "@/lib/recent-playlists"

const playlist = (id: string, viewedAt: number): RecentPlaylist => ({
  id,
  name: `Set ${id}`,
  cover_url: null,
  viewedAt,
})

describe("recent playlists", () => {
  beforeEach(() => {
    localStorage.clear()
    selectMock.mockReset()
  })

  it("reads stored playlists sorted by most recently viewed", () => {
    localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify([playlist("a", 1), playlist("b", 5)]))

    expect(readRecentPlaylists().map((p) => p.id)).toEqual(["b", "a"])
  })

  it("returns an empty list when stored data is not valid JSON", () => {
    localStorage.setItem(RECENT_PLAYLISTS_KEY, "not json")

    expect(readRecentPlaylists()).toEqual([])
  })

  it("drops playlists deleted by another client and rewrites storage", async () => {
    const stored = [playlist("kept", 2), playlist("deleted", 1)]
    localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(stored))
    selectMock.mockResolvedValue({ data: [{ id: "kept" }], error: null })

    const remaining = await pruneDeletedPlaylists(stored)

    expect(remaining.map((p) => p.id)).toEqual(["kept"])
    expect(JSON.parse(localStorage.getItem(RECENT_PLAYLISTS_KEY)!).map((p: RecentPlaylist) => p.id)).toEqual(["kept"])
  })

  it("keeps the stored list when the lookup fails", async () => {
    const stored = [playlist("a", 1)]
    localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(stored))
    selectMock.mockResolvedValue({ data: null, error: { message: "offline" } })

    expect(await pruneDeletedPlaylists(stored)).toEqual(stored)
  })

  it("skips the lookup when there is nothing stored", async () => {
    expect(await pruneDeletedPlaylists([])).toEqual([])
    expect(selectMock).not.toHaveBeenCalled()
  })
})
