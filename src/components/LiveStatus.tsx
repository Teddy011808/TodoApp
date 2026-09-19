import { useEffect, useState } from 'react'

/**
 * One live effect with a cleanup: the window-width display.
 * removeEventListener drops the resize handler on unmount, so the listener
 * does not stack up on every remount and leak the component via its closure.
 */
export default function LiveStatus() {
  const [width, setWidth] = useState<number>(() => window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize() // sync once in case the window changed before we subscribed
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="live-status">
      <span className="live-dot" aria-hidden="true" />
      <span className="live-width">{width}px</span>
    </div>
  )
}
