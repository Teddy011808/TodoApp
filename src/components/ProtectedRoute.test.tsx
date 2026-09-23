import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { signInAs } from '../test/fakeSupabase'
import ProtectedRoute from './ProtectedRoute'

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <h1>Tracker</h1>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('waits for the session to load instead of redirecting straight away', () => {
    renderAt('/habits')

    // First render: onAuthStateChange has not reported yet.
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session')
    expect(screen.queryByRole('heading', { name: 'Login' })).toBeNull()
  })

  it('redirects a signed-out visitor to /login', async () => {
    renderAt('/habits')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Tracker' })).toBeNull()
  })

  it('renders the page for a restored session — a refresh does not sign you out', async () => {
    signInAs('teddy@gmail.com')
    renderAt('/habits')

    expect(await screen.findByRole('heading', { name: 'Tracker' })).toBeInTheDocument()
  })
})
