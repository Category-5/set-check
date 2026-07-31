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
    if (hostname.includes('spotify.com')) {
      // Extract the type and ID from paths like /track/xxx, /album/xxx, /playlist/xxx, /artist/xxx
      const match = pathname.match(/^\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/)
      if (match) {
        return `spotify:${match[1]}:${match[2]}`
      }
    }
    
    // Apple Music: music.apple.com/xx/album/xxx -> music://music.apple.com/xx/album/xxx
    if (hostname.includes('apple.com')) {
      return `music://${hostname}${pathname}${urlObj.search}`
    }
    
    // YouTube: youtube.com/watch?v=xxx -> youtube://xxx or vnd.youtube://xxx
    if (hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) {
        return `youtube://${videoId}`
      }
    }
    if (hostname === 'youtu.be') {
      const videoId = pathname.slice(1)
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
    
    // Tidal: tidal.com/browse/track/xxx or listen.tidal.com/track/xxx -> tidal://track/xxx
    if (hostname.includes('tidal.com')) {
      const match = pathname.match(/(?:^\/browse)?\/(track|album|playlist|artist|video)\/([a-zA-Z0-9-]+)/)
      if (match) {
        return `tidal://${match[1]}/${match[2]}`
      }
    }
    
    // Deezer: deezer.com/track/xxx -> deezer://track/xxx
    if (hostname.includes('deezer.com')) {
      const match = pathname.match(/(?:^\/browse)?\/(track|album|playlist|artist)\/([a-zA-Z0-9-]+)/)
      if (match) {
        return `deezer://${match[1]}/${match[2]}`
      }
    }
    
    // SoundCloud: soundcloud.com/artist/track -> soundcloud://
    if (hostname.includes('soundcloud.com')) {
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
 * If the app isn't installed, it falls back to opening the web URL safely without popup blocker issues.
 */
export function openWithAppFallback(webUrl: string): void {
  const appUrl = getAppDeepLink(webUrl)
  const mobile = isIOS() || isAndroid()
  
  // If app URL is the same as web URL, open directly
  if (appUrl === webUrl) {
    if (mobile) {
      window.location.href = webUrl
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer')
    }
    return
  }
  
  if (mobile) {
    // Mobile approach: Use direct location assignment
    let fallbackTriggered = false
    const startTime = Date.now()
    
    const fallbackTimeout = setTimeout(() => {
      if (!document.hidden && !fallbackTriggered) {
        fallbackTriggered = true
        window.location.href = webUrl
      }
    }, 1500)
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(fallbackTimeout)
        fallbackTriggered = true
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    const handlePageHide = () => {
      clearTimeout(fallbackTimeout)
      fallbackTriggered = true
      window.removeEventListener('pagehide', handlePageHide)
    }
    window.addEventListener('pagehide', handlePageHide)
    
    const handleFocus = () => {
      const elapsed = Date.now() - startTime
      if (elapsed < 2000 && !fallbackTriggered) {
        clearTimeout(fallbackTimeout)
        fallbackTriggered = true
        window.location.href = webUrl
      }
      window.removeEventListener('focus', handleFocus)
    }
    
    setTimeout(() => {
      window.addEventListener('focus', handleFocus)
    }, 100)
    
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('focus', handleFocus)
    }, 3000)
    
    window.location.href = appUrl
  } else {
    // Desktop approach: Synchronously open target tab first to avoid popup blockers,
    // then attempt app link and redirect to web URL if app fails to launch.
    let newWindow: Window | null = null
    try {
      newWindow = window.open('about:blank', '_blank')
    } catch {
      newWindow = null
    }

    if (!newWindow) {
      // Fallback if window creation was blocked
      window.location.href = appUrl
      return
    }

    let appOpened = false

    const handleBlur = () => {
      appOpened = true
      window.removeEventListener('blur', handleBlur)
    }
    window.addEventListener('blur', handleBlur)

    const fallbackTimeout = setTimeout(() => {
      window.removeEventListener('blur', handleBlur)
      if (!appOpened && newWindow && !newWindow.closed) {
        newWindow.location.href = webUrl
      }
    }, 1200)

    try {
      newWindow.location.href = appUrl
    } catch {
      newWindow.location.href = webUrl
    }
  }
}
