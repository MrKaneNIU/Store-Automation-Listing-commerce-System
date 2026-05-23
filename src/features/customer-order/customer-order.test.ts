import { describe, expect, it, vi } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import { submitCustomerWechatOrder } from './customer-order'

const prepareConfirmableDrafts = (batchId: string) => {
  mallRepository.replaceDrafts(
    batchId,
    mallRepository.listDrafts(batchId).map((draft) => {
      if (draft.status === 'needs_completion') {
        return { ...draft, status: 'deleted' as const }
      }

      if (draft.confidence < 0.8) {
        return { ...draft, correctionState: 'accepted' as const }
      }

      return { ...draft, status: 'confirmed' as const }
    }),
  )
}

const preparePublishedProduct = async () => {
  resetMockDb()
  mockWechatAuthService.logout()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' }])
  prepareConfirmableDrafts(batch.id)
  const result = mallWorkflow.confirmBatch(batch.id)
  const ready = await mallWorkflow.supplementProductImages(result.products[0])
  const published = mallWorkflow.publishProduct(ready)
  const sku = mallRepository.listSkus(published.id)[0]

  return { product: published, sku }
}

describe('submitCustomerWechatOrder', () => {
  it('logs in, authorizes phone number, and creates an order from the authorized session', async () => {
    const { product, sku } = await preparePublishedProduct()
    const confirmLogin = vi.fn().mockResolvedValue(true)
    const confirmPhoneAuthorization = vi.fn().mockResolvedValue(true)

    const order = await submitCustomerWechatOrder({
      product,
      skuId: sku.id,
      quantity: 1,
      authService: mockWechatAuthService,
      confirmLogin,
      confirmPhoneAuthorization,
    })

    expect(confirmLogin).toHaveBeenCalledTimes(1)
    expect(confirmPhoneAuthorization).toHaveBeenCalledTimes(1)
    expect(order).toMatchObject({
      customerName: '微信用户',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      status: 'pending_merchant_confirm',
    })
    expect(mallRepository.listSkus(product.id)[0].stock).toBe(sku.stock - 1)
  })

  it('does not prompt again when the current session already has a phone number', async () => {
    const { product, sku } = await preparePublishedProduct()
    const confirmLogin = vi.fn().mockResolvedValue(true)
    const confirmPhoneAuthorization = vi.fn().mockResolvedValue(true)
    await mockWechatAuthService.login()
    await mockWechatAuthService.authorizePhoneNumber()

    const order = await submitCustomerWechatOrder({
      product,
      skuId: sku.id,
      quantity: 1,
      authService: mockWechatAuthService,
      confirmLogin,
      confirmPhoneAuthorization,
    })

    expect(confirmLogin).not.toHaveBeenCalled()
    expect(confirmPhoneAuthorization).not.toHaveBeenCalled()
    expect(order?.customerPhone).toBe('13800000000')
  })

  it('does not create an order or reserve stock when phone authorization is canceled', async () => {
    const { product, sku } = await preparePublishedProduct()
    const confirmLogin = vi.fn().mockResolvedValue(true)
    const confirmPhoneAuthorization = vi.fn().mockResolvedValue(false)

    const order = await submitCustomerWechatOrder({
      product,
      skuId: sku.id,
      quantity: 1,
      authService: mockWechatAuthService,
      confirmLogin,
      confirmPhoneAuthorization,
    })

    expect(order).toBeNull()
    expect(mallRepository.listOrders()).toHaveLength(0)
    expect(mallRepository.listSkus(product.id)[0].stock).toBe(sku.stock)
  })
})
