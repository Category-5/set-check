'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      disabled={!mounted}
      className="flex size-10 items-center justify-center transition-colors hover:bg-sunk disabled:opacity-45"
      aria-label={mounted ? `Switch to ${isDark ? 'day' : 'night'} mode` : 'Theme'}
    >
      <span
        className="block size-4 rounded-full border-[1.5px] border-ink overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="block h-full bg-ink transition-[width] duration-200"
          style={{ width: isDark ? '100%' : '50%' }}
        />
      </span>
    </button>
  )
}
