import { useEffect, useState } from 'react'

/**
 * One live effect with a cleanup: the window-width display.
 * removeEventListener drops the resize handler on unmount, so the listener
 * does not stack up on every remount and leak the component via its closure.
 */

type Breakpoint = 'Mobile' | 'Tablet' | 'Laptop' | 'Desktop'

/** Derived during render from width — never stored as its own state. */
function breakpointFor(width: number): Breakpoint {
  if (width < 640) return 'Mobile'
  if (width < 1024) return 'Tablet'
  if (width < 1440) return 'Laptop'
  return 'Desktop'
}

export default function LiveStatus() {
  const [width, setWidth] = useState<number>(() => window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize() // sync once in case the window changed before we subscribed
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const breakpoint = breakpointFor(width)

  return (
    <div
      className="live-status"
      title={`Viewport: ${width}px (${breakpoint})`}
      aria-label={`Viewport ${width} pixels, ${breakpoint}`}
    >
      <svg
        className="live-icon"
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" />
        <path d="M5.5 14h5" />
      </svg>
      <span className="live-breakpoint">{breakpoint}</span>
      <span className="live-width">{width}</span>
    </div>
  )
}
