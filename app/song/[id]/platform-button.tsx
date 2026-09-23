"use client"

import { openWithAppFallback } from "@/lib/utils"

interface PlatformButtonProps {
  platform: string
  url: string
  name: string
}

export function PlatformButton({ platform, url, name }: PlatformButtonProps) {
  return (
    <button
      key={platform}
      type="button"
      onClick={() => openWithAppFallback(url)}
      className="group flex h-14 w-full cursor-pointer items-center gap-4 border-b border-rule px-5 text-left transition-colors last:border-b-0 hover:bg-sunk"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground transition-colors group-hover:bg-rubric" aria-hidden="true" />
      <span className="font-display flex-1 text-base font-medium">{name}</span>
      <svg
        viewBox="0 0 24 24"
        className="size-4 text-muted-foreground transition-colors group-hover:text-rubric"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
