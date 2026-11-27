import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  clientCountry,
  clientIp,
  deviceType,
  isBot,
  normalizePath,
  referrerHost,
  visitorHash,
} from "@/lib/analytics"

// Always answers 204 so the tracker never shows errors to visitors.
const done = () => new NextResponse(null, { status: 204 })

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent")
    if (!userAgent || isBot(userAgent)) return done()

    const secret = process.env.ANALYTICS_SALT
    const supabase = createAdminClient()
    if (!secret || !supabase) return done()

    const body = await request.json().catch(() => null)
    const path = normalizePath(body?.path)
    if (!path) return done()

    const { error } = await supabase.from("page_views").insert({
      path,
      referrer_host: referrerHost(body?.referrer, request.headers.get("host")),
      visitor_hash: visitorHash(secret, clientIp(request.headers), userAgent),
      country: clientCountry(request.headers),
      device: deviceType(userAgent),
    })

    if (error) console.error("Error recording page view:", error)
  } catch (error) {
    console.error("Track error:", error)
  }
  return done()
}
