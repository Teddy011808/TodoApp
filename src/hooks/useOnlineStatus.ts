import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/**
 * True while the browser believes it has a network connection.
 *
 * navigator.onLine is the value; the online/offline events say WHEN to read
 * it again. useSyncExternalStore subscribes to both and reads the value on
 * every render, so the banner can never show a stale answer.
 *
 * `true` only means "connected to a network", not "the server is reachable" —
 * which is why writes still handle their own failures.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
