import { Outlet } from 'react-router-dom'
import CrashTest, { useClearCrash } from './CrashTest'
import ErrorBoundary from './ErrorBoundary'
import NavBar from './NavBar'
import OfflineBanner from './OfflineBanner'
import UpdateToast from './UpdateToast'

export default function Layout() {
  const clearCrash = useClearCrash()

  return (
    <div className="app-shell">
      {/* A broken nav must not take the page with it, and vice versa. */}
      <ErrorBoundary
        label="Navigation"
        onReset={clearCrash}
        fallback={({ reset }) => (
          <header className="app-header boundary-nav" role="alert">
            <span>Navigation failed to load.</span>
            <a className="btn btn-sm" href="/">
              Home
            </a>
            <button type="button" className="btn btn-sm" onClick={reset}>
              Try again
            </button>
          </header>
        )}
      >
        <CrashTest section="nav" />
        <NavBar />
      </ErrorBoundary>

      <OfflineBanner />

      <main className="app-main">
        {/* Last resort for any page without finer-grained boundaries. */}
        <ErrorBoundary label="This page" onReset={clearCrash}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <UpdateToast />
    </div>
  )
}
