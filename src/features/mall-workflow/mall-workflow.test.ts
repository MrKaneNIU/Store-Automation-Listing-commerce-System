import { describe, expect, it } from 'vitest'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import { mallWorkflow } from './mall-workflow'

describe('mallWorkflow.confirmBatch', () => {
  it('blocks incomplete drafts and does not create products', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: '商品页' },
      { id: 'image-2', url: '/tmp/spec-1.png', name: '规格页' },
    ])

    const result = mallWorkflow.confirmBatch(batch.id)

    expect(result.issues.length).toBeGreaterThan(0)
    expect(mallRepository.listProducts()).toHaveLength(0)
  })

  it('creates products and SKUs after incomplete drafts are deleted', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: '商品页' },
    ])
    const drafts = mallRepository
      .listDrafts(batch.id)
      .map((draft) => (draft.status === 'needs_completion' ? { ...draft, status: 'deleted' as const } : draft))
    mallRepository.replaceDrafts(batch.id, drafts)

    const result = mallWorkflow.confirmBatch(batch.id)

    expect(result.issues).toHaveLength(0)
    expect(result.products).toHaveLength(2)
    expect(result.skus).toHaveLength(4)
    expect(mallRepository.listProducts()).toHaveLength(2)
    expect(mallRepository.listSkus()).toHaveLength(4)
  })

  it('does not create duplicate products or SKUs when confirming the same batch twice', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: '商品页' },
    ])
    const drafts = mallRepository
      .listDrafts(batch.id)
      .map((draft) => (draft.status === 'needs_completion' ? { ...draft, status: 'deleted' as const } : draft))
    mallRepository.replaceDrafts(batch.id, drafts)

    mallWorkflow.confirmBatch(batch.id)
    mallWorkflow.confirmBatch(batch.id)

    expect(mallRepository.listProducts()).toHaveLength(2)
    expect(mallRepository.listSkus()).toHaveLength(4)
  })

  it('moves a batch from recognized to confirmed after successful confirmation', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    expect(mallRepository.listBatches()[0]).toMatchObject({ id: batch.id, status: 'recognized' })
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )

    mallWorkflow.confirmBatch(batch.id)

    expect(mallRepository.listBatches()[0]).toMatchObject({ id: batch.id, status: 'confirmed' })
  })
})

describe('mallWorkflow image supplement and publishing', () => {
  it('moves a pending image product to ready to publish after supplementing images', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: '商品页' },
    ])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)

    const supplemented = await mallWorkflow.supplementProductImages(result.products[0])

    expect(supplemented.mainImageUrl).toBeTruthy()
    expect(supplemented.status).toBe('ready_to_publish')
  })

  it('publishes only products that are ready to publish', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: '商品页' },
    ])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const notReady = mallWorkflow.publishProduct(result.products[0])

    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)

    expect(notReady.status).toBe('pending_images')
    expect(published.status).toBe('published')
  })
})

describe('mallWorkflow orders', () => {
  it('creates pending orders only for published products and confirms or cancels them', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]

    const order = mallWorkflow.createOrder(published, sku.id, {
      customerName: '测试客户',
      customerPhone: '13800000000',
      quantity: 1,
    })
    const confirmed = mallWorkflow.confirmOrder(order.id)

    expect(order.status).toBe('pending_merchant_confirm')
    expect(confirmed.status).toBe('confirmed')

    const secondOrder = mallWorkflow.createOrder(published, sku.id, {
      customerName: '测试客户 2',
      customerPhone: '13900000000',
      quantity: 1,
    })
    expect(mallWorkflow.cancelOrder(secondOrder.id).status).toBe('canceled')
  })

  it('reserves SKU stock when creating an order and blocks overselling', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]

    mallWorkflow.createOrder(published, sku.id, {
      customerName: '测试客户',
      customerPhone: '13800000000',
      quantity: sku.stock,
    })

    expect(mallRepository.listSkus(published.id)[0].stock).toBe(0)
    expect(() =>
      mallWorkflow.createOrder(published, sku.id, {
        customerName: '测试客户 2',
        customerPhone: '13900000000',
        quantity: 1,
      }),
    ).toThrow('鍟嗗搧鏈笂鏋舵垨搴撳瓨涓嶈冻')
  })

  it('restores reserved SKU stock when canceling a pending order', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]

    const order = mallWorkflow.createOrder(published, sku.id, {
      customerName: '测试客户',
      customerPhone: '13800000000',
      quantity: 1,
    })

    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock - 1)
    expect(mallWorkflow.cancelOrder(order.id).status).toBe('canceled')
    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock)
  })

  it('allows confirming or canceling only pending orders', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]

    const confirmedOrder = mallWorkflow.confirmOrder(
      mallWorkflow.createOrder(published, sku.id, {
        customerName: '测试客户',
        customerPhone: '13800000000',
        quantity: 1,
      }).id,
    )

    expect(() => mallWorkflow.cancelOrder(confirmedOrder.id)).toThrow('鍙湁寰呭晢瀹剁‘璁よ鍗曞彲浠ュ彇娑?')
  })

  it('does not allow confirming a canceled order', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]
    const canceledOrder = mallWorkflow.cancelOrder(
      mallWorkflow.createOrder(published, sku.id, {
        customerName: '测试客户',
        customerPhone: '13800000000',
        quantity: 1,
      }).id,
    )

    expect(() => mallWorkflow.confirmOrder(canceledOrder.id)).toThrow('鍙湁寰呭晢瀹剁‘璁よ鍗曞彲浠ョ‘璁?')
  })

  it('creates orders with authorized WeChat customer fields and reserves stock', async () => {
    resetMockDb()
    mockWechatAuthService.logout()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]
    await mockWechatAuthService.login()
    const session = await mockWechatAuthService.authorizePhoneNumber()

    const order = mallWorkflow.createAuthorizedOrder(published, sku.id, {
      session,
      quantity: 1,
    })

    expect(order).toMatchObject({
      customerName: '微信用户',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      status: 'pending_merchant_confirm',
    })
    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock - 1)
  })

  it('does not create orders or reserve stock when phone authorization is missing', async () => {
    resetMockDb()
    mockWechatAuthService.logout()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
    mallRepository.replaceDrafts(
      batch.id,
      mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
    )
    const result = mallWorkflow.confirmBatch(batch.id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = mallWorkflow.publishProduct(ready)
    const sku = mallRepository.listSkus(published.id)[0]
    const session = await mockWechatAuthService.login()

    expect(() =>
      mallWorkflow.createAuthorizedOrder(published, sku.id, {
        session,
        quantity: 1,
      }),
    ).toThrow('璇峰厛瀹屾垚寰俊鎵嬫満鍙锋巿鏉?')
    expect(mallRepository.listOrders()).toHaveLength(0)
    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock)
  })
})
