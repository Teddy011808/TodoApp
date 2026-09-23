import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface SignUpResult {
  error: string | null
  /** True when the project requires email confirmation, so there is no session yet. */
  needsConfirmation: boolean
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  /**
   * True until Supabase has restored (or ruled out) a persisted session.
   * Without it, a refresh on a protected page would bounce to /login before
   * the stored session had a chance to load.
   */
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

/**
 * The default is `null`, not a stub object.
 *
 * A stub default would let a component sitting OUTSIDE the provider render
 * happily with a silently dead signIn. Defaulting to null means useAuth can
 * tell "no provider above me" apart from "signed out", and throw for the first.
 */
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fires INITIAL_SESSION straight away with whatever was persisted, then
    // again on every sign-in, sign-out and token refresh — including ones
    // made in another tab.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message, needsConfirmation: false }
    return { error: null, needsConfirmation: data.session === null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Memoised so the context value is not a brand-new object on every render,
  // which would re-render every consumer even when nothing actually changed.
  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Consumers go through this, never through useContext(AuthContext) directly. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be called inside an <AuthProvider>')
  }
  // Past the guard, the return type is AuthContextValue — no null for callers.
  return context
}
