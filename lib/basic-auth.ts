import { timingSafeEqual } from "node:crypto"

/** True when an Authorization header carries Basic credentials for `password` (any username). */
export function checkBasicAuth(header: string | null, password: string | undefined): boolean {
  if (!password || !header?.startsWith("Basic ")) return false
  let decoded: string
  try {
    decoded = atob(header.slice(6))
  } catch {
    return false
  }
  const supplied = decoded.slice(decoded.indexOf(":") + 1)
  const a = Buffer.from(supplied)
  const b = Buffer.from(password)
  return a.length === b.length && timingSafeEqual(a, b)
}
