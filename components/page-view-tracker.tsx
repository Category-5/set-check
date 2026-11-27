"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/** Sends one beacon per client-side navigation to /api/track. No cookies. */
export function PageViewTracker() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    // The referrer only describes how the visitor arrived, so send it once.
    const referrer = lastPath.current === null ? document.referrer : ""
    lastPath.current = pathname

    const body = JSON.stringify({ path: pathname, referrer })
    try {
      if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return
    } catch {
      // Fall through to fetch.
    }
    fetch("/api/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
