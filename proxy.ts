import { NextRequest, NextResponse } from "next/server"
import { checkBasicAuth } from "@/lib/basic-auth"

// Guards the analytics dashboard with HTTP Basic auth (password: STATS_PASSWORD).
// With no password configured, /stats is closed to everyone.
export function proxy(request: NextRequest) {
  if (checkBasicAuth(request.headers.get("authorization"), process.env.STATS_PASSWORD)) {
    return NextResponse.next()
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Set Check stats", charset="UTF-8"' },
  })
}

export const config = {
  matcher: ["/stats"],
}
