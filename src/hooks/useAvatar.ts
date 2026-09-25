import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'
import { validateAvatar } from '../lib/avatar'

const BUCKET = 'avatars'

/**
 * The object path for a user's avatar. Always the same name, so upsert
 * REPLACES the previous file instead of piling up avatar-1, avatar-2...
 * The first folder is the user id — the storage policy checks exactly that.
 */
export function avatarPath(userId: string): string {
  return `${userId}/avatar`
}

/** Loads the saved avatar URL on mount, and uploads a replacement. */
export function useAvatar(userId: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        // No row yet is normal for a user who has never uploaded — not an error.
        .maybeSingle()
        .overrideTypes<{ avatar_url: string | null } | null, { merge: false }>()

      if (cancelled) return
      if (queryError) setError(queryError.message)
      else setAvatarUrl(data?.avatar_url ?? null)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  /** Resolves true once the file is stored AND the profile points at it. */
  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      // Checked again here, not only when the file was picked: this function
      // is the last stop before the network, whoever calls it.
      const invalid = validateAvatar(file)
      if (invalid !== null) {
        setError(invalid)
        return false
      }

      setUploading(true)
      setError(null)
      try {
        const path = avatarPath(userId)
        const { error: uploadError } = await storage.from(BUCKET).upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '60',
        })
        if (uploadError) throw uploadError

        // The URL never changes between uploads, so browsers and the CDN would
        // keep showing the old picture. A version stamp makes each upload a
        // new URL.
        const { data } = storage.from(BUCKET).getPublicUrl(path)
        const url = `${data.publicUrl}?v=${Date.now()}`

        const { error: saveError } = await supabase
          .from('profiles')
          .upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() })
        if (saveError) throw saveError

        setAvatarUrl(url)
        return true
      } catch (err) {
        // Supabase errors are plain objects with a message, not Error instances.
        setError(
          typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'Upload failed.',
        )
        return false
      } finally {
        setUploading(false)
      }
    },
    [userId],
  )

  return { avatarUrl, loading, uploading, error, setError, upload }
}
