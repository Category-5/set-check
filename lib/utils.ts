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
 * Detects if the user is on an iOS device
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Detects if the user is on an Android device
 */
function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/**
 * Opens a URL, attempting to use the native app deep link first.
 * If the app isn't installed, it falls back to opening the web URL.
 * 
 * Mobile-specific handling:
 * - iOS: Uses direct location assignment with visibility-based fallback
 * - Android: Uses intent URLs for supported apps with fallback
 * - Desktop: Uses window.open with blur detection
 */
export function openWithAppFallback(webUrl: string): void {
  const appUrl = getAppDeepLink(webUrl)
  
  // If no app URL transformation occurred, just open in a new tab
  if (appUrl === webUrl) {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }
  
  const mobile = isIOS() || isAndroid()
  
  if (mobile) {
    // Mobile approach: Use direct location assignment
    // This works on iOS because it's triggered by direct user interaction
    
    let fallbackTriggered = false
    const startTime = Date.now()
    
    // Set a timeout to open the web URL as fallback
    // Using a shorter timeout on mobile for better UX
    const fallbackTimeout = setTimeout(() => {
      // Only trigger fallback if the page is still visible
      // If app opened, the page will be hidden/backgrounded
      if (!document.hidden && !fallbackTriggered) {
        fallbackTriggered = true
        window.location.href = webUrl
      }
    }, 1500)
    
    // Listen for visibility change - if page becomes hidden, app likely opened
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(fallbackTimeout)
        fallbackTriggered = true
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also handle the pagehide event for iOS
    const handlePageHide = () => {
      clearTimeout(fallbackTimeout)
      fallbackTriggered = true
      window.removeEventListener('pagehide', handlePageHide)
    }
    window.addEventListener('pagehide', handlePageHide)
    
    // On return to the page (app wasn't installed or user came back)
    const handleFocus = () => {
      // If we come back to the page quickly, the app probably didn't open
      const elapsed = Date.now() - startTime
      if (elapsed < 2000 && !fallbackTriggered) {
        // App didn't open, trigger fallback
        clearTimeout(fallbackTimeout)
        fallbackTriggered = true
        window.location.href = webUrl
      }
      window.removeEventListener('focus', handleFocus)
    }
    // Delay adding focus listener to avoid immediate trigger
    setTimeout(() => {
      window.addEventListener('focus', handleFocus)
    }, 100)
    
    // Clean up after a delay
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('focus', handleFocus)
    }, 3000)
    
    // Attempt to open the app - use location.href for mobile
    // This is the key difference: on mobile, we navigate the current page
    window.location.href = appUrl
  } else {
    // Desktop approach: Use window.open with blur detection
    
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
    
    // Clean up listeners after a delay
    setTimeout(() => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, 2000)
    
    // Attempt to open the app via direct location on a new window/tab
    // Some browsers block this, so we use a try-catch
    try {
      const newWindow = window.open(appUrl, '_blank')
      // If window.open returned null, try location directly
      if (!newWindow) {
        window.location.href = appUrl
      }
    } catch {
      // Fallback: try direct location assignment
      window.location.href = appUrl
    }
  }
}
