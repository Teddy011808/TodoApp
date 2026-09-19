import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import ShopPage from './ShopPage'
import CheckoutPage from './CheckoutPage'

/** Shop and checkout share one CartProvider, exactly as they do in the app. */
function renderShopAndCheckout() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={['/shop']}>
          <Routes>
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  )
}

async function addHubAndGoToCheckout(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add USB-C Hub to cart' }))
  await user.click(screen.getByRole('link', { name: 'Go to checkout →' }))
}

describe('CheckoutPage — the cart line disappears at quantity 0', () => {
  it('drops the line when the quantity is stepped down to zero', async () => {
    const user = userEvent.setup()
    renderShopAndCheckout()

    await addHubAndGoToCheckout(user)

    // arrange: the line is on screen at quantity 1
    expect(await screen.findByText('USB-C Hub')).toBeInTheDocument()
    expect(screen.getByLabelText('USB-C Hub quantity')).toHaveTextContent('1')

    // act: step it down to 0
    await user.click(screen.getByRole('button', { name: 'Decrease USB-C Hub' }))

    // assert absence — the line is gone from the document, not merely hidden
    expect(screen.queryByText('USB-C Hub')).toBeNull()
    expect(screen.queryByLabelText('USB-C Hub quantity')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrease USB-C Hub' })).toBeNull()

    // and the user is told the cart is empty
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
  })

  it('removes the line outright via the remove button', async () => {
    const user = userEvent.setup()
    renderShopAndCheckout()

    await addHubAndGoToCheckout(user)
    expect(await screen.findByText('USB-C Hub')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove USB-C Hub' }))

    expect(screen.queryByText('USB-C Hub')).toBeNull()
  })

  it('keeps other lines when one is removed', async () => {
    const user = userEvent.setup()
    renderShopAndCheckout()

    await user.click(screen.getByRole('button', { name: 'Add Mechanical Keyboard to cart' }))
    await user.click(screen.getByRole('button', { name: 'Add USB-C Hub to cart' }))
    await user.click(screen.getByRole('link', { name: 'Go to checkout →' }))

    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Decrease USB-C Hub' }))

    expect(screen.queryByText('USB-C Hub')).toBeNull()
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument()
  })

  it('restores the cart from localStorage on a fresh mount', async () => {
    const user = userEvent.setup()
    const first = renderShopAndCheckout()

    await user.click(screen.getByRole('button', { name: 'Add Mechanical Keyboard to cart' }))
    await user.click(screen.getByRole('link', { name: 'Go to checkout →' }))
    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()

    // simulate a refresh: tear the tree down and build a new one
    first.unmount()
    renderShopAndCheckout()
    await user.click(screen.getByRole('link', { name: 'Go to checkout →' }))

    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()
  })
})
