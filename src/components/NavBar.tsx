import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartCount } from '../context/cartReducer'
import LiveStatus from './LiveStatus'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link is-active' : 'nav-link'

export default function NavBar() {
  // No auth prop is passed in from anywhere — NavBar reaches up through context.
  const { user, signOut } = useAuth()
  // Cart count also comes from context, not from a prop threaded down the tree.
  const { items } = useCart()
  const count = cartCount(items)
  const location = useLocation()

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">◆</span>
        <span>Module 4 App</span>
      </div>

      <nav className="nav">
        <NavLink to="/todos" className={linkClass}>
          Todos
        </NavLink>
        <NavLink to="/users" className={linkClass}>
          Directory
        </NavLink>
        <NavLink to="/shop" className={linkClass}>
          Shop
        </NavLink>
        <NavLink to="/checkout" className={linkClass}>
          Cart{count > 0 && <span className="cart-badge">{count}</span>}
        </NavLink>
      </nav>

      <div className="header-right">
        <LiveStatus />

        {user === null ? (
          // Remember where we were, so sign-in can send us back here afterwards.
          <Link
            to="/signin"
            state={{ from: location.pathname }}
            className="btn btn-primary btn-sm"
          >
            Sign in
          </Link>
        ) : (
          <div className="auth-box">
            <span className="greeting">Hi, {user.email}</span>
            <button className="btn btn-sm" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
