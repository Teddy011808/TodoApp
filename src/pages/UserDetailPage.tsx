import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { User } from '../types'

const API = 'https://jsonplaceholder.typicode.com'

type Status = 'loading' | 'error' | 'ready'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>() // the URL param is the single source of truth

  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Re-runs whenever the :id segment changes; `cancelled` keeps an in-flight
  // response for an old id from landing after you've already navigated on.
  useEffect(() => {
    let cancelled = false

    setStatus('loading')
    setError(null)

    fetch(`${API}/users/${id}`)
      .then((response) => {
        if (response.status === 404) throw new Error(`No user with id "${id}".`)
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
        return response.json() as Promise<User>
      })
      .then((data) => {
        if (cancelled) return
        setUser(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <section className="page">
      <Link to="/users" className="back-link">
        ← Back to directory
      </Link>

      {status === 'loading' && (
        <div className="card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      )}

      {status === 'error' && (
        <div className="card">
          <div className="state state-error" role="alert">
            <strong>Could not load user {id}.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {status === 'ready' && user && (
        <>
          <header className="page-head detail-head">
            <span className="avatar avatar-lg" aria-hidden="true">
              {user.name.charAt(0)}
            </span>
            <div>
              <h1>{user.name}</h1>
              <p className="page-sub">
                @{user.username} &middot; user #{user.id}
              </p>
            </div>
          </header>

          <div className="card detail-grid">
            <Field label="Email" value={user.email} href={`mailto:${user.email}`} />
            <Field label="Phone" value={user.phone} />
            <Field label="Website" value={user.website} href={`https://${user.website}`} />
            <Field label="Company" value={`${user.company.name} — ${user.company.catchPhrase}`} />
            <Field
              label="Address"
              value={`${user.address.suite} ${user.address.street}, ${user.address.city} ${user.address.zipcode}`}
            />
          </div>
        </>
      )}
    </section>
  )
}

interface FieldProps {
  label: string
  value: string
  href?: string
}

function Field({ label, value, href }: FieldProps): ReactNode {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{href ? <a href={href}>{value}</a> : value}</dd>
    </div>
  )
}
