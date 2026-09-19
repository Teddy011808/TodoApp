import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const { pathname } = useLocation()

  return (
    <section className="page">
      <div className="card not-found">
        <p className="code-404">404</p>
        <h1>This page doesn’t exist</h1>
        <p className="page-sub">
          Nothing is routed to <code>{pathname}</code>.
        </p>
        <div className="not-found-actions">
          <Link to="/todos" className="btn btn-primary">
            Go to todos
          </Link>
          <Link to="/users" className="btn">
            Go to directory
          </Link>
        </div>
      </div>
    </section>
  )
}
