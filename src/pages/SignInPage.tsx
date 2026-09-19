import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Where to land after a successful sign-in, if we were not sent here from somewhere. */
const DEFAULT_DESTINATION = '/shop'

interface FromState {
  from?: string
}

export default function SignInPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Wherever the user was headed before being sent here.
  const state = location.state as FromState | null
  const destination = state?.from ?? DEFAULT_DESTINATION

  // Already signed in? There is nothing to do on this page.
  useEffect(() => {
    if (user !== null) {
      navigate(destination, { replace: true })
    }
  }, [user, destination, navigate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError(null)

    // There is no backend here, and the module specifies signIn(email), so the
    // password is checked for shape and then deliberately dropped — it is never
    // stored in context, in state, or anywhere else.
    signIn(trimmedEmail)

    navigate(destination, { replace: true })
  }

  return (
    <section className="page page-narrow">
      <div className="card signin-card">
        <header className="signin-head">
          <h1>Sign in</h1>
          <p className="page-sub">Use any email and a password of six characters or more.</p>
        </header>

        <form className="signin-page-form" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@gmail.com"
            autoFocus
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          {error !== null && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-block" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </section>
  )
}
