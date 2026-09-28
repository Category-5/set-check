// Strip parenthetical/bracketed/dash qualifiers ("(feat. X)",
// "[Remastered 2011]", " - Live") that hurt match quality across platforms.
export function normalizeForSearch(s: string): string {
  return s
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+-\s+.*$/, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const ARTIST_SEPARATOR = /,| & | feat\.? | with /i

// Take only the first artist when multiple are joined by ", " or " & " /
// " feat. " — the lead artist gives the most reliable cross-platform match.
export function primaryArtist(artist: string): string {
  return artist.split(ARTIST_SEPARATOR)[0].trim()
}

const FEATURE_QUALIFIER = /^(feat\.?|ft\.?|featuring|with)\s+/i

// Qualifiers that label the same recording ("feat. X", "2011 Remaster").
const NOISE_QUALIFIER =
  /^(feat\.?|ft\.?|featuring|with|from)\s|remaster|^\d{4}$|^(explicit|clean|mono|stereo|original mix|original version|album version|single version)$/i

// Words that mark a different recording ("Live", "Kastra Remix", "Piano Version").
const RECORDING_WORDS = new Set([
  "live", "remix", "mix", "acoustic", "instrumental", "piano", "karaoke", "extended",
  "vip", "demo", "radio", "edit", "version", "reprise", "stripped", "orchestral",
  "sped", "slowed", "cover", "session", "sessions", "rework", "bootleg", "dub", "remake",
])

function simplify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’‘]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

interface ParsedTitle {
  forms: Set<string>
  recordingWords: string
  qualifiers: string
  featuredArtists: string[]
}

function parseTitle(title: string, version?: string): ParsedTitle {
  const qualifiers: string[] = []
  const base = title
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (_, paren, bracket) => {
      qualifiers.push(paren ?? bracket)
      return " "
    })
    .replace(/\s+-\s+(.*)$/, (_, suffix) => {
      qualifiers.push(suffix)
      return " "
    })
  if (version) qualifiers.push(version)

  const trimmed = qualifiers.map((q) => q.trim())
  const kept = trimmed.filter((q) => q && !NOISE_QUALIFIER.test(q))
  const subtitles = kept.filter((q) => !simplify(q).split(" ").some((w) => RECORDING_WORDS.has(w)))
  const words = new Set(
    kept.flatMap((q) => simplify(q).split(" ")).filter((w) => RECORDING_WORDS.has(w))
  )

  return {
    forms: new Set([simplify(base), simplify([base, ...subtitles].join(" "))]),
    recordingWords: [...words].sort().join(" "),
    qualifiers: [...new Set(kept.map(simplify))].sort().join("|"),
    featuredArtists: trimmed
      .filter((q) => FEATURE_QUALIFIER.test(q))
      .map((q) => q.replace(FEATURE_QUALIFIER, "")),
  }
}

function simplifyArtist(name: string): string {
  return simplify(name).replace(/^the /, "")
}

function splitArtists(names: string[]): string[] {
  return names.flatMap((name) => name.split(ARTIST_SEPARATOR)).map(simplifyArtist).filter(Boolean)
}

function sameArtists(a: string[], b: string[]): boolean {
  const setA = new Set(a)
  const setB = new Set(b)
  return setA.size === setB.size && [...setA].every((name) => setB.has(name))
}

export interface MatchCandidate {
  title: string
  version?: string
  artists: string[]
}

// 0 = not the requested track. Otherwise 1, plus 2 when the full artist
// lineup matches and 1 when the qualifiers match (e.g. the same named remix).
function matchScore(candidate: MatchCandidate, title: string, artist: string): number {
  const wanted = parseTitle(title)
  const found = parseTitle(candidate.title, candidate.version)

  if (![...wanted.forms].some((form) => form && found.forms.has(form))) return 0
  if (wanted.recordingWords !== found.recordingWords) return 0

  const foundArtists = splitArtists(candidate.artists)
  const foundNames = new Set([...foundArtists, ...candidate.artists.map(simplifyArtist)])
  const wantedNames = [simplifyArtist(artist), simplifyArtist(primaryArtist(artist))]
  if (!wantedNames.some((name) => name && foundNames.has(name))) return 0

  const artistsMatch = sameArtists(
    [...splitArtists([artist]), ...splitArtists(wanted.featuredArtists)],
    [...foundArtists, ...splitArtists(found.featuredArtists)]
  )

  return 1 + (artistsMatch ? 2 : 0) + (wanted.qualifiers === found.qualifiers ? 1 : 0)
}

// Pick the highest-scoring result, breaking ties by relevance order.
export function pickBestMatch<T extends MatchCandidate>(
  candidates: T[],
  title: string,
  artist: string
): T | null {
  let best: T | null = null
  let bestScore = 0
  for (const candidate of candidates) {
    const score = matchScore(candidate, title, artist)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}
