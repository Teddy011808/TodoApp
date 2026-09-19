import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface AuthUser {
  email: string
}

export interface AuthContextValue {
  user: AuthUser | null
  signIn: (email: string) => void
  signOut: () => void
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
  const [user, setUser] = useState<AuthUser | null>(null)

  const signIn = useCallback((email: string) => {
    setUser({ email })
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
  }, [])

  // Memoised so the context value is not a brand-new object on every render,
  // which would re-render every consumer even when nothing actually changed.
  const value = useMemo<AuthContextValue>(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
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
