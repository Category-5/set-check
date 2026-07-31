"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookmarkCheck, X } from "lucide-react"

interface SongPreferenceControlsProps {
  rememberPreference: boolean
  preferredPlatform: string | null
  preferredPlatformName?: string
  onToggleRemember: (remember: boolean) => void
  onClearPreference: () => void
  isLoaded: boolean
}

export function SongPreferenceControls({
  rememberPreference,
  preferredPlatform,
  preferredPlatformName,
  onToggleRemember,
  onClearPreference,
  isLoaded,
}: SongPreferenceControlsProps) {
  if (!isLoaded) return null

  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-primary shrink-0" />
            <Label
              htmlFor="remember-preference-toggle"
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              Remember streaming service preference
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            When enabled, shared song links will remember your preferred app.
          </p>
        </div>
        <Switch
          id="remember-preference-toggle"
          checked={rememberPreference}
          onCheckedChange={onToggleRemember}
          className="mt-0.5 shrink-0"
        />
      </div>

      {preferredPlatform && (
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <span>Current preference:</span>
            <Badge variant="secondary" className="font-medium text-xs py-0">
              {preferredPlatformName || preferredPlatform}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearPreference}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
