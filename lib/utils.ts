import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a web URL to its corresponding app deep link URI.
 * This allows the link to attempt opening in the native app first.
 * Falls back to the original URL if no app scheme is available.
 */
export function getAppDeepLink(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname
    
    // Spotify: open.spotify.com/track/xxx -> spotify:track:xxx
    if (hostname === 'open.spotify.com' || hostname === 'spotify.com') {
      // Extract the type and ID from paths like /track/xxx, /album/xxx, /playlist/xxx, /artist/xxx
      const match = pathname.match(/^\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/)
      if (match) {
        return `spotify:${match[1]}:${match[2]}`
      }
    }
    
    // Apple Music: music.apple.com/xx/album/xxx -> music://music.apple.com/xx/album/xxx
    // or itunes.apple.com -> music://
    if (hostname === 'music.apple.com' || hostname === 'itunes.apple.com') {
      return `music://${hostname}${pathname}${urlObj.search}`
    }
    
    // YouTube: youtube.com/watch?v=xxx -> youtube://xxx or vnd.youtube://xxx
    // Also handles youtu.be/xxx short links
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) {
        return `youtube://${videoId}`
      }
    }
    if (hostname === 'youtu.be') {
      const videoId = pathname.slice(1) // Remove leading slash
      if (videoId) {
        return `youtube://${videoId}`
      }
    }
    
    // YouTube Music: music.youtube.com -> youtube-music://
    if (hostname === 'music.youtube.com') {
      return `youtube-music://${hostname}${pathname}${urlObj.search}`
    }
    
    // Amazon Music: music.amazon.com -> amznmp3://
    if (hostname.includes('music.amazon')) {
      return `amznmp3://${hostname}${pathname}${urlObj.search}`
    }
    
    // Tidal: tidal.com/browse/track/xxx -> tidal://track/xxx
    if (hostname === 'tidal.com' || hostname === 'listen.tidal.com') {
      const match = pathname.match(/\/browse\/(track|album|playlist|artist)\/(\d+)/)
      if (match) {
        return `tidal://${match[1]}/${match[2]}`
      }
      // Also handle listen.tidal.com format
      const listenMatch = pathname.match(/\/(track|album|playlist|artist)\/(\d+)/)
      if (listenMatch) {
        return `tidal://${listenMatch[1]}/${listenMatch[2]}`
      }
    }
    
    // Deezer: deezer.com/track/xxx -> deezer://track/xxx
    if (hostname === 'www.deezer.com' || hostname === 'deezer.com') {
      const match = pathname.match(/^\/(track|album|playlist|artist)\/(\d+)/)
      if (match) {
        return `deezer://${match[1]}/${match[2]}`
      }
    }
    
    // SoundCloud: soundcloud.com/artist/track -> soundcloud://sounds:xxx (uses URL scheme)
    if (hostname === 'soundcloud.com' || hostname === 'www.soundcloud.com') {
      return `soundcloud://${pathname.slice(1)}`
    }
    
    // Pandora: pandora.com -> pandora://
    if (hostname.includes('pandora.com')) {
      return `pandora://${pathname.slice(1)}`
    }
    
    // Return original URL if no app scheme is available
    return url
  } catch {
    // If URL parsing fails, return the original
    return url
  }
}

/**
 * Opens a URL, attempting to use the native app deep link first.
 * If the app isn't installed, it falls back to opening the web URL.
 */
export function openWithAppFallback(webUrl: string): void {
  const appUrl = getAppDeepLink(webUrl)
  
  // If no app URL transformation occurred, just open in a new tab
  if (appUrl === webUrl) {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }
  
  // Try to open the app URL
  // Create a hidden iframe to attempt the deep link without navigating away
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  
  // Set a timeout to open the web URL as fallback
  const fallbackTimeout = setTimeout(() => {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
  }, 1500)
  
  // Try to detect if the app opened by checking if the page loses focus
  const handleBlur = () => {
    clearTimeout(fallbackTimeout)
    window.removeEventListener('blur', handleBlur)
  }
  window.addEventListener('blur', handleBlur)
  
  // Also clear timeout if visibility changes (app opened)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearTimeout(fallbackTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Attempt to open the app via the iframe
  if (iframe.contentWindow) {
    iframe.contentWindow.location.href = appUrl
  }
  
  // Clean up iframe after a delay
  setTimeout(() => {
    document.body.removeChild(iframe)
    window.removeEventListener('blur', handleBlur)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, 2000)
}
