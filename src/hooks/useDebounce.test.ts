import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebounce } from './useDebounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('returns the initial value straight away', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('holds the new value back until the delay has passed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    expect(result.current).toBe('a') // not yet

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe('a') // still not yet

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('ab') // now
  })

  it('collapses rapid typing into a single update', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: '' },
    })

    // eight keystrokes, 100ms apart — never a 500ms gap
    for (const value of ['L', 'Le', 'Lea', 'Lean', 'Leann', 'Leanne', 'Leanne ', 'Leanne G']) {
      rerender({ value })
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }

    // nothing has been committed yet: every timer was cancelled by the next keystroke
    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // and only the FINAL value lands — not the eight intermediate ones
    expect(result.current).toBe('Leanne G')
  })

  it('cancels the pending timer when the hook unmounts', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    unmount()

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('handles an empty value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'something' },
    })

    rerender({ value: '' })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('')
  })
})
