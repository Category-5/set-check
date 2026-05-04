"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { openWithAppFallback } from "@/lib/utils"

interface PlatformButtonProps {
  platform: string
  url: string
  name: string
  color: string
}

export function PlatformButton({ platform, url, name, color }: PlatformButtonProps) {
  return (
    <Button
      key={platform}
      variant="secondary"
      className="w-full justify-between h-12"
      onClick={() => openWithAppFallback(url)}
    >
      <span className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        {name}
      </span>
      <ExternalLink className="w-4 h-4 text-muted-foreground" />
    </Button>
  )
}
