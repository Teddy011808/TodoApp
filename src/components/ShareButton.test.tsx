import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButton from './ShareButton'

const props = { title: 'Habits', text: 'Look at my habits', url: 'https://habits.example' }

describe('ShareButton', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share')
  })

  it('falls back to the clipboard when there is no share sheet', async () => {
    const user = userEvent.setup() // installs a clipboard stub
    render(<ShareButton {...props} />)

    await user.click(screen.getByRole('button', { name: 'Share' }))

    expect(await navigator.clipboard.readText()).toBe('Look at my habits https://habits.example')
    expect(screen.getByRole('status')).toHaveTextContent('Link copied')
  })

  it('uses the native share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const user = userEvent.setup()
    render(<ShareButton {...props} />)

    await user.click(screen.getByRole('button', { name: 'Share' }))

    expect(share).toHaveBeenCalledWith(props)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('treats closing the share sheet as a choice, not an error', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const user = userEvent.setup()
    render(<ShareButton {...props} />)

    await user.click(screen.getByRole('button', { name: 'Share' }))

    expect(await navigator.clipboard.readText()).toBe('')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
