import { describe, expect, it, vi } from 'vitest'

import type { CloudBaseMallApiClient, CustomerMineSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  getCloudBaseCustomerMineView,
  loadCustomerMineSnapshot,
  retryCloudBaseCustomerMineSnapshot,
  retryCustomerMineSnapshot,
} from './customer-mine'

const createSnapshot = (): CustomerMineSnapshot => ({
  customerId: 'customer-1',
  identity: {
    isSignedIn: true,
    displayName: 'Wechat Customer',
    authSource: 'wechat',
    openidMasked: 'cust...enid',
  },
  phone: {
    isBound: false,
    maskedPhoneNumber: '',
    statusLabel: 'Phone not bound',
  },
  recentOrders: [],
  recentOrderTotalCount: 0,
  utilities: [
    {
      key: 'favorites',
      label: 'Favorites',
      route: '/pages/customer/favorites/index',
      count: 0,
      isEnabled: true,
    },
    {
      key: 'shoppingBag',
      label: 'Shopping bag',
      route: '/pages/customer/shopping-bag/index',
      count: 0,
      isEnabled: true,
    },
  ],
  serverTime: '2026-05-31T00:00:00.000Z',
})

const createClient = (getCustomerMineSnapshot: CloudBaseMallApiClient['getCustomerMineSnapshot']): CloudBaseMallApiClient =>
  ({
    getCustomerMineSnapshot,
  }) as CloudBaseMallApiClient

describe('CloudBase customer mine facade', () => {
  it('exposes the page-facing loadCustomerMineSnapshot facade', async () => {
    const getCustomerMineSnapshot = vi.fn(async () => createSnapshot())
    const view = await loadCustomerMineSnapshot(createClient(getCustomerMineSnapshot))

    expect(getCustomerMineSnapshot).toHaveBeenCalledTimes(1)
    expect(view.loadingState).toBe('idle')
    expect(view.identityDisplayName).toBe('Wechat Customer')
  })

  it('loads the mine snapshot through the mallApi client', async () => {
    const getCustomerMineSnapshot = vi.fn(async () => createSnapshot())
    const view = await getCloudBaseCustomerMineView(createClient(getCustomerMineSnapshot))

    expect(getCustomerMineSnapshot).toHaveBeenCalledTimes(1)
    expect(view.identityLabel).toBe('已登录')
    expect(view.utilities.map((entry) => entry.key)).toEqual(['favorites', 'shoppingBag'])
  })

  it('maps failures to a failure view', async () => {
    const view = await getCloudBaseCustomerMineView(createClient(async () => {
      throw new Error('mine unavailable')
    }))

    expect(view.loadingState).toBe('failed')
    expect(view.failureMessage).toBe('mine unavailable')
  })

  it('uses the same facade for retry behavior', async () => {
    const getCustomerMineSnapshot = vi.fn(async () => createSnapshot())
    const view = await retryCustomerMineSnapshot(createClient(getCustomerMineSnapshot))

    expect(getCustomerMineSnapshot).toHaveBeenCalledTimes(1)
    expect(view.loadingState).toBe('idle')
  })

  it('keeps the existing CloudBase retry alias on the page-facing retry facade', async () => {
    const getCustomerMineSnapshot = vi.fn(async () => createSnapshot())
    const view = await retryCloudBaseCustomerMineSnapshot(createClient(getCustomerMineSnapshot))

    expect(getCustomerMineSnapshot).toHaveBeenCalledTimes(1)
    expect(view.loadingState).toBe('idle')
  })
})
