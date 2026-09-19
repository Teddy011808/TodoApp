import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types'

const API = 'https://jsonplaceholder.typicode.com'

export default function UsersPage() {
  const [search, setSearch] = useState('') // what the user is typing, updates every keystroke
  const [breakApi, setBreakApi] = useState(false) // points the fetch at a bad URL, to show the error state

  // The debounced value trails the raw one by 500ms of quiet.
  const query = useDebounce(search, 500)
  const settling = search !== query

  const url = breakApi
    ? `${API}/this-endpoint-does-not-exist`
    : `${API}/users?name_like=${encodeURIComponent(query)}`

  // The generic instantiated with an array type. `users` is User[] | null,
  // and the cancelled-flag race guard now lives inside the hook.
  const { data: users, loading, error } = useFetch<User[]>(url)

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

        {/* raw vs debounced, side by side — the whole point of useDebounce */}
        <dl className="debounce-demo">
          <div className="debounce-cell">
            <dt>Raw value</dt>
            <dd aria-label="Raw search value">{search === '' ? <em>empty</em> : search}</dd>
            <span className="debounce-note">every keystroke</span>
          </div>
          <div className={settling ? 'debounce-cell is-settling' : 'debounce-cell'}>
            <dt>Debounced {settling && <span className="debounce-pending">settling…</span>}</dt>
            <dd aria-label="Debounced search value">{query === '' ? <em>empty</em> : query}</dd>
            <span className="debounce-note">after 500ms of quiet — this is what fetches</span>
          </div>
        </dl>

        {loading && <UserSkeleton />}

        {!loading && error !== null && (
          <div className="state state-error" role="alert">
            <strong>Could not load the directory.</strong>
            <p>{error}</p>
          </div>
        )}

        {/* `users &&` is not decoration — without it TypeScript refuses .length and .map */}
        {!loading && error === null && users && users.length === 0 && (
          <div className="state state-empty">
            <strong>No users match “{query}”.</strong>
            <p>Try a different name, or clear the search box.</p>
          </div>
        )}

        {!loading && error === null && users && users.length > 0 && (
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
