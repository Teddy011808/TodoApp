import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetPwaStub, stubPwaState, updateServiceWorker } from '../test/pwaRegisterStub'
import UpdateToast from './UpdateToast'

describe('UpdateToast', () => {
  afterEach(() => resetPwaStub())

  it('stays hidden when there is nothing to report', () => {
    const { container } = render(<UpdateToast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('offers "New version available" + Refresh, which activates the waiting worker and reloads', async () => {
    stubPwaState({ needRefresh: true })
    const user = userEvent.setup()
    render(<UpdateToast />)

    expect(screen.getByRole('status')).toHaveTextContent('New version available')
    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(updateServiceWorker.calls).toEqual([true])
  })

  it('"Later" dismisses it without updating', async () => {
    stubPwaState({ needRefresh: true })
    const user = userEvent.setup()
    render(<UpdateToast />)

    await user.click(screen.getByRole('button', { name: 'Later' }))

    expect(screen.queryByRole('status')).toBeNull()
    expect(updateServiceWorker.calls).toEqual([])
  })
})
