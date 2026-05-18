import { describe, expect, it } from 'vitest'

import { createCloudBaseMallApiClient } from './mall-api-client'

describe('CloudBase mall API client', () => {
  it('keeps mallApi cloud function calls behind a service adapter', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { batch: null, drafts: [] } as never
      },
    })

    await expect(client.getLatestDrafts()).resolves.toEqual({ batch: null, drafts: [] })
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getLatestDrafts',
        },
      },
    ])
  })

  it('passes params and payload without exposing wx.cloud to pages', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { draft: { id: 'draft-1' } } as never
      },
    })

    await client.updateDraft('draft-1', { productName: 'Oxford Shirt' })
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'updateDraft',
          params: { draftId: 'draft-1' },
          payload: { productName: 'Oxford Shirt' },
        },
      },
    ])
  })

  it('exposes Phase 4 auth actions through the mallApi adapter', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { customer: { id: 'customer-1' } } as never
      },
    })

    await client.getCurrentCustomer()
    await client.bindCustomerPhone({ phoneCode: 'phone-code-ok' })
    await client.bindStaff({ openid: 'staff-openid', reason: 'new staff' })

    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getCurrentCustomer',
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'bindCustomerPhone',
          payload: { phoneCode: 'phone-code-ok' },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'bindStaff',
          payload: { openid: 'staff-openid', reason: 'new staff' },
        },
      },
    ])
  })

  it('maps published product summaries to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { products: [] } as never
      },
    })

    await client.listPublishedProductSummaries()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'listPublishedProductSummaries',
        },
      },
    ])
  })
})
