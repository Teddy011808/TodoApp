import { useState } from 'react'

/**
 * Stand-in for `virtual:pwa-register/react` under Vitest, where there is no
 * service worker. Same shape as the real hook; tests can flip the flags with
 * `stubPwaState` before rendering.
 */
let initial = { needRefresh: false, offlineReady: false }
export const updateServiceWorker = { calls: [] as boolean[] }

export function stubPwaState(next: Partial<typeof initial>) {
  initial = { ...initial, ...next }
}

export function resetPwaStub() {
  initial = { needRefresh: false, offlineReady: false }
  updateServiceWorker.calls = []
}

export function useRegisterSW(_options?: unknown) {
  const needRefresh = useState(initial.needRefresh)
  const offlineReady = useState(initial.offlineReady)
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: async (reload?: boolean) => {
      updateServiceWorker.calls.push(reload ?? false)
    },
  }
}
