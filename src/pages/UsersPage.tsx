import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../types'

const API = 'https://jsonplaceholder.typicode.com'

type Status = 'loading' | 'error' | 'ready'

export default function UsersPage() {
  const [search, setSearch] = useState('') // what the user is typing
  const [query, setQuery] = useState('') // debounced value that actually drives the fetch
  const [breakApi, setBreakApi] = useState(false) // points the fetch at a bad URL, to show the error state

  const [status, setStatus] = useState<Status>('loading')
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  // Debounce: the cleanup cancels the pending timer on every keystroke,
  // so only the last pause of 300ms actually commits a query.
  useEffect(() => {
    const timeoutId = setTimeout(() => setQuery(search), 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  // The fetch. `cancelled` makes a slow, out-of-order response a no-op,
  // so an older request can never overwrite a newer one's data.
  useEffect(() => {
    let cancelled = false

    setStatus('loading')
    setError(null)

    const url = breakApi
      ? `${API}/this-endpoint-does-not-exist`
      : `${API}/users?name_like=${encodeURIComponent(query)}`

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
        return response.json() as Promise<User[]>
      })
      .then((data) => {
        if (cancelled) return
        setUsers(data)
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
  }, [query, breakApi])

  return (
    <section className="page">
      <header className="page-head">
        <h1>User directory</h1>
        <p className="page-sub">Live data from jsonplaceholder.typicode.com</p>
      </header>

      <div className="card">
        <div className="directory-controls">
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name…"
            aria-label="Search users by name"
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={breakApi}
              onChange={(event) => setBreakApi(event.target.checked)}
            />
            <span>Simulate API failure</span>
          </label>
        </div>

        {status === 'loading' && <UserSkeleton />}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <strong>Could not load the directory.</strong>
            <p>{error}</p>
          </div>
        )}

        {status === 'ready' && users.length === 0 && (
          <div className="state state-empty">
            <strong>No users match “{query}”.</strong>
            <p>Try a different name, or clear the search box.</p>
          </div>
        )}

        {status === 'ready' && users.length > 0 && (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-row">
                <Link to={`/users/${user.id}`} className="user-link">
                  <span className="avatar" aria-hidden="true">
                    {user.name.charAt(0)}
                  </span>
                  <span className="user-meta">
                    <span className="user-name">{user.name}</span>
                    <span className="user-sub">
                      @{user.username} &middot; {user.company.name}
                    </span>
                  </span>
                  <span className="chevron" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function UserSkeleton() {
  return (
    <ul className="user-list" aria-busy="true" aria-label="Loading users">
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index} className="user-row">
          <div className="skeleton-row">
            <span className="skeleton skeleton-avatar" />
            <span className="skeleton-lines">
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line short" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
