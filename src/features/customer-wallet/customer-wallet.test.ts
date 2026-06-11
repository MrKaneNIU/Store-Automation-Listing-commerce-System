import { describe, expect, it } from 'vitest'

import {
  createCustomerWalletFailureView,
  createCustomerWalletLoadingView,
  createCustomerWalletView,
} from './customer-wallet'

describe('customer wallet view model', () => {
  it('formats balance and ledger entries for a read-only wallet page', () => {
    const view = createCustomerWalletView({
      customerId: 'customer-1',
      balance: 128.5,
      ledger: [
        {
          id: 'ledger-1',
          customerId: 'customer-1',
          amount: 20,
          balanceAfter: 128.5,
          direction: 'credit',
          reason: '售后返还',
          createdAt: '2026-06-11T10:00:00.000Z',
        },
        {
          id: 'ledger-2',
          customerId: 'customer-1',
          amount: 8.5,
          balanceAfter: 108.5,
          direction: 'debit',
          reason: '订单抵扣',
          createdAt: '2026-06-10T10:00:00.000Z',
        },
      ],
      serverTime: '2026-06-11T11:00:00.000Z',
    })

    expect(view.balanceText).toBe('¥ 128.50')
    expect(view.emptyMessage).toBe('')
    expect(view.ledger[0]).toMatchObject({
      amountText: '+¥ 20.00',
      balanceAfterText: '余额 ¥ 128.50',
      directionLabel: '收入',
      reasonLabel: '售后返还',
      createdAtLabel: '2026-06-11 10:00',
    })
    expect(view.ledger[1]).toMatchObject({
      amountText: '-¥ 8.50',
      directionLabel: '支出',
      reasonLabel: '订单抵扣',
      createdAtLabel: '2026-06-10 10:00',
    })
  })

  it('keeps empty and failure states explicit', () => {
    const emptyView = createCustomerWalletView({
      customerId: 'customer-1',
      balance: 0,
      ledger: [],
      serverTime: '2026-06-11T11:00:00.000Z',
    })
    const loadingView = createCustomerWalletLoadingView(emptyView)
    const failureView = createCustomerWalletFailureView(new Error('network down'), emptyView)

    expect(emptyView.emptyMessage).toBe('暂无钱包流水')
    expect(loadingView.loadingState).toBe('refreshing')
    expect(failureView.loadingState).toBe('failed')
    expect(failureView.failureMessage).toContain('network down')
  })
})
