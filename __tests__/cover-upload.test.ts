import { describe, it, expect } from "vitest"
import { coverPath, MAX_COVER_BYTES, validateCover } from "@/lib/cover-upload"
import { checkBasicAuth } from "@/lib/basic-auth"

describe("validateCover", () => {
  it("accepts supported images up to 5 MB", () => {
    expect(validateCover({ type: "image/png", size: MAX_COVER_BYTES })).toEqual({ ok: true, extension: "png" })
    expect(validateCover({ type: "image/jpeg", size: 10 })).toEqual({ ok: true, extension: "jpg" })
  })

  it("rejects other types and oversized files", () => {
    expect(validateCover({ type: "image/svg+xml", size: 10 })).toMatchObject({ ok: false, status: 415 })
    expect(validateCover({ type: "text/html", size: 10 })).toMatchObject({ ok: false, status: 415 })
    expect(validateCover({ type: "image/png", size: MAX_COVER_BYTES + 1 })).toMatchObject({ ok: false, status: 413 })
  })
})

describe("coverPath", () => {
  it("files covers under the playlist id", () => {
    expect(coverPath("abc_123", "webp", 1700000000000)).toBe("abc_123/1700000000000.webp")
  })

  it("strips characters that could escape the folder", () => {
    expect(coverPath("../../etc", "png", 1)).toBe("etc/1.png")
  })
})

describe("checkBasicAuth", () => {
  const header = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`

  it("accepts the right password with any username", () => {
    expect(checkBasicAuth(header("me", "hunter2"), "hunter2")).toBe(true)
    expect(checkBasicAuth(header("", "hunter2"), "hunter2")).toBe(true)
  })

  it("allows colons in the password", () => {
    expect(checkBasicAuth(header("me", "a:b"), "a:b")).toBe(true)
  })

  it("rejects wrong, missing or malformed credentials", () => {
    expect(checkBasicAuth(header("me", "nope"), "hunter2")).toBe(false)
    expect(checkBasicAuth(null, "hunter2")).toBe(false)
    expect(checkBasicAuth("Basic !!!", "hunter2")).toBe(false)
    expect(checkBasicAuth("Bearer x", "hunter2")).toBe(false)
  })

  it("stays closed when no password is configured", () => {
    expect(checkBasicAuth(header("me", ""), undefined)).toBe(false)
    expect(checkBasicAuth(header("me", ""), "")).toBe(false)
  })
})
