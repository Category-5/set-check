import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Set Check - Free Collaborative Setlist Builder"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1025 0%, #0f0a14 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "60px",
          }}
        >
          {/* Logo */}
          <svg
            width="280"
            height="280"
            viewBox="0 0 120 120"
            fill="none"
          >
            <defs>
              <linearGradient id="ogGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#E9D5FF" />
              </linearGradient>
            </defs>
            
            <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
            <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
            <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
            
            <path
              d="M62 22 C76 18 94 32 96 55 C98 75 84 88 66 94 C60 96 54 94 54 88 C54 82 64 78 74 68 C84 56 84 42 74 32 C66 24 58 26 58 28 C54 30 54 24 62 22 Z"
              fill="url(#ogGradient)"
            />
            <path
              d="M54 88 C50 88 44 92 42 98 C44 96 48 94 54 94 C52 92 52 90 54 88 Z"
              fill="#E9D5FF"
            />
            <ellipse cx="46" cy="96" rx="6" ry="5" fill="#E9D5FF" transform="rotate(-35 46 96)" />
          </svg>

          {/* Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "80px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              Set Check
            </div>
            <div
              style={{
                fontSize: "32px",
                color: "#a1a1aa",
                maxWidth: "600px",
              }}
            >
              Build setlists together. Vote on songs.
              100% free.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
