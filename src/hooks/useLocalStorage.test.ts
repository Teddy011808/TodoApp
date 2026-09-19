import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  it('falls back to the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current[0]).toBe('dark')
  })

  it('reads an existing value out of storage', () => {
    window.localStorage.setItem('theme', JSON.stringify('light'))
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))
    expect(result.current[0]).toBe('light')
  })

  it('writes through to storage when the value changes', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))

    act(() => {
      result.current[1](7)
    })

    expect(result.current[0]).toBe(7)
    expect(window.localStorage.getItem('count')).toBe('7')
  })

  it('survives a remount — the value comes back', () => {
    const first = renderHook(() => useLocalStorage('cart', ['keyboard']))
    act(() => {
      first.result.current[1](['keyboard', 'hub'])
    })
    first.unmount()

    const second = renderHook(() => useLocalStorage<string[]>('cart', []))
    expect(second.result.current[0]).toEqual(['keyboard', 'hub'])
  })

  it('falls back to the initial value when the stored JSON is corrupt', () => {
    window.localStorage.setItem('broken', '{not json at all')
    const { result } = renderHook(() => useLocalStorage('broken', 'safe-default'))
    expect(result.current[0]).toBe('safe-default')
  })

  it('does not throw when storage itself is unavailable', () => {
    const original = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem() {
          throw new Error('SecurityError: storage is blocked')
        },
        setItem() {
          throw new Error('QuotaExceededError')
        },
        removeItem() {},
        clear() {},
        key: () => null,
        length: 0,
      },
    })

    expect(() => renderHook(() => useLocalStorage('x', 'fallback'))).not.toThrow()

    Object.defineProperty(window, 'localStorage', { configurable: true, value: original })
  })

  it('stores objects and arrays, not just strings', () => {
    const { result } = renderHook(() => useLocalStorage('user', { name: '' }))

    act(() => {
      result.current[1]({ name: 'Teddy' })
    })

    expect(result.current[0]).toEqual({ name: 'Teddy' })
    expect(JSON.parse(window.localStorage.getItem('user') as string)).toEqual({ name: 'Teddy' })
  })
})
