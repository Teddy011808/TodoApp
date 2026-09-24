import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getUploads, queueQueryResult, queueUploadResult } from '../test/fakeSupabase'
import AvatarUploader from './AvatarUploader'

function image(name: string, bytes: number, type = 'image/png') {
  return new File([new Uint8Array(bytes)], name, { type })
}

function renderUploader() {
  return render(<AvatarUploader userId="user-1" email="teddy@gmail.com" />)
}

describe('AvatarUploader', () => {
  beforeEach(() => {
    // jsdom has no object URLs; stand in for the preview blob.
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders the saved avatar on mount', async () => {
    queueQueryResult({ data: { avatar_url: 'https://cdn/avatar.png?v=1' }, error: null }, 'profiles')
    renderUploader()

    expect(await screen.findByRole('img', { name: 'Your avatar' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.png?v=1',
    )
  })

  it('refuses a 5 MB file client-side: inline error, no preview, nothing uploaded', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderUploader()

    await user.upload(screen.getByLabelText('Choose image'), image('huge.png', 5 * 1024 * 1024))

    expect(await screen.findByRole('alert')).toHaveTextContent('That image is 5.0 MB. The limit is 1 MB.')
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Upload' })).toBeNull()
    expect(getUploads()).toHaveLength(0)
  })

  it('refuses a non-image with a clear message', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderUploader()

    await user.upload(screen.getByLabelText('Choose image'), image('notes.pdf', 2000, 'application/pdf'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Only PNG, JPEG, WebP or GIF')
  })

  it('previews a valid image before uploading it', async () => {
    const user = userEvent.setup()
    renderUploader()

    await user.upload(screen.getByLabelText('Choose image'), image('me.png', 50_000))

    expect(screen.getByRole('img', { name: 'Preview of your new avatar' })).toHaveAttribute('src', 'blob:preview')
    expect(screen.getByText('Preview — not saved yet.')).toBeInTheDocument()
    expect(getUploads()).toHaveLength(0)
  })

  it('uploads into the user’s own folder with upsert, then shows the saved avatar', async () => {
    const user = userEvent.setup()
    renderUploader()

    await user.upload(screen.getByLabelText('Choose image'), image('me.png', 50_000))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    const saved = await screen.findByRole('img', { name: 'Your avatar' })
    expect(saved.getAttribute('src')).toMatch(
      /^https:\/\/test\.supabase\.co\/storage\/v1\/object\/public\/avatars\/user-1\/avatar\?v=\d+$/,
    )
    expect(getUploads()).toEqual([
      expect.objectContaining({ bucket: 'avatars', path: 'user-1/avatar', options: expect.objectContaining({ upsert: true }) }),
    ])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('re-uploading writes to the same path, replacing rather than duplicating', async () => {
    const user = userEvent.setup()
    renderUploader()

    for (const name of ['first.png', 'second.png']) {
      await user.upload(screen.getByLabelText(/Choose/), image(name, 50_000))
      await user.click(screen.getByRole('button', { name: 'Upload' }))
      await screen.findByRole('img', { name: 'Your avatar' })
    }

    expect(getUploads().map((upload) => upload.path)).toEqual(['user-1/avatar', 'user-1/avatar'])
  })

  it('shows the storage error and keeps the preview when the upload is refused', async () => {
    queueUploadResult({ data: null, error: { message: 'new row violates row-level security policy' } })
    const user = userEvent.setup()
    renderUploader()

    await user.upload(screen.getByLabelText('Choose image'), image('me.png', 50_000))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('row-level security')
    expect(screen.getByRole('img', { name: 'Preview of your new avatar' })).toBeInTheDocument()
  })
})
