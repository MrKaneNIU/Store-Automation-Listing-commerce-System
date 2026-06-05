import { describe, expect, it, vi } from 'vitest'

import type { CustomerMineView } from '../../../features/customer-mine/customer-mine'
import { useCustomerMinePageState } from './useCustomerMinePageState'

const createView = (name: string): CustomerMineView => ({
  customerId: 'customer-1',
  identityLabel: 'Signed in',
  identityDisplayName: name,
  identityOpenidLabel: 'cust...enid',
  phoneLabel: 'Phone bound',
  phoneDisplayText: '138****0000',
  avatarUrl: 'cloud://avatars/customer-1.png',
  hasAvatar: true,
  avatarPlaceholderText: '',
  recentOrders: [],
  recentOrderTotalCount: 0,
  recentOrdersEmptyMessage: 'No recent orders',
  utilities: [
    {
      key: 'favorites',
      label: 'Favorites',
      route: '/pages/customer/favorites/index',
      count: 2,
      countLabel: '2',
      isEnabled: true,
    },
    {
      key: 'shoppingBag',
      label: 'Shopping bag',
      route: '/pages/customer/shopping-bag/index',
      count: 3,
      countLabel: '3',
      isEnabled: true,
    },
  ],
  emptyMessage: '',
  loadingState: 'idle',
  failureMessage: '',
  lastUpdatedAt: '2026-05-31T00:00:00.000Z',
})

describe('customer mine page state adapter', () => {
  it('uses the injected page-facing facade for the first screen load', async () => {
    const loadView = vi.fn(async () => createView('loaded'))
    const state = useCustomerMinePageState({ loadView })

    await state.loadSnapshot({ showLoading: true })

    expect(loadView).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.identityDisplayName).toBe('loaded')
  })

  it('exposes loading, failure, retry, and request dedupe through the page state', async () => {
    let rejectLoad: (error: Error) => void = () => {}
    const loadView = vi
      .fn()
      .mockImplementationOnce(() => new Promise<CustomerMineView>((_, reject) => {
        rejectLoad = reject
      }))
      .mockResolvedValueOnce(createView('retried'))
    const state = useCustomerMinePageState({ loadView })

    const firstLoad = state.loadSnapshot({ showLoading: true })
    const dedupedLoad = state.loadSnapshot({ showLoading: true })

    expect(state.viewModel.value.loadingState).toBe('loading')
    expect(loadView).toHaveBeenCalledTimes(1)

    rejectLoad(new Error('mine unavailable'))
    await Promise.all([firstLoad, dedupedLoad])

    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.viewModel.value.failureMessage).toBe('mine unavailable')

    await state.retry()

    expect(loadView).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.identityDisplayName).toBe('retried')
  })
})
