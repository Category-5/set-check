# Lessons

## Provider parity (2026-08-21)
When set-check adds or fixes support for a streaming provider (Spotify,
Apple Music, Tidal), sweep every code path that builds `platform_links` or
branches on provider, not just the one in the bug report. Surfaces to check:
share-song, search-song, import-playlist, add-song, the ensure*Link helpers,
getAppDeepLink, PLATFORM_INFO maps (song page + platform dialog), and UI
copy that lists providers. A gap in one path (playlist import missing Tidal)
looked fixed after a one-line patch but hid a bigger asymmetry: the import
flow itself only accepted Spotify playlists.
