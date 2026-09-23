import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../context/AuthContext'
import { queueQueryResult, signInAs } from '../test/fakeSupabase'
import HabitsPage from './HabitsPage'

function renderHabits() {
  signInAs('teddy@gmail.com')
  return render(
    <AuthProvider>
      <HabitsPage />
    </AuthProvider>,
  )
}

describe('HabitsPage', () => {
  it('lists the habits and which are done today', async () => {
    queueQueryResult({
      data: [
        { id: 1, name: 'Read 20 pages', created_at: '', daily_logs: [{ id: 9, log_date: '2026-09-23' }] },
        { id: 2, name: 'Drink 2L of water', created_at: '', daily_logs: [] },
      ],
      error: null,
    })
    renderHabits()

    expect(await screen.findByLabelText('Read 20 pages done today')).toBeChecked()
    expect(screen.getByLabelText('Drink 2L of water done today')).not.toBeChecked()
    expect(screen.getByText('1 of 2 done today')).toBeInTheDocument()
  })

  it('shows an EMPTY list, not an error, for an account with no rows', async () => {
    // What RLS returns to a second account: zero rows and no error.
    queueQueryResult({ data: [], error: null })
    renderHabits()

    expect(await screen.findByText('No habits yet — add your first one above.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the error when the query fails', async () => {
    queueQueryResult({ data: null, error: { message: 'permission denied for table habits' } })
    renderHabits()

    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied for table habits')
  })

  it('adds a habit and clears the input', async () => {
    queueQueryResult({ data: [], error: null })
    queueQueryResult({ data: { id: 3, name: 'Walk 8,000 steps', created_at: '', daily_logs: [] }, error: null })
    const user = userEvent.setup()
    renderHabits()

    await screen.findByText('No habits yet — add your first one above.')
    await user.type(screen.getByLabelText('New habit'), 'Walk 8,000 steps')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByLabelText('Walk 8,000 steps done today')).toBeInTheDocument()
    expect(screen.getByLabelText('New habit')).toHaveValue('')
  })

  it('keeps the typed name when adding fails', async () => {
    queueQueryResult({ data: [], error: null })
    queueQueryResult({ data: null, error: { message: 'new row violates row-level security policy' } })
    const user = userEvent.setup()
    renderHabits()

    await screen.findByText('No habits yet — add your first one above.')
    await user.type(screen.getByLabelText('New habit'), 'Meditate')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('row-level security')
    expect(screen.getByLabelText('New habit')).toHaveValue('Meditate')
  })
})
