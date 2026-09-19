import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import NavBar from '../components/NavBar'
import SignInPage from './SignInPage'

/**
 * Renders the sign-in form under the providers it needs, plus the NavBar, so a
 * test can assert what the USER sees after signing in rather than poking at
 * context internals.
 */
function renderSignIn() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={['/signin']}>
          <NavBar />
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/shop" element={<h1>Shop</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  )
}

describe('SignInPage', () => {
  it('renders the email and password fields by their labels', () => {
    // arrange
    renderSignIn()

    // assert — found the way a user finds them: by label text
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows a validation error when the email is not an email', async () => {
    // arrange
    const user = userEvent.setup()
    renderSignIn()

    // act
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.')
  })

  it('shows a validation error when the password is too short', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password must be at least 6 characters.',
    )
  })

  it('rejects an empty submit without signing the user in', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    // still signed out: the nav bar keeps offering "Sign in"
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('signs the user in and greets them by email', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // behaviour, not implementation: the greeting is what the user actually sees
    expect(await screen.findByText('Hi, teddy@gmail.com')).toBeInTheDocument()
  })

  it('removes the validation error once the input is corrected — queryBy returns null', async () => {
    const user = userEvent.setup()
    renderSignIn()

    // act 1 — provoke the error
    await user.type(screen.getByLabelText('Email'), 'nope')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    // act 2 — fix it and submit again
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'teddy@gmail.com')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // assert absence: the alert is gone, not merely hidden
    expect(await screen.findByText('Hi, teddy@gmail.com')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('survives rapid typing and submits the final value', async () => {
    const user = userEvent.setup()
    renderSignIn()

    const email = screen.getByLabelText('Email')
    await user.type(email, 'a@b.co')
    await user.clear(email)
    await user.type(email, 'teddy@gmail.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Hi, teddy@gmail.com')).toBeInTheDocument()
  })
})
