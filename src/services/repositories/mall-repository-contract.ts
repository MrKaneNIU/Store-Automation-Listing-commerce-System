import { describe, expect, it } from 'vitest'

import type { OcrBatch } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { Order } from '../../domain/order/types'
import type { MallRepositoryContract } from './mall-repository-port'

export type MallRepositoryContractFactory = {
  createRepository: () => MallRepositoryContract
  reset?: () => void | Promise<void>
}

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

export const runMallRepositoryContract = (
  label: string,
  factory: MallRepositoryContractFactory,
): void => {
  describe(`${label} mall repository contract`, () => {
    it('saves, lists, and updates batches without exposing local list mutation', async () => {
      await factory.reset?.()
      const repository = factory.createRepository()

      await repository.saveBatch(batch)
      const listed = await repository.listBatches()
      listed.push({ ...batch, id: 'local-only-batch' })
      const updated = await repository.updateBatch({
        ...batch,
        status: 'recognized',
        updatedAt: '2026-05-08T00:01:00.000Z',
      })

      expect(updated.status).toBe('recognized')
      expect(await repository.listBatches()).toEqual([updated])
    })

    it('saves drafts, filters by batch, and replaces only the requested batch drafts', async () => {
      await factory.reset?.()
      const repository = factory.createRepository()

      await repository.saveBatch(batch)
      await repository.saveBatch({ ...batch, id: 'batch-2' })
      const otherBatchDraft = { ...draft, id: 'draft-2', batchId: 'batch-2', productCode: 'B2088' }
      await repository.saveDrafts([draft, otherBatchDraft])

      const replacement = { ...draft, id: 'draft-3', status: 'confirmed' as const }
      const replaced = await repository.replaceDrafts('batch-1', [replacement])

      expect(replaced).toEqual([replacement])
      expect(await repository.listDrafts('batch-1')).toEqual([replacement])
      expect(await repository.listDrafts('batch-2')).toEqual([otherBatchDraft])
      expect(await repository.listDrafts()).toEqual([otherBatchDraft, replacement])
    })

    it('saves products and SKUs, then updates products and SKUs by id', async () => {
      await factory.reset?.()
      const repository = factory.createRepository()

      await repository.saveBatch(batch)
      await repository.saveProducts([product], [sku])

      const updatedProduct = await repository.updateProduct({
        ...product,
        mainImageUrl: '/tmp/main.png',
        imageUrls: ['/tmp/main.png'],
        status: 'ready_to_publish',
      })
      const updatedSku = await repository.updateSku({ ...sku, stock: 1 })

      expect(await repository.listProducts()).toEqual([updatedProduct])
      expect(await repository.listSkus()).toEqual([updatedSku])
      expect(await repository.listSkus(product.id)).toEqual([updatedSku])
      expect(await repository.listSkus('missing-product')).toEqual([])
    })

    it('saves, lists, and updates orders by id', async () => {
      await factory.reset?.()
      const repository = factory.createRepository()

      await repository.saveBatch(batch)
      await repository.saveProducts([product], [sku])
      await repository.saveOrder(order)

      const updated = await repository.updateOrder({
        ...order,
        status: 'confirmed',
        updatedAt: '2026-05-08T00:02:00.000Z',
      })

      expect(await repository.listOrders()).toEqual([updated])
    })
  })
}

export const repositoryContractFixtures = {
  batch,
  draft,
  product,
  sku,
  order,
}
