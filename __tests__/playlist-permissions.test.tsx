import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
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
vi.mock("@/components/playlist/note-dialog", () => ({
  NoteDialog: () => null,
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
  added_at: "2024-01-01T00:00:00Z",
  added_by: "alice",
  is_promoted: true,
  platform_links: {},
  song_key: "C",
}

beforeEach(() => {
  cleanup()
})

describe("SongItem — Set song deletion", () => {
  it("shows Remove song button when user is the playlist creator", () => {
    render(
      <SongItem
        song={baseSong}
        index={0}
        currentUser="alice"
        isCreator={true}
        onRemove={vi.fn()}
        onClick={vi.fn()}
        onNoteClick={vi.fn()}
      />
    )
    expect(screen.getAllByRole("button", { name: "Remove song" }).length).toBeGreaterThan(0)
  })

  it("hides Remove song button when user is not the playlist creator", () => {
    render(
      <SongItem
        song={baseSong}
        index={0}
        currentUser="bob"
        isCreator={false}
        onRemove={vi.fn()}
        onClick={vi.fn()}
        onNoteClick={vi.fn()}
      />
    )
    expect(screen.queryAllByRole("button", { name: "Remove song" })).toHaveLength(0)
  })
})

describe("IdeaSongItem — Idea promotion", () => {
  const ideaSong: Song = { ...baseSong, is_promoted: false }

  it("shows Promote song button when user is the playlist creator", () => {
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
    expect(screen.getAllByRole("button", { name: "Promote song" }).length).toBeGreaterThan(0)
  })

  it("hides Promote song button when user is not the playlist creator", () => {
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
    expect(screen.queryAllByRole("button", { name: "Promote song" })).toHaveLength(0)
  })
})

describe("IdeaSongItem — Idea song deletion", () => {
  const ideaSong: Song = { ...baseSong, is_promoted: false, added_by: "alice" }

  it("shows Remove song button to the user who added the song", () => {
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
    expect(screen.getAllByRole("button", { name: "Remove song" }).length).toBeGreaterThan(0)
  })

  it("hides Remove song button from a user who did not add the song and is not the creator", () => {
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
    expect(screen.queryAllByRole("button", { name: "Remove song" })).toHaveLength(0)
  })
})
