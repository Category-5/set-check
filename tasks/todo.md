# Provider parity + delete button hover fix

## Audit findings (Spotify / Apple Music / Tidal)

Equal already: single-song resolve (share-song, search-song), link fill-in
(ensure*Link), deep links (getAppDeepLink), display (PLATFORM_INFO in both
song page and platform dialog).

Unequal:
1. Playlist import only accepts Spotify URLs. Tidal (API, creds already in
   env) and Apple Music (public page embeds serialized-server-data JSON)
   both verified resolvable.
2. Apple Music track search does not normalize title/artist
   (normalizeForSearch/primaryArtist) like Spotify and Tidal do.
3. isSpotifyUrl accepts spotify.link short URLs but resolveSpotifyUrl cannot
   extract an ID from them, so they always fail.

Button bug: light theme sets --destructive-foreground to the same red as
--destructive, so red delete buttons render red-on-red text (always for
solid destructive buttons; on hover for hover:bg-destructive buttons).

## Tasks
- [x] Fix --destructive-foreground in light theme (globals.css)
- [x] Extract shared normalizeForSearch/primaryArtist to lib/search-normalization.ts; use in spotify, tidal, apple-music
- [x] Resolve spotify.link short URLs by following redirects
- [x] Add resolveSpotifyPlaylist / resolveAppleMusicPlaylist / resolveTidalPlaylist + playlist URL detection per provider
- [x] Replace /api/import-spotify-playlist with provider-agnostic /api/import-playlist
- [x] Rename ImportSpotifyDialog to ImportPlaylistDialog; update homepage copy
- [x] Tests for new URL detection and resolver parsing
- [x] pnpm test + tsc pass

## Review
- Light-theme `--destructive-foreground` changed to near-white; all delete
  buttons (song, idea, section note, playlist, external-link remove, header
  hover) now legible.
- Playlist import now accepts Spotify, Apple Music, and Tidal playlist
  links; all imports fill in links for the other two providers.
- Apple Music search now normalizes queries the same way Spotify/Tidal do.
- spotify.link short links resolve via redirect before ID extraction.
- New tests: playlist URL detection, Apple page parsing, Tidal playlist
  assembly, Spotify short-link redirect. Full suite green.
