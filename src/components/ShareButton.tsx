import { useEffect, useState } from 'react'

interface ShareButtonProps {
  title: string
  text: string
  url: string
}

type Status = 'idle' | 'copied' | 'failed'

/**
 * The phone's own share sheet where there is one (navigator.share — mobile
 * browsers and installed PWAs), otherwise copy the link to the clipboard.
 */
export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timer = setTimeout(() => setStatus('idle'), 2500)
    return () => clearTimeout(timer)
  }, [status])

  const handleShare = async () => {
    const data = { title, text, url }

    if (typeof navigator.share === 'function' && (navigator.canShare?.(data) ?? true)) {
      try {
        await navigator.share(data)
        return
      } catch (err) {
        // The user closing the share sheet is not an error.
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Anything else: fall through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setStatus('copied')
    } catch {
      // No clipboard permission (or an old browser): say so instead of failing silently.
      setStatus('failed')
    }
  }

  return (
    <div className="share">
      <button type="button" className="btn btn-sm" onClick={() => void handleShare()}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 10V2M5 5l3-3 3 3M3 9v4.5h10V9" />
        </svg>
        Share
      </button>
      <span className="share-status" role="status" aria-live="polite">
        {status === 'copied' && 'Link copied'}
        {status === 'failed' && 'Couldn’t copy — share this page’s address instead.'}
      </span>
    </div>
  )
}
