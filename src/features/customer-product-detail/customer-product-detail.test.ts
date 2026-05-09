import { describe, expect, it, vi } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import {
  getCustomerProductDetailView,
  selectCustomerProductSku,
  submitCustomerProductDetailOrder,
} from './customer-product-detail'

const prepareProduct = async (options?: { publish?: boolean; stock?: number }) => {
  resetMockDb()
  mockWechatAuthService.logout()

  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
  mallRepository.replaceDrafts(
    batch.id,
    mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const, stock: options?.stock ?? draft.stock })),
  )
  const result = mallWorkflow.confirmBatch(batch.id)
  const ready = await mallWorkflow.supplementProductImages(result.products[0])
  const product = options?.publish === false ? ready : mallWorkflow.publishProduct(ready)
  const sku = mallRepository.listSkus(product.id)[0]

  return { product, sku }
}

describe('customer product detail ViewModel', () => {
  it('returns a browsable empty state when the product does not exist', () => {
    resetMockDb()

    const view = getCustomerProductDetailView('missing-product')

    expect(view.product).toBeNull()
    expect(view.skus).toEqual([])
    expect(view.canSubmitOrder).toBe(false)
    expect(view.emptyMessage).toBe('商品不存在或未上架')
  })

  it('does not expose orderable SKUs for an unpublished product', async () => {
    const { product, sku } = await prepareProduct({ publish: false })

    const view = getCustomerProductDetailView(product.id, sku.id)

    expect(view.product?.id).toBe(product.id)
    expect(view.isPublished).toBe(false)
    expect(view.skus).toEqual([])
    expect(view.canSubmitOrder).toBe(false)
  })

  it('marks out-of-stock SKUs as disabled and rejects selection', async () => {
    const { product, sku } = await prepareProduct({ stock: 0 })

    const view = getCustomerProductDetailView(product.id, sku.id)
    const selection = selectCustomerProductSku(product.id, sku.id)

    expect(view.skus[0]).toMatchObject({ id: sku.id, isDisabled: true, isSelected: true })
    expect(view.canSubmitOrder).toBe(false)
    expect(selection).toEqual({ selectedSkuId: '', message: '该规格暂无库存' })
  })

  it('does not create an order or reserve stock when phone authorization is canceled', async () => {
    const { product, sku } = await prepareProduct()
    const confirmLogin = vi.fn().mockResolvedValue(true)
    const confirmPhoneAuthorization = vi.fn().mockResolvedValue(false)

    const result = await submitCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      confirmLogin,
      confirmPhoneAuthorization,
    })

    expect(result).toMatchObject({ status: 'canceled', order: null, message: '已取消授权，未创建订单' })
    expect(mallRepository.listOrders()).toHaveLength(0)
    expect(mallRepository.listSkus(product.id)[0].stock).toBe(sku.stock)
  })

  it('creates an authorized order and reserves stock when authorization succeeds', async () => {
    const { product, sku } = await prepareProduct()
    const confirmLogin = vi.fn().mockResolvedValue(true)
    const confirmPhoneAuthorization = vi.fn().mockResolvedValue(true)

    const result = await submitCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      confirmLogin,
      confirmPhoneAuthorization,
    })

    expect(result.status).toBe('created')
    expect(confirmLogin).toHaveBeenCalledTimes(1)
    expect(confirmPhoneAuthorization).toHaveBeenCalledTimes(1)
    expect(result.order).toMatchObject({
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      status: 'pending_merchant_confirm',
    })
    expect(mallRepository.listSkus(product.id)[0].stock).toBe(sku.stock - 1)
  })
})
