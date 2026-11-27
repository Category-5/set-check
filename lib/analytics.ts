import { createHash, createHmac } from "node:crypto"

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|node-fetch|axios/i

export const SITE_HOSTS = new Set(["setcheck.app", "www.setcheck.app", "staging.setcheck.app"])

export function isBot(userAgent: string | null) {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

export function deviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(userAgent)) return "tablet"
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile"
  return "desktop"
}

/** Keeps only the pathname, capped in length; returns null for anything that isn't a page path. */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null
  const path = raw.split(/[?#]/)[0].slice(0, 300)
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return null
  return path
}

/** Hostname of an external referrer; null for missing, invalid or same-site referrers. */
export function referrerHost(raw: unknown, ownHost?: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase()
    if (!host) return null
    const own = ownHost?.split(":")[0].replace(/^www\./, "").toLowerCase()
    if (host === own || SITE_HOSTS.has(host)) return null
    return host.slice(0, 200)
  } catch {
    return null
  }
}

/**
 * Daily-rotating visitor id. The salt is derived from a secret and the UTC
 * date, so the same visitor hashes the same within a day and differently the
 * next, and the hash can't be reversed to an IP without the secret.
 */
export function visitorHash(secret: string, ip: string, userAgent: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10)
  const salt = createHmac("sha256", secret).update(day).digest()
  return createHash("sha256").update(salt).update(ip).update("|").update(userAgent).digest("hex").slice(0, 32)
}

/** Client IP from the proxy headers: Cloudflare first, then generic proxies. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}

export function clientCountry(headers: Headers): string | null {
  const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country")
  if (!country || country === "XX" || country === "T1") return null
  return country.toUpperCase().slice(0, 2)
}
