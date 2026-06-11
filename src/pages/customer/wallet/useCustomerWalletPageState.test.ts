import { describe, expect, it, vi } from 'vitest'

import { createCustomerWalletView } from '../../../features/customer-wallet/customer-wallet'
import { createCustomerWalletPageState } from './useCustomerWalletPageState'

const createView = () =>
  createCustomerWalletView({
    customerId: 'customer-1',
    balance: 32,
    ledger: [],
    serverTime: '2026-06-11T10:00:00.000Z',
  })

describe('customer wallet page state', () => {
  it('deduplicates wallet loads and exposes a readonly view', async () => {
    const loadView = vi.fn(async () => createView())
    const state = createCustomerWalletPageState({ loadView })

    await Promise.all([state.handlePageShow(), state.handlePageShow()])

    expect(loadView).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.balanceText).toBe('¥ 32.00')
    expect(state.message.value).toBe('')
  })

  it('supports retry after load failure', async () => {
    const loadView = vi
      .fn<() => Promise<ReturnType<typeof createView>>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(createView())
    const state = createCustomerWalletPageState({ loadView })

    await state.handlePageShow()
    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.message.value).toContain('offline')

    await state.reload()
    expect(state.viewModel.value.loadingState).toBe('idle')
    expect(state.viewModel.value.balanceText).toBe('¥ 32.00')
  })
})
