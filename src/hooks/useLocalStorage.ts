import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Persist a piece of state in localStorage.
 *
 * Reads once on mount (lazily, so the parse cost is paid a single time) and
 * writes on every change. Every access to `window.localStorage` is wrapped in
 * try/catch: Safari private mode throws on setItem, storage can be full, and a
 * value written by an older version of the app may no longer parse.
 * A storage failure must never take the UI down with it.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  // Lazy initialiser — readValue runs on the first render only.
  const [value, setValue] = useState<T>(readValue)

  // Keep the latest value in a ref so the storage-event listener below can read
  // it without re-subscribing on every change.
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Out of quota or blocked — the app keeps working from memory.
    }
  }, [key, value])

  // Another tab changed this key: adopt its value so the tabs stay in step.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      try {
        setValue(event.newValue === null ? initialValue : (JSON.parse(event.newValue) as T))
      } catch {
        // Ignore an unparseable value from the other tab.
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, initialValue])

  return [value, setValue] as const
}
