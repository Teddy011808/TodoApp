import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { goOffline, goOnline, installNetworkControl } from '../test/network'
import OfflineBanner from './OfflineBanner'

describe('OfflineBanner', () => {
  beforeEach(() => installNetworkControl())

  it('renders nothing while online', () => {
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('appears on the offline event, and says changes will sync', () => {
    render(<OfflineBanner />)

    goOffline()

    expect(screen.getByRole('status')).toHaveTextContent('You’re offline')
    expect(screen.getByRole('status')).toHaveTextContent('will sync when you reconnect')
  })

  it('shows "Back online" on reconnect, then gets out of the way', () => {
    vi.useFakeTimers()
    render(<OfflineBanner />)

    goOffline()
    goOnline()
    expect(screen.getByRole('status')).toHaveTextContent('Back online')

    act(() => vi.advanceTimersByTime(3000))
    expect(screen.queryByRole('status')).toBeNull()
    vi.useRealTimers()
  })
})
