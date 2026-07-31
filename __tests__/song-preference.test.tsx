import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, cleanup, renderHook, act } from "@testing-library/react"
import React from "react"
import { useStreamingPreference } from "@/hooks/use-streaming-preference"
import { SongPlatformList } from "@/app/song/[id]/song-platform-list"
import { getAppDeepLink } from "@/lib/utils"

// Mock openWithAppFallback
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils")
  return {
    ...actual,
    openWithAppFallback: vi.fn(),
  }
})

describe("getAppDeepLink for Tidal & Other Platforms", () => {
  it("converts www.tidal.com browse links to tidal:// deep links", () => {
    expect(getAppDeepLink("https://www.tidal.com/browse/track/303494793")).toBe("tidal://track/303494793")
  })

  it("converts listen.tidal.com track links to tidal:// deep links", () => {
    expect(getAppDeepLink("https://listen.tidal.com/track/303494793")).toBe("tidal://track/303494793")
  })

  it("converts direct tidal.com track links to tidal:// deep links", () => {
    expect(getAppDeepLink("https://tidal.com/track/303494793")).toBe("tidal://track/303494793")
  })

  it("converts open.spotify.com links to spotify: deep links", () => {
    expect(getAppDeepLink("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBe(
      "spotify:track:4uLU6hMCjMI75M1A2tKUQC"
    )
  })
})

describe("useStreamingPreference Hook", () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  it("initializes with default values when localStorage is empty", () => {
    const { result } = renderHook(() => useStreamingPreference())
    expect(result.current.preferredPlatform).toBeNull()
    expect(result.current.rememberPreference).toBe(true)
  })

  it("loads stored preference from localStorage", () => {
    localStorage.setItem(
      "setcheck_streaming_preference",
      JSON.stringify({ preferredPlatform: "spotify", rememberPreference: true })
    )

    const { result } = renderHook(() => useStreamingPreference())

    expect(result.current.preferredPlatform).toBe("spotify")
    expect(result.current.rememberPreference).toBe(true)
  })

  it("updates preferred platform and persists to localStorage", () => {
    const { result } = renderHook(() => useStreamingPreference())

    act(() => {
      result.current.setPreferredPlatform("appleMusic")
    })

    expect(result.current.preferredPlatform).toBe("appleMusic")
    const stored = JSON.parse(localStorage.getItem("setcheck_streaming_preference") || "{}")
    expect(stored.preferredPlatform).toBe("appleMusic")
  })

  it("updates remember preference toggle and persists to localStorage", () => {
    const { result } = renderHook(() => useStreamingPreference())

    act(() => {
      result.current.setRememberPreference(false)
    })

    expect(result.current.rememberPreference).toBe(false)
    const stored = JSON.parse(localStorage.getItem("setcheck_streaming_preference") || "{}")
    expect(stored.rememberPreference).toBe(false)
  })

  it("clears stored preference when clearPreference is called", () => {
    localStorage.setItem(
      "setcheck_streaming_preference",
      JSON.stringify({ preferredPlatform: "spotify", rememberPreference: true })
    )

    const { result } = renderHook(() => useStreamingPreference())

    act(() => {
      result.current.clearPreference()
    })

    expect(result.current.preferredPlatform).toBeNull()
    expect(localStorage.getItem("setcheck_streaming_preference")).toBeNull()
  })
})

describe("SongPlatformList Component", () => {
  const samplePlatforms: [string, string][] = [
    ["spotify", "https://open.spotify.com/track/123"],
    ["appleMusic", "https://music.apple.com/us/album/123"],
    ["tidal", "https://listen.tidal.com/track/303494793"],
  ]

  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  it("renders available platform buttons including Tidal", () => {
    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    expect(screen.getByText("Spotify")).toBeInTheDocument()
    expect(screen.getByText("Apple Music")).toBeInTheDocument()
    expect(screen.getByText("Tidal")).toBeInTheDocument()
    expect(screen.getByText("Remember streaming service preference")).toBeInTheDocument()
  })

  it("saves Tidal as preference when Tidal button is clicked with remember enabled", () => {
    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    const tidalBtn = screen.getByText("Tidal")
    fireEvent.click(tidalBtn)

    const stored = JSON.parse(localStorage.getItem("setcheck_streaming_preference") || "{}")
    expect(stored.preferredPlatform).toBe("tidal")
  })

  it("displays warning banner if preferred service link is missing for a song", () => {
    localStorage.setItem(
      "setcheck_streaming_preference",
      JSON.stringify({ preferredPlatform: "deezer", rememberPreference: true })
    )

    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    expect(
      screen.getByText(/link is not available for this song/i)
    ).toBeInTheDocument()
  })
})
