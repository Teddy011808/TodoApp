import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import UsersPage from './UsersPage'
import type { User } from '../types'

const LEANNE = {
  id: 1,
  name: 'Leanne Graham',
  username: 'Bret',
  email: 'Sincere@april.biz',
  phone: '1-770-736-8031',
  website: 'hildegard.org',
  company: { name: 'Romaguera-Crona', catchPhrase: 'Multi-layered client-server neural-net' },
  address: { suite: 'Apt. 556', street: 'Kulas Light', city: 'Gwenborough', zipcode: '92998-3874' },
} satisfies User

function mockFetchOnce(users: User[], ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => users,
  })
}

function renderDirectory() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetchOnce([LEANNE]))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UsersPage — async data', () => {
  it('shows the loading skeleton first, then the fetched user', async () => {
    renderDirectory()

    // the skeleton is announced to assistive tech while the request is open
    expect(screen.getByLabelText('Loading users')).toBeInTheDocument()

    // findBy waits for the row to arrive — no arbitrary sleep
    expect(await screen.findByText('Leanne Graham')).toBeInTheDocument()

    // and once the data is in, the skeleton is gone
    expect(screen.queryByLabelText('Loading users')).toBeNull()
  })

  it('renders the empty state when the search matches nobody', async () => {
    vi.stubGlobal('fetch', mockFetchOnce([]))
    renderDirectory()

    expect(await screen.findByText(/No users match/)).toBeInTheDocument()
    expect(screen.queryByText('Leanne Graham')).toBeNull()
  })

  it('renders an error message when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    )
    renderDirectory()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the directory.')
  })

  it('shows the raw value immediately but holds the debounced value back', async () => {
    const user = userEvent.setup()
    renderDirectory()
    await screen.findByText('Leanne Graham')

    await user.type(screen.getByLabelText('Search users by name'), 'Leanne')

    // the raw cell has the typed text straight away
    expect(screen.getByLabelText('Raw search value')).toHaveTextContent('Leanne')

    // while the debounced value is still settling, the hint is visible
    expect(screen.getByText('settling…')).toBeInTheDocument()

    // ...and it catches up on its own once typing stops
    await waitFor(() =>
      expect(screen.getByLabelText('Debounced search value')).toHaveTextContent('Leanne'),
    )
    expect(screen.queryByText('settling…')).toBeNull()
  })
})
