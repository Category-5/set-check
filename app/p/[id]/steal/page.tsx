"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function StealPlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-user">("loading")
  const playlistId = params.id as string

  useEffect(() => {
    const stealOwnership = async () => {
      const username = localStorage.getItem("setcheck_username")
      
      if (!username) {
        setStatus("no-user")
        return
      }

      const supabase = createClient()
      
      const { error } = await supabase
        .from("playlists")
        .update({ created_by: username })
        .eq("id", playlistId)

      if (error) {
        setStatus("error")
      } else {
        setStatus("success")
        // Redirect back to the playlist after a short delay
        setTimeout(() => {
          router.push(`/p/${playlistId}`)
        }, 1500)
      }
    }

    stealOwnership()
  }, [playlistId, router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8">
        {status === "loading" && (
          <p className="text-muted-foreground">Acquiring ownership...</p>
        )}
        {status === "success" && (
          <p className="text-primary">Ownership acquired. Redirecting...</p>
        )}
        {status === "error" && (
          <p className="text-destructive">Failed to acquire ownership.</p>
        )}
        {status === "no-user" && (
          <p className="text-muted-foreground">Set your username first by visiting the playlist.</p>
        )}
      </div>
    </main>
  )
}
