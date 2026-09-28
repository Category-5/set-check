import { describe, it, expect } from "vitest"
import { normalizeForSearch, pickBestMatch } from "@/lib/search-normalization"

describe("normalizeForSearch", () => {
  it("strips parenthetical, bracketed, and dash qualifiers", () => {
    expect(normalizeForSearch("Song (feat. Guest) [Remastered] - Live")).toBe("Song")
  })
})

describe("pickBestMatch", () => {
  it("returns null when nothing matches", () => {
    expect(pickBestMatch([{ title: "Other", artists: ["Artist"] }], "Song", "Artist")).toBeNull()
  })

  it("ignores remaster and feature labels on the same recording", () => {
    const match = { title: '"Heroes" (2017 Remaster)', artists: ["David Bowie"] }
    expect(pickBestMatch([match], '"Heroes" - 2017 Remaster', "David Bowie")).toBe(match)
  })

  it("matches an Apple-style joined artist string against separate artists", () => {
    const match = { title: "Jireh", artists: ["Maverick City Music", "Elevation Worship"] }
    expect(pickBestMatch([match], "Jireh", "Elevation Worship & Maverick City Music")).toBe(match)
  })

  it("matches band names that contain an ampersand", () => {
    const match = { title: "The Boxer", artists: ["Simon & Garfunkel"] }
    expect(pickBestMatch([match], "The Boxer", "Simon & Garfunkel")).toBe(match)
  })

  it("matches accents, case, and a leading 'The' loosely", () => {
    const match = { title: "Clarity", artists: ["ZEDD", "Foxes"] }
    expect(pickBestMatch([match], "Clarity", "Zedd, Foxes")).toBe(match)
    const killers = { title: "Mr. Brightside", artists: ["Killers"] }
    expect(pickBestMatch([killers], "Mr. Brightside", "The Killers")).toBe(killers)
  })

  it("rejects a live version when the studio version was requested", () => {
    expect(pickBestMatch([{ title: "Way Maker", version: "Live", artists: ["Leeland"] }], "Way Maker", "Leeland")).toBeNull()
  })

  it("accepts a subtitle that only one platform includes", () => {
    const match = { title: "Oceans", artists: ["Hillsong UNITED"] }
    expect(pickBestMatch([match], "Oceans (Where Feet May Fail)", "Hillsong UNITED")).toBe(match)
  })
})
