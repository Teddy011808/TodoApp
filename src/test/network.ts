import { act } from '@testing-library/react'

let online = true

/** Makes navigator.onLine controllable; call once per test file (beforeEach). */
export function installNetworkControl() {
  online = true
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online })
}

/** Flip the connection and fire the matching window event, as a browser would. */
export function goOffline() {
  act(() => {
    online = false
    window.dispatchEvent(new Event('offline'))
  })
}

export function goOnline() {
  act(() => {
    online = true
    window.dispatchEvent(new Event('online'))
  })
}

export function setOnlineSilently(value: boolean) {
  online = value
}
