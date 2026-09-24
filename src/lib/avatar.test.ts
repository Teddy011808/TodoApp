import { describe, expect, it } from 'vitest'
import { MAX_AVATAR_BYTES, validateAvatar } from './avatar'

/** A File of exactly `bytes` bytes without allocating a real image. */
function fakeFile(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('validateAvatar', () => {
  it('accepts a small PNG, JPEG, WebP or GIF', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
      expect(validateAvatar(fakeFile('me', type, 20_000))).toBeNull()
    }
  })

  it('refuses a 5 MB image and says how big it was', () => {
    expect(validateAvatar(fakeFile('huge.png', 'image/png', 5 * 1024 * 1024))).toBe(
      'That image is 5.0 MB. The limit is 1 MB.',
    )
  })

  it('accepts exactly 1 MB and refuses one byte more', () => {
    expect(validateAvatar(fakeFile('edge.png', 'image/png', MAX_AVATAR_BYTES))).toBeNull()
    expect(validateAvatar(fakeFile('over.png', 'image/png', MAX_AVATAR_BYTES + 1))).not.toBeNull()
  })

  it('refuses files that are not images', () => {
    expect(validateAvatar(fakeFile('cv.pdf', 'application/pdf', 1000))).toMatch(/Only PNG, JPEG/)
  })

  it('refuses SVG, which can carry scripts', () => {
    expect(validateAvatar(fakeFile('logo.svg', 'image/svg+xml', 1000))).toMatch(/Only PNG, JPEG/)
  })

  it('refuses an empty file', () => {
    expect(validateAvatar(fakeFile('empty.png', 'image/png', 0))).toBe('That file is empty. Choose an image.')
  })
})
