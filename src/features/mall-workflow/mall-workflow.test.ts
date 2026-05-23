import { describe, expect, it } from 'vitest'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mallWorkflow } from './mall-workflow'

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

      return draft
    }),
  )
}

const prepareConfirmedBatch = async () => {
  const { batch } = await mallWorkflow.createMockImportBatch([
    { id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' },
  ])

  prepareConfirmableDrafts(batch.id)

  const result = mallWorkflow.confirmBatch(batch.id)
  const ready = await mallWorkflow.supplementProductImages(result.products[0])
  const published = mallWorkflow.publishProduct(ready)
  const sku = mallRepository.listSkus(published.id)[0]

  return { batch, result, ready, published, sku }
}

describe('mallWorkflow.confirmBatch', () => {
  it('blocks incomplete drafts and does not create products', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' },
      { id: 'image-2', url: '/tmp/spec-1.png', name: 'Spec page' },
    ])

    const result = mallWorkflow.confirmBatch(batch.id)

    expect(result.issues.length).toBeGreaterThan(0)
    expect(mallRepository.listProducts()).toHaveLength(0)
  })

  it('creates products and SKUs after incomplete drafts are deleted', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' },
    ])
    prepareConfirmableDrafts(batch.id)

    const result = mallWorkflow.confirmBatch(batch.id)

    expect(result.issues).toHaveLength(0)
    expect(result.products).toHaveLength(2)
    expect(result.skus).toHaveLength(3)
    expect(mallRepository.listProducts()).toHaveLength(2)
    expect(mallRepository.listSkus()).toHaveLength(3)
  })

  it('does not create duplicate products or SKUs when confirming the same batch twice', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([
      { id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' },
    ])
    prepareConfirmableDrafts(batch.id)

    mallWorkflow.confirmBatch(batch.id)
    mallWorkflow.confirmBatch(batch.id)

    expect(mallRepository.listProducts()).toHaveLength(2)
    expect(mallRepository.listSkus()).toHaveLength(3)
  })

  it('moves a batch from recognized to confirmed after successful confirmation', async () => {
    resetMockDb()
    const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' }])
    expect(mallRepository.listBatches()[0]).toMatchObject({ id: batch.id, status: 'recognized' })
    prepareConfirmableDrafts(batch.id)

    mallWorkflow.confirmBatch(batch.id)

    expect(mallRepository.listBatches()[0]).toMatchObject({ id: batch.id, status: 'confirmed' })
  })
})

describe('mallWorkflow image supplement and publishing', () => {
  it('moves a pending image product to ready to publish after supplementing images', async () => {
    resetMockDb()
    const { result } = await prepareConfirmedBatch()

    const supplemented = await mallWorkflow.supplementProductImages(result.products[0])

    expect(supplemented.mainImageUrl).toBeTruthy()
    expect(supplemented.status).toBe('ready_to_publish')
  })

  it('publishes only products that are ready to publish', async () => {
    resetMockDb()
    const { result } = await prepareConfirmedBatch()
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
    const { published, sku } = await prepareConfirmedBatch()

    const order = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
    })
    const confirmed = mallWorkflow.confirmOrder(order.id)

    expect(order.status).toBe('pending_merchant_confirm')
    expect(confirmed.status).toBe('confirmed')

    const secondOrder = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer 2',
      customerPhone: '13900000000',
      quantity: 1,
    })
    expect(mallWorkflow.cancelOrder(secondOrder.id).status).toBe('canceled')
  })

  it('reserves SKU stock when creating an order and blocks overselling', async () => {
    resetMockDb()
    const { published, sku } = await prepareConfirmedBatch()

    mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: sku.stock,
    })

    expect(mallRepository.listSkus(published.id)[0].stock).toBe(0)
    expect(() =>
      mallWorkflow.createOrder(published, sku.id, {
        customerName: 'Customer 2',
        customerPhone: '13900000000',
        quantity: 1,
      }),
    ).toThrow()
  })

  it('restores reserved SKU stock when canceling a pending order', async () => {
    resetMockDb()
    const { published, sku } = await prepareConfirmedBatch()

    const order = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
    })

    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock - 1)
    expect(mallWorkflow.cancelOrder(order.id).status).toBe('canceled')
    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock)
  })

  it('allows confirming or canceling only pending orders', async () => {
    resetMockDb()
    const { published, sku } = await prepareConfirmedBatch()

    const confirmedOrder = mallWorkflow.confirmOrder(
      mallWorkflow.createOrder(published, sku.id, {
        customerName: 'Customer',
        customerPhone: '13800000000',
        quantity: 1,
      }).id,
    )

    expect(() => mallWorkflow.cancelOrder(confirmedOrder.id)).toThrow()
  })

  it('does not allow confirming a canceled order', async () => {
    resetMockDb()
    const { published, sku } = await prepareConfirmedBatch()
    const canceledOrder = mallWorkflow.cancelOrder(
      mallWorkflow.createOrder(published, sku.id, {
        customerName: 'Customer',
        customerPhone: '13800000000',
        quantity: 1,
      }).id,
    )

    expect(() => mallWorkflow.confirmOrder(canceledOrder.id)).toThrow()
  })

  it('creates orders with authorized WeChat customer fields and reserves stock', async () => {
    resetMockDb()
    mockWechatAuthService.logout()
    const { published, sku } = await prepareConfirmedBatch()
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
    const { published, sku } = await prepareConfirmedBatch()
    const session = await mockWechatAuthService.login()

    expect(() =>
      mallWorkflow.createAuthorizedOrder(published, sku.id, {
        session,
        quantity: 1,
      }),
    ).toThrow()
    expect(mallRepository.listOrders()).toHaveLength(0)
    expect(mallRepository.listSkus(published.id)[0].stock).toBe(sku.stock)
  })
})
