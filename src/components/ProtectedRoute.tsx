import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Renders its children only for a signed-in user; everyone else is sent to
 * /login, carrying the page they wanted so sign-in can send them back.
 *
 * This is a UX guard, not a security boundary — anyone can edit client code.
 * The data itself is protected by RLS in the database.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still restoring the persisted session: redirecting now would kick a
  // signed-in user to /login on every refresh.
  if (loading) {
    return (
      <p className="page-sub" role="status">
        Checking your session…
      </p>
    )
  }

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
