import { describe, expect, it } from 'vitest'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mallWorkflow } from './mall-workflow'

const preparePublishedProduct = async () => {
  resetMockDb()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: 'Product page' }])
  mallRepository.replaceDrafts(
    batch.id,
    mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
  )
  const result = mallWorkflow.confirmBatch(batch.id)
  const ready = await mallWorkflow.supplementProductImages(result.products[0])
  const published = mallWorkflow.publishProduct(ready)
  const sku = mallRepository.listSkus(published.id)[0]
  return { published, sku }
}

describe('Phase 5 inventory and order flow', () => {
  it('writes an inventory ledger entry when creating an order', async () => {
    const { published, sku } = await preparePublishedProduct()

    mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
    })

    expect(mallRepository.listInventoryLedgerEntries(sku.id)).toHaveLength(1)
    expect(mallRepository.listInventoryLedgerEntries(sku.id)[0]).toMatchObject({
      skuId: sku.id,
      action: 'reserve',
      quantityDelta: -1,
      sourceType: 'order',
    })
  })

  it('returns the same order for repeated requests with the same idempotency key', async () => {
    const { published, sku } = await preparePublishedProduct()

    const first = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
      idempotencyKey: 'checkout-1',
    })
    const second = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
      idempotencyKey: 'checkout-1',
    })

    expect(second).toEqual(first)
    expect(mallRepository.listOrders()).toHaveLength(1)
    expect(mallRepository.listInventoryLedgerEntries(sku.id)).toHaveLength(1)
  })

  it('adds a release ledger entry when canceling a pending order', async () => {
    const { published, sku } = await preparePublishedProduct()

    const order = mallWorkflow.createOrder(published, sku.id, {
      customerName: 'Customer',
      customerPhone: '13800000000',
      quantity: 1,
    })
    mallWorkflow.cancelOrder(order.id)

    expect(mallRepository.listInventoryLedgerEntries(sku.id)).toHaveLength(2)
    expect(mallRepository.listInventoryLedgerEntries(sku.id)[1]).toMatchObject({
      skuId: sku.id,
      orderId: order.id,
      action: 'release',
      quantityDelta: 1,
    })
  })
})
