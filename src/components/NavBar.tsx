import { useState, type FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartCount } from '../context/cartReducer'
import LiveStatus from './LiveStatus'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link is-active' : 'nav-link'

export default function NavBar() {
  // No auth prop is passed in from anywhere — NavBar reaches up through context.
  const { user, signIn, signOut } = useAuth()
  // Cart count also comes from context, not from a prop threaded down the tree.
  const { items } = useCart()
  const count = cartCount(items)
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)

  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    signIn(trimmed)
    setEmail('')
    setOpen(false)
  }

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
          <div className="auth-box">
            {open ? (
              <form className="signin-form" onSubmit={handleSignIn}>
                <input
                  className="input input-sm"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={!email.trim()}>
                  Go
                </button>
              </form>
            ) : (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setOpen(true)}>
                Sign in
              </button>
            )}
          </div>
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
