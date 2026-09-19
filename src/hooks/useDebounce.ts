import { useEffect, useRef, useState } from 'react'

/**
 * Returns `value` only after it has stopped changing for `delay` ms.
 *
 * The timer handle lives in a ref so it survives re-renders without causing
 * one. The cleanup clears it on every change: without that clearTimeout the
 * old timers are never cancelled, so every keystroke eventually fires and the
 * debounce does nothing at all.
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [value, delay])

  return debouncedValue
}
