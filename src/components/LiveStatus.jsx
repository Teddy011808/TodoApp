import { useEffect, useState } from 'react'

/**
 * Two live effects, each with its own cleanup:
 *  - a 1s clock  -> clearInterval stops the timer from firing after unmount
 *  - window width -> removeEventListener drops the resize handler on unmount
 */
export default function LiveStatus() {
  const [now, setNow] = useState(() => new Date())
  const [width, setWidth] = useState(() => window.innerWidth)

  // Clock: no reactive values are read inside, so the dependency array is empty.
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  // Window width: subscribe once, unsubscribe on unmount.
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize() // sync once in case the window changed before we subscribed
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="live-status" aria-live="off">
      <span className="live-dot" aria-hidden="true" />
      <span className="live-clock">{now.toLocaleTimeString()}</span>
      <span className="live-sep">/</span>
      <span className="live-width">{width}px</span>
    </div>
  )
}
