import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

/** How long "Back online" stays up after the connection returns. */
const BACK_ONLINE_MS = 3000

/**
 * A strip under the nav while offline, then a brief "Back online" when the
 * connection returns — so the user knows their queued changes are syncing.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()
  const [showBackOnline, setShowBackOnline] = useState(false)
  const wasOffline = useRef(!online)

  useEffect(() => {
    // While offline the offline message always wins, so there is nothing to reset.
    if (!online) {
      wasOffline.current = true
      return
    }
    if (!wasOffline.current) return

    // Just reconnected.
    wasOffline.current = false
    setShowBackOnline(true)
    const timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS)
    return () => clearTimeout(timer)
  }, [online])

  if (!online) {
    return (
      <div className="net-banner is-offline" role="status">
        <span aria-hidden="true">●</span> You’re offline. New habits are saved on this device and will sync
        when you reconnect.
      </div>
    )
  }

  if (showBackOnline) {
    return (
      <div className="net-banner is-online" role="status">
        <span aria-hidden="true">●</span> Back online — syncing your changes.
      </div>
    )
  }

  return null
}
