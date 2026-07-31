"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "setcheck_streaming_preference"

export interface StreamingPreference {
  preferredPlatform: string | null
  rememberPreference: boolean
}

const DEFAULT_PREFERENCE: StreamingPreference = {
  preferredPlatform: null,
  rememberPreference: true,
}

export function useStreamingPreference() {
  const [preference, setPreference] = useState<StreamingPreference>(DEFAULT_PREFERENCE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreference({
          preferredPlatform: parsed.preferredPlatform ?? null,
          rememberPreference: parsed.rememberPreference ?? true,
        })
      }
    } catch {
      // Fall back to default on parse/storage error
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const setPreferredPlatform = useCallback((platform: string | null) => {
    setPreference((prev) => {
      const updated = { ...prev, preferredPlatform: platform }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
      return updated
    })
  }, [])

  const setRememberPreference = useCallback((remember: boolean) => {
    setPreference((prev) => {
      const updated = { ...prev, rememberPreference: remember }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
      return updated
    })
  }, [])

  const clearPreference = useCallback(() => {
    const updated = { preferredPlatform: null, rememberPreference: true }
    setPreference(updated)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  return {
    preferredPlatform: preference.preferredPlatform,
    rememberPreference: preference.rememberPreference,
    setPreferredPlatform,
    setRememberPreference,
    clearPreference,
    isLoaded,
  }
}
