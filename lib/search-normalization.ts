// Strip parenthetical/bracketed qualifiers ("(feat. X)", "[Remastered 2011]")
// that hurt match quality across platforms.
export function normalizeForSearch(s: string): string {
  return s
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Take only the first artist when multiple are joined by ", " or " & " /
// " feat. " — the lead artist gives the most reliable cross-platform match.
export function primaryArtist(artist: string): string {
  return artist.split(/,| & | feat\.? | with /i)[0].trim()
}
