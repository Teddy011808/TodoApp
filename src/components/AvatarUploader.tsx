import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AVATAR_ACCEPT, validateAvatar } from '../lib/avatar'
import { useAvatar } from '../hooks/useAvatar'

interface AvatarUploaderProps {
  userId: string
  email: string
}

export default function AvatarUploader({ userId, email }: AvatarUploaderProps) {
  const { avatarUrl, loading, uploading, error, setError, upload } = useAvatar(userId)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Each object URL pins the file in memory until revoked. Revoke the old one
  // whenever the preview changes, and on unmount.
  useEffect(() => {
    if (previewUrl === null) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const clearChoice = () => {
    setFile(null)
    setPreviewUrl(null)
    // Reset the input too, so picking the same file again still fires onChange.
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleChoose = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return

    const invalid = validateAvatar(chosen)
    if (invalid !== null) {
      clearChoice()
      setError(invalid)
      return
    }

    setError(null)
    setFile(chosen)
    setPreviewUrl(URL.createObjectURL(chosen))
  }

  const handleUpload = async () => {
    if (file === null) return
    if (await upload(file)) clearChoice()
  }

  // The preview wins while a file is chosen; otherwise the saved avatar.
  const shown = previewUrl ?? avatarUrl
  const initial = email.charAt(0).toUpperCase()

  return (
    <div className="avatar-uploader">
      <div className="avatar-frame" aria-busy={loading || uploading}>
        {shown !== null ? (
          <img
            className="avatar-img"
            src={shown}
            alt={previewUrl !== null ? 'Preview of your new avatar' : 'Your avatar'}
          />
        ) : (
          <span className="avatar-initial" aria-hidden="true">
            {loading ? '' : initial}
          </span>
        )}
      </div>

      <div className="avatar-controls">
        {previewUrl !== null && <p className="avatar-status">Preview — not saved yet.</p>}

        <label className="btn btn-sm" htmlFor="avatar-file">
          {avatarUrl === null ? 'Choose image' : 'Choose a new image'}
        </label>
        <input
          ref={inputRef}
          id="avatar-file"
          className="visually-hidden"
          type="file"
          accept={AVATAR_ACCEPT}
          onChange={handleChoose}
          disabled={uploading}
          aria-describedby="avatar-hint"
        />
        <p id="avatar-hint" className="avatar-hint">
          PNG, JPEG, WebP or GIF, up to 1 MB.
        </p>

        {error !== null && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {file !== null && (
          <div className="avatar-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button className="btn btn-sm" type="button" onClick={clearChoice} disabled={uploading}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
