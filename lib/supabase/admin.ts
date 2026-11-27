import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client with the service role key. It bypasses RLS, so
 * never import it from client components. Returns null when the key is not
 * configured (e.g. local dev without secrets).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
