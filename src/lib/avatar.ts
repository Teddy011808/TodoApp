/** 1 MB in bytes — the same number as the bucket's file_size_limit. */
export const MAX_AVATAR_BYTES = 1024 * 1024

/**
 * Raster formats only. SVG is deliberately missing: it is XML that can carry
 * <script>, so an "image" could run code when opened from its public URL.
 */
export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** What the file input's `accept` attribute is set to. */
export const AVATAR_ACCEPT = ALLOWED_AVATAR_TYPES.join(',')

function formatSize(bytes: number): string {
  if (bytes >= MAX_AVATAR_BYTES) return `${(bytes / MAX_AVATAR_BYTES).toFixed(1)} MB`
  return `${Math.ceil(bytes / 1024)} KB`
}

/**
 * Returns a message for the user when the file is refused, or null when it is
 * fine to upload.
 *
 * This is UX, not security: file.type comes from the file's extension and
 * anyone can call the Storage API without this page. The bucket limits and
 * the storage policies in supabase/avatars.sql are what actually hold.
 */
export function validateAvatar(file: File): string | null {
  // An empty file is not an image, whatever its name says.
  if (file.size === 0) {
    return 'That file is empty. Choose an image.'
  }

  // Type first: a 5 MB PDF is wrong because it is a PDF, not because of its size.
  if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return 'Only PNG, JPEG, WebP or GIF images can be used as an avatar.'
  }

  // `>` not `>=`: exactly 1 MB is allowed, matching the bucket's limit.
  if (file.size > MAX_AVATAR_BYTES) {
    return `That image is ${formatSize(file.size)}. The limit is 1 MB.`
  }

  return null
}
