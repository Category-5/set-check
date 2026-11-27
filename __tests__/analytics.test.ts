import { describe, it, expect } from "vitest"
import {
  clientCountry,
  clientIp,
  deviceType,
  isBot,
  normalizePath,
  referrerHost,
  visitorHash,
} from "@/lib/analytics"

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/120 Safari/537.36"
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"

describe("isBot", () => {
  it("flags crawlers, link previews and missing user agents", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true)
    expect(isBot("facebookexternalhit/1.1")).toBe(true)
    expect(isBot("curl/8.4.0")).toBe(true)
    expect(isBot(null)).toBe(true)
  })

  it("lets browsers through", () => {
    expect(isBot(DESKTOP)).toBe(false)
    expect(isBot(IPHONE)).toBe(false)
  })
})

describe("deviceType", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceType(IPHONE)).toBe("mobile")
    expect(deviceType(IPAD)).toBe("tablet")
    expect(deviceType(ANDROID_TABLET)).toBe("tablet")
    expect(deviceType(DESKTOP)).toBe("desktop")
  })
})

describe("normalizePath", () => {
  it("drops query strings and fragments", () => {
    expect(normalizePath("/p/abc?ref=x#top")).toBe("/p/abc")
  })

  it("rejects non-paths, protocol-relative URLs and internal routes", () => {
    expect(normalizePath("https://evil.example/")).toBeNull()
    expect(normalizePath("//evil.example")).toBeNull()
    expect(normalizePath("/api/track")).toBeNull()
    expect(normalizePath(42)).toBeNull()
  })

  it("caps length", () => {
    expect(normalizePath("/" + "a".repeat(1000))!.length).toBe(300)
  })
})

describe("referrerHost", () => {
  it("keeps external hosts without www", () => {
    expect(referrerHost("https://www.google.com/search?q=setlist")).toBe("google.com")
  })

  it("drops same-site, invalid and empty referrers", () => {
    expect(referrerHost("https://setcheck.app/p/1", "setcheck.app")).toBeNull()
    expect(referrerHost("https://staging.setcheck.app/", "localhost:3000")).toBeNull()
    expect(referrerHost("http://localhost:3000/", "localhost:3000")).toBeNull()
    expect(referrerHost("not a url")).toBeNull()
    expect(referrerHost("")).toBeNull()
  })
})

describe("visitorHash", () => {
  const day1 = new Date("2026-11-27T10:00:00Z")
  const day1Later = new Date("2026-11-27T23:59:00Z")
  const day2 = new Date("2026-11-28T00:01:00Z")

  it("is stable within a UTC day", () => {
    expect(visitorHash("s", "1.2.3.4", DESKTOP, day1)).toBe(visitorHash("s", "1.2.3.4", DESKTOP, day1Later))
  })

  it("rotates daily and depends on the secret, IP and user agent", () => {
    const base = visitorHash("s", "1.2.3.4", DESKTOP, day1)
    expect(visitorHash("s", "1.2.3.4", DESKTOP, day2)).not.toBe(base)
    expect(visitorHash("other", "1.2.3.4", DESKTOP, day1)).not.toBe(base)
    expect(visitorHash("s", "1.2.3.5", DESKTOP, day1)).not.toBe(base)
    expect(visitorHash("s", "1.2.3.4", IPHONE, day1)).not.toBe(base)
  })

  it("never contains the IP", () => {
    expect(visitorHash("s", "1.2.3.4", DESKTOP, day1)).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe("clientIp and clientCountry", () => {
  it("prefers Cloudflare headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "9.9.9.9",
      "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      "cf-ipcountry": "us",
    })
    expect(clientIp(headers)).toBe("9.9.9.9")
    expect(clientCountry(headers)).toBe("US")
  })

  it("falls back to the first forwarded address and Vercel's country", () => {
    const headers = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-vercel-ip-country": "CA" })
    expect(clientIp(headers)).toBe("1.1.1.1")
    expect(clientCountry(headers)).toBe("CA")
  })

  it("ignores Cloudflare's unknown and Tor country codes", () => {
    expect(clientCountry(new Headers({ "cf-ipcountry": "XX" }))).toBeNull()
    expect(clientCountry(new Headers({ "cf-ipcountry": "T1" }))).toBeNull()
  })
})
