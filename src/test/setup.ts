import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { resetFakeSupabase } from './fakeSupabase'

// No test talks to a real Supabase project — see fakeSupabase.ts.
vi.mock('../lib/supabase', () => import('./fakeSupabase'))
vi.mock('../lib/storage', () => import('./fakeSupabase'))

/**
 * jsdom 29 under Vitest 4 exposes `window.localStorage` as a bare object with
 * no Storage methods, so anything calling getItem/setItem blows up. Install a
 * real in-memory Storage when that happens, and leave a working one alone.
 */
function installLocalStorage() {
  const existing = window.localStorage as unknown as { getItem?: unknown } | undefined
  if (existing && typeof existing.getItem === 'function') return

  let store = new Map<string, string>()

  const storage: Storage = {
    get length() {
      return store.size
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value))
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store = new Map<string, string>()
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

installLocalStorage()

afterEach(() => {
  cleanup()
})

// Each test starts from an empty store so persisted cart state cannot leak
// between tests and make them order-dependent.
beforeEach(() => {
  window.localStorage.clear()
  resetFakeSupabase()
})
