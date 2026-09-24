import { useRegisterSW } from 'virtual:pwa-register/react'

/** How often an open tab asks the server whether a new version was deployed. */
const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * registerType: 'prompt' means a new service worker installs in the
 * background and then WAITS. This toast is the prompt: Refresh tells it to
 * take over and reloads onto the new build; Later leaves the old one running.
 */
export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), UPDATE_CHECK_MS)
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error)
    },
  })

  if (!needRefresh && !offlineReady) return null

  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{needRefresh ? 'New version available' : 'Ready to work offline'}</span>
      {needRefresh && (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void updateServiceWorker(true)}>
          Refresh
        </button>
      )}
      <button type="button" className="btn btn-sm" onClick={close}>
        {needRefresh ? 'Later' : 'OK'}
      </button>
    </div>
  )
}
