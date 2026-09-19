import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'

const API = 'https://jsonplaceholder.typicode.com'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>() // the URL param is the single source of truth

  // Same hook, instantiated with a single object this time: user is User | null.
  // The URL is derived from the param, so changing :id re-runs the fetch and the
  // hook's own cleanup cancels the response for the id you just navigated away from.
  const { data: user, loading, error } = useFetch<User>(`${API}/users/${id}`)

  return (
    <section className="page">
      <Link to="/users" className="back-link">
        ← Back to directory
      </Link>

      {loading && (
        <div className="card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      )}

      {!loading && error !== null && (
        <div className="card">
          <div className="state state-error" role="alert">
            <strong>Could not load user {id}.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && error === null && user && (
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
