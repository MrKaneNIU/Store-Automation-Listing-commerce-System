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

  it('maps published product detail to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { product: null, skus: [], serverTime: '2026-05-27T00:00:00.000Z' } as never
      },
    })

    await client.getPublishedProductDetail('product-1')
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getPublishedProductDetail',
          params: { productId: 'product-1' },
        },
      },
    ])
  })

  it('maps owner product cards to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { products: [], readyProductCount: 0, serverTime: '2026-05-27T00:00:00.000Z' } as never
      },
    })

    await client.listOwnerProductCards()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'listOwnerProductCards',
        },
      },
    ])
  })

  it('maps staff image task snapshots to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { batches: [], products: [], serverTime: '2026-05-27T00:00:00.000Z' } as never
      },
    })

    await client.getStaffImageTaskSnapshot()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getStaffImageTaskSnapshot',
        },
      },
    ])
  })

  it('maps latest draft review snapshots to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { batch: null, drafts: [], serverTime: '2026-05-27T00:00:00.000Z' } as never
      },
    })

    await client.getLatestDraftReviewSnapshot()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getLatestDraftReviewSnapshot',
        },
      },
    ])
  })

  it('maps owner order snapshots to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { orders: [], serverTime: '2026-05-27T00:00:00.000Z' } as never
      },
    })

    await client.getOwnerOrderSnapshot()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getOwnerOrderSnapshot',
        },
      },
    ])
  })

  it('maps owner dashboard snapshots to a single mallApi action', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return {
          pendingDraftCount: 0,
          pendingImageTaskCount: 0,
          pendingOrderCount: 0,
          serverTime: '2026-05-27T00:00:00.000Z',
        } as never
      },
    })

    await client.getOwnerDashboardSnapshot()
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'getOwnerDashboardSnapshot',
        },
      },
    ])
  })

  it('maps product description updates through mallApi', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { product: { id: 'product-1' } } as never
      },
    })

    await client.updateProductDescription('product-1', { description: '进口羊毛混纺，适合通勤叠穿。' })
    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'updateProductDescription',
          params: { productId: 'product-1' },
          payload: { description: '进口羊毛混纺，适合通勤叠穿。' },
        },
      },
    ])
  })

  it('maps SKU inventory operations through mallApi', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { sku: { id: 'sku-1' }, skus: [] } as never
      },
    })

    await client.updateSku('product-1', 'sku-1', {
      spec: 'Black/XL',
      salePrice: 139,
      stock: 5,
      reason: '补货入库',
    })
    await client.restockSkus('product-1', { quantity: 4, reason: '补货入库' })
    await client.clearSkuStock('product-1', { reason: '盘点清零' })

    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'updateSku',
          params: { productId: 'product-1', skuId: 'sku-1' },
          payload: {
            spec: 'Black/XL',
            salePrice: 139,
            stock: 5,
            reason: '补货入库',
          },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'restockSkus',
          params: { productId: 'product-1' },
          payload: { quantity: 4, reason: '补货入库' },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'clearSkuStock',
          params: { productId: 'product-1' },
          payload: { reason: '盘点清零' },
        },
      },
    ])
  })

  it('maps owner product unpublish and delete operations through mallApi', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { product: { id: 'product-1' }, deletedSkuCount: 1 } as never
      },
    })

    await client.unpublishProduct('product-1')
    await client.deleteProduct('product-1')

    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'unpublishProduct',
          params: { productId: 'product-1' },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'deleteProduct',
          params: { productId: 'product-1' },
        },
      },
    ])
  })

  it('maps OCR job list and retry actions through mallApi', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseMallApiClient({
      call: async (name, data) => {
        calls.push({ name, data })
        return { jobs: [], job: { id: 'job-1' }, drafts: [] } as never
      },
    })

    await client.listOcrJobs('batch-1')
    await client.processOcrJob('job-1')
    await client.retryOcrJob('job-1')

    expect(calls).toEqual([
      {
        name: 'mallApi',
        data: {
          action: 'listOcrJobs',
          params: { batchId: 'batch-1' },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'processOcrJob',
          params: { jobId: 'job-1' },
        },
      },
      {
        name: 'mallApi',
        data: {
          action: 'retryOcrJob',
          params: { jobId: 'job-1' },
        },
      },
    ])
  })
})
