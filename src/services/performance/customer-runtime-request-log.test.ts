import { describe, expect, it } from 'vitest'

import { logCustomerRuntimeRequest, type CustomerRuntimeRequestLogEntry } from './customer-runtime-request-log'

describe('customer runtime request log', () => {
  it('records action, lifecycle source, duration, status, and dedupe state', () => {
    const entries: CustomerRuntimeRequestLogEntry[] = []

    const entry = logCustomerRuntimeRequest({
      action: 'getCustomerMineSnapshot',
      source: 'onShow',
      startedAt: 100,
      endedAt: 145,
      status: 'success',
      deduped: false,
      logger: (value) => entries.push(value),
    })

    expect(entry).toEqual({
      action: 'getCustomerMineSnapshot',
      source: 'onShow',
      startedAt: 100,
      endedAt: 145,
      durationMs: 45,
      status: 'success',
      deduped: false,
    })
    expect(entries).toEqual([entry])
  })

  it('is a safe no-op when no logger is injected', () => {
    const entry = logCustomerRuntimeRequest({
      action: 'getCustomerShoppingBagSnapshot',
      source: 'retry',
      startedAt: 200,
      endedAt: 180,
      status: 'failed',
      deduped: true,
    })

    expect(entry).toEqual({
      action: 'getCustomerShoppingBagSnapshot',
      source: 'retry',
      startedAt: 200,
      endedAt: 180,
      durationMs: 0,
      status: 'failed',
      deduped: true,
    })
  })
})
