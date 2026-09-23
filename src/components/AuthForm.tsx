import { useState, type FormEvent, type ReactNode } from 'react'

interface AuthFormProps {
  title: string
  subtitle: ReactNode
  submitLabel: string
  pendingLabel: string
  passwordAutoComplete: 'current-password' | 'new-password'
  /** Resolves to an error message, or null on success. */
  onSubmit: (email: string, password: string) => Promise<string | null>
  footer: ReactNode
  notice?: string | null
}

/** The email + password form shared by sign-in and sign-up. */
export default function AuthForm({
  title,
  subtitle,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  onSubmit,
  footer,
  notice,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    setSubmitting(true)
    const message = await onSubmit(trimmedEmail, password)
    setSubmitting(false)
    if (message !== null) setError(message)
  }

  return (
    <section className="page page-narrow">
      <div className="card signin-card">
        <header className="signin-head">
          <h1>{title}</h1>
          <p className="page-sub">{subtitle}</p>
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
            autoComplete={passwordAutoComplete}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          {error !== null && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="form-notice" role="status">
              {notice}
            </p>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? pendingLabel : submitLabel}
          </button>
        </form>

        <p className="auth-switch">{footer}</p>
      </div>
    </section>
  )
}
