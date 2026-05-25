import { beforeEach, describe, expect, it } from 'vitest'
import type { OcrBatch } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { Order } from '../../domain/order/types'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mallAccess } from './mall-access'

const batch: OcrBatch = {
  id: 'batch-1',
  status: 'recognized',
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
  description: '',
  mainImageUrl: '/tmp/main.png',
  imageUrls: ['/tmp/main.png'],
  status: 'published',
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
}

const pendingImageProduct: Product = {
  ...product,
  id: 'product-2',
  productCode: 'B2088',
  status: 'pending_images',
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

describe('mallAccess', () => {
  it('reads batches and drafts through the feature boundary', () => {
    mallRepository.saveBatch(batch)
    mallRepository.saveDrafts([draft])
    const replacement = { ...draft, id: 'draft-2', status: 'confirmed' as const }

    expect(mallAccess.listBatches()).toEqual([batch])
    expect(mallAccess.getLatestBatch()).toEqual(batch)
    expect(mallAccess.listDrafts(batch.id)).toEqual([draft])
    expect(mallAccess.replaceDrafts(batch.id, [replacement])).toEqual([replacement])
    expect(mallAccess.listDrafts(batch.id)).toEqual([replacement])
  })

  it('reads product, SKU, and order views for pages', () => {
    mallRepository.saveProducts([product, pendingImageProduct], [sku])
    mallRepository.saveOrder(order)

    expect(mallAccess.listProducts()).toEqual([product, pendingImageProduct])
    expect(mallAccess.getProduct(product.id)).toEqual(product)
    expect(mallAccess.listPublishedProducts()).toEqual([product])
    expect(mallAccess.listPendingImageProducts()).toEqual([pendingImageProduct])
    expect(mallAccess.listSkus(product.id)).toEqual([sku])
    expect(mallAccess.countSkus(product.id)).toBe(1)
    expect(mallAccess.getMinSkuPrice(product.id)).toBe(129)
    expect(mallAccess.getMinSkuPrice('missing-product')).toBe('-')
    expect(mallAccess.listOrders()).toEqual([order])
  })
})
