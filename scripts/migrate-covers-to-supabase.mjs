#!/usr/bin/env node
// Copies playlist covers from Vercel Blob into the Supabase `playlist-covers`
// bucket and rewrites playlists.cover_url. Dry run by default.
//
//   node --env-file=.env.local scripts/migrate-covers-to-supabase.mjs          # dry run
//   node --env-file=.env.local scripts/migrate-covers-to-supabase.mjs --apply  # copy + rewrite
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Safe to re-run:
// rows already pointing at Supabase are skipped.
import { createClient } from "@supabase/supabase-js"

const BUCKET = "playlist-covers"
const BLOB_HOST = ".blob.vercel-storage.com"
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }
const apply = process.argv.includes("--apply")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: playlists, error } = await supabase
  .from("playlists")
  .select("id, cover_url")
  .like("cover_url", `%${BLOB_HOST}%`)

if (error) {
  console.error("Could not list playlists:", error.message)
  process.exit(1)
}

console.log(`${playlists.length} playlist cover(s) on Vercel Blob${apply ? "" : " (dry run, pass --apply to migrate)"}`)

let migrated = 0
let failed = 0
for (const { id, cover_url: coverUrl } of playlists) {
  if (!apply) {
    console.log(`  would migrate ${id}: ${coverUrl}`)
    continue
  }
  try {
    const response = await fetch(coverUrl)
    if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`)
    const contentType = (response.headers.get("content-type") || "").split(";")[0]
    const extension = EXTENSIONS[contentType]
    if (!extension) throw new Error(`unsupported content type "${contentType}"`)

    const path = `${id.replace(/[^A-Za-z0-9_-]/g, "")}/migrated-${Date.now()}.${extension}`
    const body = new Uint8Array(await response.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType, cacheControl: "31536000" })
    if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const { error: updateError } = await supabase
      .from("playlists")
      .update({ cover_url: publicUrl })
      .eq("id", id)
      .eq("cover_url", coverUrl) // don't clobber a cover changed mid-run
    if (updateError) throw new Error(`update failed: ${updateError.message}`)

    migrated++
    console.log(`  migrated ${id} -> ${publicUrl}`)
  } catch (err) {
    failed++
    console.error(`  FAILED ${id}: ${err.message}`)
  }
}

if (apply) console.log(`Done: ${migrated} migrated, ${failed} failed.`)
process.exit(failed ? 1 : 0)
