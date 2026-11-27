export const COVER_BUCKET = "playlist-covers"
export const MAX_COVER_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export type CoverValidation =
  | { ok: true; extension: string }
  | { ok: false; error: string; status: number }

export function validateCover(file: { type: string; size: number }): CoverValidation {
  const extension = EXTENSIONS[file.type]
  if (!extension) {
    return { ok: false, error: "Cover must be a JPEG, PNG, WebP or GIF image", status: 415 }
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, error: "Cover must be 5 MB or smaller", status: 413 }
  }
  return { ok: true, extension }
}

export function coverPath(playlistId: string, extension: string, now = Date.now()) {
  const safeId = playlistId.replace(/[^A-Za-z0-9_-]/g, "")
  return `${safeId}/${now}.${extension}`
}
