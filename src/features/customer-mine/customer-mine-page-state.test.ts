import { describe, expect, it, vi } from 'vitest'

import { createCustomerMineFailureView, createCustomerMineLoadingView, type CustomerMineView } from './customer-mine'
import { createCustomerMinePageState } from './customer-mine-page-state'
import type { CustomerRuntimeRequestLogEntry } from '../../services/performance/customer-runtime-request-log'

const createView = (label: string): CustomerMineView => ({
  customerId: 'customer-1',
  identityLabel: '已登录',
  identityDisplayName: label,
  identityOpenidLabel: 'cust...enid',
  phoneLabel: '未绑定手机',
  phoneDisplayText: '未绑定',
  recentOrders: [],
  recentOrderTotalCount: 0,
  recentOrdersEmptyMessage: 'No recent orders',
  utilities: [
    {
      key: 'favorites',
      label: '收藏',
      route: '/pages/customer/favorites/index',
      count: 0,
      countLabel: '0',
      isEnabled: true,
    },
    {
      key: 'shoppingBag',
      label: '购物袋',
      route: '/pages/customer/shopping-bag/index',
      count: 0,
      countLabel: '0',
      isEnabled: true,
    },
  ],
  emptyMessage: '',
  loadingState: 'idle',
  failureMessage: '',
  lastUpdatedAt: '2026-05-31T00:00:00.000Z',
})

describe('customer mine page state', () => {
  it('creates a loading state before the first snapshot resolves', async () => {
    let resolveLoad: (view: CustomerMineView) => void = () => {}
    const state = createCustomerMinePageState({
      loadView: () => new Promise<CustomerMineView>((resolve) => {
        resolveLoad = resolve
      }),
    })

    const load = state.loadSnapshot({ showLoading: true })
    expect(state.viewModel.value).toEqual(createCustomerMineLoadingView())

    resolveLoad(createView('loaded'))
    await load

    expect(state.viewModel.value.identityDisplayName).toBe('loaded')
  })

  it('maps failure state and keeps previous usable view during retry failure', async () => {
    const previous = createView('cached')
    const state = createCustomerMinePageState({
      loadView: vi
        .fn()
        .mockResolvedValueOnce(previous)
        .mockRejectedValueOnce(new Error('network timeout')),
    })

    await state.loadSnapshot({ showLoading: true })
    await state.retry()

    expect(state.viewModel.value).toEqual(createCustomerMineFailureView(new Error('network timeout'), previous))
  })

  it('deduplicates concurrent snapshot loads', async () => {
    const loader = vi.fn(async () => createView('deduped'))
    const logs: CustomerRuntimeRequestLogEntry[] = []
    const state = createCustomerMinePageState({
      loadView: loader,
      requestLogger: (entry) => logs.push(entry),
    })

    await Promise.all([
      state.loadSnapshot({ showLoading: true }),
      state.loadSnapshot({ showLoading: true }),
    ])

    expect(loader).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.identityDisplayName).toBe('deduped')
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'getCustomerMineSnapshot',
        source: 'onShow',
        status: 'success',
        deduped: true,
      }),
      expect.objectContaining({
        action: 'getCustomerMineSnapshot',
        source: 'onShow',
        status: 'success',
        deduped: false,
      }),
    ]))
  })

  it('skips quick tab-return reloads while the mine snapshot is still fresh', async () => {
    let currentTime = 1000
    const loader = vi.fn(async () => createView('cached'))
    const state = createCustomerMinePageState({
      loadView: loader,
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.loadSnapshot({ showLoading: true })
    currentTime += 500
    await state.loadSnapshot()

    expect(loader).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.identityDisplayName).toBe('cached')
  })

  it('refreshes by reusing the load path for retry behavior', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce(createView('first'))
      .mockResolvedValueOnce(createView('retried'))
    const state = createCustomerMinePageState({ loadView: loader })

    await state.loadSnapshot({ showLoading: true })
    await state.retry()

    expect(loader).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.identityDisplayName).toBe('retried')
  })
})
