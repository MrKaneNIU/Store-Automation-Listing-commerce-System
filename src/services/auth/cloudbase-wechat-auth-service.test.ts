import { describe, expect, it, vi } from 'vitest'

import type { CloudBaseMallApiClient } from '../cloudbase/mall-api-client'
import { createCloudBaseWechatAuthService } from './cloudbase-wechat-auth-service'

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient => {
  const missing = vi.fn(async () => {
    throw new Error('unexpected mallApi call')
  })

  return {
    getCurrentCustomer: missing,
    bindCustomerPhone: missing,
    bindStaff: missing,
    createOcrBatch: missing,
    listOcrJobs: missing,
    processOcrJob: missing,
    retryOcrJob: missing,
    listOcrBatches: missing,
    getCurrentOcrBatch: missing,
    getLatestDrafts: missing,
    getLatestDraftReviewSnapshot: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listOwnerProductCards: missing,
    listPublishedProducts: missing,
    listPublishedProductSummaries: missing,
    getPublishedProductDetail: missing,
    updateProductDescription: missing,
    updateSku: missing,
    restockSkus: missing,
    clearSkuStock: missing,
    publishProduct: missing,
    unpublishProduct: missing,
    deleteProduct: missing,
    listSkus: missing,
    listPendingImageTasks: missing,
    getStaffImageTaskSnapshot: missing,
    supplementProductImages: missing,
    createCustomerOrder: missing,
    getCustomerOrder: missing,
    getOwnerOrderSnapshot: missing,
    getOwnerDashboardSnapshot: missing,
    listMerchantOrders: missing,
    confirmMerchantOrder: missing,
    cancelMerchantOrder: missing,
    ...overrides,
  }
}

const customer = {
  id: 'customer-1',
  openid: 'openid-1',
  appid: 'wxa63c53796488d4d4',
  authSource: 'wechat' as const,
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
}

describe('CloudBase WeChat auth service', () => {
  it('loads the current customer through mallApi without page-level wx.cloud access', async () => {
    const client = createClient({
      getCurrentCustomer: vi.fn(async () => ({ customer })),
    })
    const service = createCloudBaseWechatAuthService(client)

    await expect(service.login()).resolves.toMatchObject({
      customerId: 'customer-1',
      openid: 'openid-1',
      authSource: 'wechat',
    })
    expect(client.getCurrentCustomer).toHaveBeenCalledTimes(1)
  })

  it('does not bind phone when authorization returns no phone number', async () => {
    const client = createClient({
      getCurrentCustomer: vi.fn(async () => ({ customer })),
      bindCustomerPhone: vi.fn(async () => ({ customer: { ...customer, phoneNumber: '13800000000' } })),
    })
    const service = createCloudBaseWechatAuthService(client)

    await service.login()
    await expect(service.authorizePhoneNumber()).resolves.toBeNull()
    expect(client.bindCustomerPhone).not.toHaveBeenCalled()
  })

  it('binds phone through mallApi after login with a WeChat phone code', async () => {
    const bindCustomerPhone = vi.fn(async () => ({
      customer: {
        ...customer,
        phoneNumber: '13800000000',
        updatedAt: '2026-05-11T00:01:00.000Z',
      },
    }))
    const service = createCloudBaseWechatAuthService(createClient({
      getCurrentCustomer: vi.fn(async () => ({ customer })),
      bindCustomerPhone,
    }))

    await service.login()
    await expect(service.authorizePhoneNumber('phone-code-ok')).resolves.toMatchObject({
      customerId: 'customer-1',
      phoneNumber: '13800000000',
      authSource: 'wechat',
    })
    expect(bindCustomerPhone).toHaveBeenCalledWith({ phoneCode: 'phone-code-ok' })
  })
})
