import { NavLink, Outlet } from 'react-router-dom'
import LiveStatus from './LiveStatus'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link is-active' : 'nav-link'

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span>Module 3 App</span>
        </div>

        <nav className="nav">
          <NavLink to="/todos" className={linkClass}>
            Todos
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            Directory
          </NavLink>
        </nav>

        <LiveStatus />
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
