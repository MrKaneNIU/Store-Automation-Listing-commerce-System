import { beforeEach, describe, expect, it } from 'vitest'
import type { OcrBatch } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { Order } from '../../domain/order/types'
import { mallRepository } from './mall-repository'
import { resetMockDb } from './mock-db'

const batch: OcrBatch = {
  id: 'batch-1',
  status: 'uploaded',
  imageUrls: ['/tmp/page-1.png'],
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
}

const draft: ProductDraft = {
  id: 'draft-1',
  batchId: 'batch-1',
  productCode: 'A1023',
  productName: 'Test Product',
  salePrice: 129,
  spec: 'Black/M',
  stock: 1,
  confidence: 0.96,
  sourceImageUrl: '/tmp/page-1.png',
  status: 'pending',
}

const product: Product = {
  id: 'product-1',
  productCode: 'A1023',
  productName: 'Test Product',
  mainImageUrl: '',
  imageUrls: [],
  status: 'pending_images',
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
}

const sku: Sku = {
  id: 'sku-1',
  productId: 'product-1',
  productCode: 'A1023',
  spec: 'Black/M',
  salePrice: 129,
  stock: 2,
}

const order: Order = {
  id: 'order-1',
  customerName: 'Wechat Customer',
  customerPhone: '13800000000',
  customerId: 'mock-customer-001',
  customerAuthSource: 'mock_wechat',
  status: 'pending_merchant_confirm',
  items: [
    {
      skuId: 'sku-1',
      productId: 'product-1',
      productName: 'Test Product',
      productCode: 'A1023',
      spec: 'Black/M',
      salePrice: 129,
      quantity: 1,
    },
  ],
  totalAmount: 129,
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
}

beforeEach(() => {
  resetMockDb()
})

describe('mallRepository batch contract', () => {
  it('saves, lists, and updates batches without exposing the backing array', () => {
    mallRepository.saveBatch(batch)

    const listed = mallRepository.listBatches()
    listed.push({ ...batch, id: 'local-only-batch' })
    const updated = mallRepository.updateBatch({ ...batch, status: 'recognized', updatedAt: '2026-05-08T00:01:00.000Z' })

    expect(updated.status).toBe('recognized')
    expect(mallRepository.listBatches()).toEqual([updated])
  })
})

describe('mallRepository draft contract', () => {
  it('saves drafts, filters by batch, and replaces only the requested batch drafts', () => {
    const otherBatchDraft = { ...draft, id: 'draft-2', batchId: 'batch-2', productCode: 'B2088' }
    mallRepository.saveDrafts([draft, otherBatchDraft])

    const replacement = { ...draft, id: 'draft-3', status: 'confirmed' as const }
    const replaced = mallRepository.replaceDrafts('batch-1', [replacement])

    expect(replaced).toEqual([replacement])
    expect(mallRepository.listDrafts('batch-1')).toEqual([replacement])
    expect(mallRepository.listDrafts('batch-2')).toEqual([otherBatchDraft])
    expect(mallRepository.listDrafts()).toEqual([otherBatchDraft, replacement])
  })
})

describe('mallRepository catalog contract', () => {
  it('saves products and SKUs, then updates products and SKUs by id', () => {
    mallRepository.saveProducts([product], [sku])

    const updatedProduct = mallRepository.updateProduct({
      ...product,
      mainImageUrl: '/tmp/main.png',
      imageUrls: ['/tmp/main.png'],
      status: 'ready_to_publish',
    })
    const updatedSku = mallRepository.updateSku({ ...sku, stock: 1 })

    expect(mallRepository.listProducts()).toEqual([updatedProduct])
    expect(mallRepository.listSkus()).toEqual([updatedSku])
    expect(mallRepository.listSkus(product.id)).toEqual([updatedSku])
    expect(mallRepository.listSkus('missing-product')).toEqual([])
  })
})

describe('mallRepository order contract', () => {
  it('saves, lists, and updates orders by id', () => {
    mallRepository.saveOrder(order)

    const updated = mallRepository.updateOrder({
      ...order,
      status: 'confirmed',
      updatedAt: '2026-05-08T00:02:00.000Z',
    })

    expect(mallRepository.listOrders()).toEqual([updated])
  })
})

describe('resetMockDb', () => {
  it('clears all repository collections', () => {
    mallRepository.saveBatch(batch)
    mallRepository.saveDrafts([draft])
    mallRepository.saveProducts([product], [sku])
    mallRepository.saveOrder(order)

    resetMockDb()

    expect(mallRepository.listBatches()).toEqual([])
    expect(mallRepository.listDrafts()).toEqual([])
    expect(mallRepository.listProducts()).toEqual([])
    expect(mallRepository.listSkus()).toEqual([])
    expect(mallRepository.listOrders()).toEqual([])
  })
})
