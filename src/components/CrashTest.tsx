import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export type CrashSection = 'nav' | 'stats' | 'habits' | 'avatar'

/**
 * Sections switched off by "Try again". The router removes ?crash in a
 * transition, a moment AFTER the boundary re-renders its children — without
 * this, that first re-render would still see the flag and crash again.
 */
const defused = new Set<string>()

/**
 * Dev-only: throws during render when the URL has ?crash=<section>, so an
 * ErrorBoundary can be seen doing its job without editing code.
 * Try http://localhost:5173/habits?crash=stats
 *
 * Production builds ignore the parameter entirely.
 */
export default function CrashTest({ section }: { section: CrashSection }) {
  const [params] = useSearchParams()
  const crash = params.get('crash')
  // A fresh ?crash in the URL re-arms a section that was defused earlier.
  if (crash !== section) defused.delete(section)
  if (import.meta.env.DEV && crash === section && !defused.has(section)) {
    throw new Error(`Deliberate crash in "${section}" (from ?crash=${section})`)
  }
  return null
}

/** For a boundary's onReset: drop ?crash so "Try again" actually recovers. */
export function useClearCrash() {
  const [params, setParams] = useSearchParams()
  const crash = params.get('crash')
  return useCallback(() => {
    if (crash !== null) defused.add(crash)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('crash')
        return next
      },
      { replace: true },
    )
  }, [crash, setParams])
}
