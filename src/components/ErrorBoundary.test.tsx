import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

let shouldThrow = true

function Fragile() {
  if (shouldThrow) throw new Error('boom')
  return <p>Fragile section is fine</p>
}

describe('ErrorBoundary', () => {
  // React logs every caught render error; keep the test output readable.
  beforeEach(() => {
    shouldThrow = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the fallback for the broken section only — siblings keep rendering', () => {
    render(
      <>
        <ErrorBoundary label="Stats">
          <Fragile />
        </ErrorBoundary>
        <button type="button">Still clickable</button>
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Stats couldn’t be displayed.')
    expect(screen.getByRole('button', { name: 'Still clickable' })).toBeEnabled()
  })

  it('renders a section-specific fallback when one is given', () => {
    render(
      <ErrorBoundary label="Stats" fallback={({ error }) => <p>Custom: {error.message}</p>}>
        <Fragile />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom: boom')).toBeInTheDocument()
  })

  it('"Try again" calls onReset and re-renders the children', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn(() => {
      shouldThrow = false
    })
    render(
      <ErrorBoundary label="Stats" onReset={onReset}>
        <Fragile />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.getByText('Fragile section is fine')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('logs the crash with its section name', () => {
    render(
      <ErrorBoundary label="Stats">
        <Fragile />
      </ErrorBoundary>,
    )

    expect(console.error).toHaveBeenCalledWith('[Stats] crashed:', expect.any(Error), expect.any(String))
  })
})
