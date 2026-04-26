// Spotify Web API helper using Client Credentials Flow.
// Used as a fallback when Odesli's response is missing a Spotify link
// (a known gap when resolving from Tidal, Deezer, etc).

const TOKEN_URL = "https://accounts.spotify.com/api/token"
const SEARCH_URL = "https://api.spotify.com/v1/search"

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn("[spotify] SPOTIFY_CLIENT_ID/SECRET not set — cannot use Spotify fallback")
    return null
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    console.error(`[spotify] Token request failed: ${response.status}`)
    return null
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

// Strip parenthetical/bracketed qualifiers ("(feat. X)", "[Remastered 2011]")
// that hurt match quality across platforms.
function normalizeForSearch(s: string): string {
  return s
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Take only the first artist when multiple are joined by ", " or " & " /
// " feat. " — Spotify's track artist + Odesli's artistName don't always agree
// on collaborator order, so the lead artist gives the most reliable match.
function primaryArtist(artist: string): string {
  return artist.split(/,| & | feat\.? | with /i)[0].trim()
}

export async function searchSpotifyTrack(
  title: string,
  artist: string
): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null

  const cleanTitle = normalizeForSearch(title)
  const cleanArtist = normalizeForSearch(primaryArtist(artist))
  if (!cleanTitle || !cleanArtist) return null

  const q = `track:${cleanTitle} artist:${cleanArtist}`
  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&type=track&limit=1&market=US`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error(`[spotify] Search failed (${response.status}) for "${title}" / "${artist}"`)
      return null
    }

    const data = (await response.json()) as {
      tracks?: { items?: { external_urls?: { spotify?: string } }[] }
    }
    return data.tracks?.items?.[0]?.external_urls?.spotify ?? null
  } catch (error) {
    console.error("[spotify] Search error:", error)
    return null
  }
}

// If Odesli failed to return a Spotify link, look it up via Spotify search
// using the resolved title/artist. Mutates and returns the same object.
export async function ensureSpotifyLink(
  platformLinks: Record<string, string>,
  title: string,
  artist: string
): Promise<Record<string, string>> {
  if (platformLinks.spotify) return platformLinks

  const spotifyUrl = await searchSpotifyTrack(title, artist)
  if (spotifyUrl) {
    platformLinks.spotify = spotifyUrl
  }
  return platformLinks
}
