import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'

/** Where to land after a successful sign-in, if we were not sent here from somewhere. */
const DEFAULT_DESTINATION = '/habits'

interface FromState {
  from?: string
}

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Wherever the user was headed before ProtectedRoute sent them here.
  const state = location.state as FromState | null
  const destination = state?.from ?? DEFAULT_DESTINATION

  // Signed in — by this form, or already from a restored session. The redirect
  // waits for onAuthStateChange to update context rather than racing it.
  useEffect(() => {
    if (user !== null) {
      navigate(destination, { replace: true })
    }
  }, [user, destination, navigate])

  return (
    <AuthForm
      title="Sign in"
      subtitle="Welcome back — your habits are waiting."
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      passwordAutoComplete="current-password"
      onSubmit={signIn}
      footer={
        <>
          No account yet?{' '}
          <Link to="/signup" state={location.state}>
            Create one
          </Link>
        </>
      }
    />
  )
}
