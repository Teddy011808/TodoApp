import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import NavBar from '../components/NavBar'
import { addTestAccount } from '../test/fakeSupabase'
import LoginPage from './LoginPage'

/**
 * Renders the sign-in form under the providers it needs, plus the NavBar, so a
 * test can assert what the USER sees after signing in rather than poking at
 * context internals. Supabase is the in-memory fake from src/test/setup.ts.
 */
function renderLogin() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={['/login']}>
          <NavBar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/habits" element={<h1>Habits</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('renders the email and password fields by their labels', () => {
    renderLogin()

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows a validation error when the email is not an email', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.')
  })

  it('shows a validation error when the password is too short', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password must be at least 6 characters.',
    )
  })

  it('shows the error Supabase returns for a wrong password, and stays signed out', async () => {
    addTestAccount('teddy@gmail.com', 'secret123')
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('signs the user in, greets them by email, and lands on the tracker', async () => {
    addTestAccount('teddy@gmail.com', 'secret123')
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Hi, teddy@gmail.com')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Habits' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
