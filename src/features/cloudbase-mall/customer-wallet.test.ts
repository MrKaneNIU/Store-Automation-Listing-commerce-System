import { describe, expect, it, vi } from 'vitest'

import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getCloudBaseCustomerWalletView } from './customer-wallet'

describe('cloudbase customer wallet facade', () => {
  it('loads wallet snapshot through the CloudBase mall client', async () => {
    const getCustomerWalletSnapshot = vi.fn(async () => ({
      customerId: 'customer-1',
      balance: 18,
      ledger: [],
      serverTime: '2026-06-11T10:00:00.000Z',
    }))
    const client = { getCustomerWalletSnapshot } as Partial<CloudBaseMallApiClient> as CloudBaseMallApiClient

    const view = await getCloudBaseCustomerWalletView(client)

    expect(getCustomerWalletSnapshot).toHaveBeenCalledTimes(1)
    expect(view.balanceText).toBe('¥ 18.00')
    expect(view.emptyMessage).toBe('暂无钱包流水')
  })

  it('returns a failure view when wallet action is unavailable', async () => {
    const view = await getCloudBaseCustomerWalletView({} as CloudBaseMallApiClient)

    expect(view.loadingState).toBe('failed')
    expect(view.failureMessage).toContain('Customer wallet action is unavailable')
  })
})
