import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, cleanup, renderHook, act } from "@testing-library/react"
import React from "react"
import { useStreamingPreference } from "@/hooks/use-streaming-preference"
import { SongPlatformList } from "@/app/song/[id]/song-platform-list"

// Mock openWithAppFallback
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils")
  return {
    ...actual,
    openWithAppFallback: vi.fn(),
  }
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
  ]

  beforeEach(() => {
    localStorage.clear()
    cleanup()
  })

  it("renders available platform buttons and preference toggle", () => {
    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    expect(screen.getByText("Spotify")).toBeInTheDocument()
    expect(screen.getByText("Apple Music")).toBeInTheDocument()
    expect(screen.getByText("Remember streaming service preference")).toBeInTheDocument()
  })

  it("saves preference when platform button is clicked with remember enabled", () => {
    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    const spotifyBtn = screen.getByText("Spotify")
    fireEvent.click(spotifyBtn)

    const stored = JSON.parse(localStorage.getItem("setcheck_streaming_preference") || "{}")
    expect(stored.preferredPlatform).toBe("spotify")
  })

  it("displays warning banner if preferred service link is missing for a song", () => {
    localStorage.setItem(
      "setcheck_streaming_preference",
      JSON.stringify({ preferredPlatform: "tidal", rememberPreference: true })
    )

    render(<SongPlatformList availablePlatforms={samplePlatforms} />)

    expect(
      screen.getByText(/link is not available for this song/i)
    ).toBeInTheDocument()
  })
})
