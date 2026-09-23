import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import React from "react"

// Mock DnD kit - components use useSortable which requires DndContext
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}))

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
}))

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}))

// Mock child components that have their own network dependencies
vi.mock("@/components/playlist/vote-buttons", () => ({
  VoteButtons: () => null,
}))
vi.mock("@/components/playlist/platform-links-dialog", () => ({
  PlatformLinksDialog: () => null,
}))
vi.mock("@/components/playlist/song-edit-dialog", () => ({
  SongEditDialog: () => null,
}))

import { SongItem } from "@/components/playlist/song-item"
import { IdeaSongItem } from "@/components/playlist/idea-song-item"
import type { Song } from "@/lib/types"

const baseSong: Song = {
  id: "song-1",
  playlist_id: "playlist-1",
  title: "Test Song",
  artist: "Test Artist",
  album: null,
  thumbnail_url: null,
  position: 0,
  note: null,
  external_link: null,
  added_at: "2024-01-01T00:00:00Z",
  added_by: "alice",
  is_promoted: true,
  platform_links: {},
  song_key: "C",
}

beforeEach(() => {
  cleanup()
})

function openActionsMenu(songTitle: string) {
  const [trigger] = screen.getAllByRole("button", { name: `More actions for ${songTitle}` })
  fireEvent.keyDown(trigger, { key: "Enter" })
}

describe("SongItem — Set song deletion", () => {
  it("shows Remove from set menu item when user is the playlist creator", async () => {
    render(
      <SongItem
        song={baseSong}
        index={0}
        playlistId="playlist-1"
        currentUser="alice"
        isCreator={true}
        onRemove={vi.fn()}
        onClick={vi.fn()}
        onEditClick={vi.fn()}
      />
    )
    openActionsMenu("Test Song")
    expect(await screen.findByRole("menuitem", { name: /Remove from set/ })).toBeInTheDocument()
  })

  it("hides Remove from set menu item when user is not the playlist creator", () => {
    render(
      <SongItem
        song={baseSong}
        index={0}
        playlistId="playlist-1"
        currentUser="bob"
        isCreator={false}
        onRemove={vi.fn()}
        onClick={vi.fn()}
        onEditClick={vi.fn()}
      />
    )
    openActionsMenu("Test Song")
    expect(screen.queryByRole("menuitem", { name: /Remove from set/ })).toBeNull()
  })
})

describe("IdeaSongItem — Idea promotion", () => {
  const ideaSong: Song = { ...baseSong, is_promoted: false }

  it("shows the promote control when user is the playlist creator", () => {
    render(
      <IdeaSongItem
        song={ideaSong}
        playlistId="playlist-1"
        currentUser="alice"
        isCreator={true}
        onSongRemoved={vi.fn()}
        onSongUpdated={vi.fn()}
        onSongPromoted={vi.fn()}
      />
    )
    expect(
      screen.getAllByRole("button", { name: "Move Test Song into the set" }).length,
    ).toBeGreaterThan(0)
  })

  it("hides the promote control when user is not the playlist creator", () => {
    render(
      <IdeaSongItem
        song={ideaSong}
        playlistId="playlist-1"
        currentUser="bob"
        isCreator={false}
        onSongRemoved={vi.fn()}
        onSongUpdated={vi.fn()}
        onSongPromoted={vi.fn()}
      />
    )
    expect(
      screen.queryAllByRole("button", { name: "Move Test Song into the set" }),
    ).toHaveLength(0)
  })
})

describe("IdeaSongItem — Idea song deletion", () => {
  const ideaSong: Song = { ...baseSong, is_promoted: false, added_by: "alice" }

  it("shows Remove idea menu item to the user who added the song", async () => {
    render(
      <IdeaSongItem
        song={ideaSong}
        playlistId="playlist-1"
        currentUser="alice"
        isCreator={false}
        onSongRemoved={vi.fn()}
        onSongUpdated={vi.fn()}
        onSongPromoted={vi.fn()}
      />
    )
    openActionsMenu("Test Song")
    expect(await screen.findByRole("menuitem", { name: /Remove idea/ })).toBeInTheDocument()
  })

  it("hides Remove idea menu item from a user who did not add the song and is not the creator", () => {
    render(
      <IdeaSongItem
        song={ideaSong}
        playlistId="playlist-1"
        currentUser="bob"
        isCreator={false}
        onSongRemoved={vi.fn()}
        onSongUpdated={vi.fn()}
        onSongPromoted={vi.fn()}
      />
    )
    openActionsMenu("Test Song")
    expect(screen.queryByRole("menuitem", { name: /Remove idea/ })).toBeNull()
  })
})
