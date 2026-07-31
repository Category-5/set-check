"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Star } from "lucide-react"
import { openWithAppFallback } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PlatformButtonProps {
  platform: string
  url: string
  name: string
  color: string
  isPreferred?: boolean
  onClick?: () => void
}

export function PlatformButton({
  platform,
  url,
  name,
  color,
  isPreferred,
  onClick,
}: PlatformButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    openWithAppFallback(url)
  }

  return (
    <Button
      key={platform}
      variant={isPreferred ? "default" : "secondary"}
      className="w-full justify-between h-12 relative transition-all"
      onClick={handleClick}
    >
      <span className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="font-medium">{name}</span>
        {isPreferred && (
          <Badge variant="outline" className="text-xs py-0.5 px-2 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Preferred
          </Badge>
        )}
      </span>
      <ExternalLink className="w-4 h-4 opacity-70" />
    </Button>
  )
}
