import { createClient } from "@/lib/supabase/server"
import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://setcheck.app"
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
  
  // Dynamic setlist pages
  const supabase = await createClient()
  const { data: playlists } = await supabase
    .from("playlists")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1000)
  
  const setlistPages: MetadataRoute.Sitemap = (playlists || []).map((playlist) => ({
    url: `${baseUrl}/p/${playlist.id}`,
    lastModified: new Date(playlist.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))
  
  return [...staticPages, ...setlistPages]
}
