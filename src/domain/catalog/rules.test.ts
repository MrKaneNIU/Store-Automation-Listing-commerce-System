import { describe, expect, it } from 'vitest'
import { canPublishProduct, createProductsFromDrafts } from './rules'
import type { ProductDraft } from '../draft/types'

const baseDraft = {
  batchId: 'batch-1',
  productName: '圆领针织衫',
  salePrice: 129,
  sourceImageUrl: '/tmp/source.png',
  confidence: 0.96,
  status: 'confirmed',
} satisfies Partial<ProductDraft>

describe('createProductsFromDrafts', () => {
  it('groups one product per product code and creates one SKU per spec', () => {
    const result = createProductsFromDrafts([
      { ...baseDraft, id: 'draft-1', productCode: 'A1023', spec: '黑色/M', stock: 1 },
      { ...baseDraft, id: 'draft-2', productCode: 'A1023', spec: '白色/L', stock: 1 },
    ] as ProductDraft[])

    expect(result.products).toHaveLength(1)
    expect(result.products[0].productCode).toBe('A1023')
    expect(result.skus).toHaveLength(2)
    expect(result.skus.map((sku) => sku.spec)).toEqual(['黑色/M', '白色/L'])
  })

  it('merges repeated SKU stock for the same product code and spec', () => {
    const result = createProductsFromDrafts([
      { ...baseDraft, id: 'draft-1', productCode: 'A1023', spec: '黑色/M', stock: 1 },
      { ...baseDraft, id: 'draft-2', productCode: 'A1023', spec: '黑色/M', stock: 1 },
    ] as ProductDraft[])

    expect(result.products).toHaveLength(1)
    expect(result.skus).toHaveLength(1)
    expect(result.skus[0].stock).toBe(2)
  })
})

describe('canPublishProduct', () => {
  it('requires a main image and at least one SKU', () => {
    expect(
      canPublishProduct(
        {
          id: 'product-1',
          productCode: 'A1023',
          productName: '圆领针织衫',
          mainImageUrl: '',
          imageUrls: [],
          status: 'pending_images',
          createdFromBatchId: 'batch-1',
          createdAt: '2026-05-07T00:00:00.000Z',
          updatedAt: '2026-05-07T00:00:00.000Z',
        },
        [],
      ),
    ).toBe(false)
  })

  it('allows publishing when product has a main image and priced SKU', () => {
    expect(
      canPublishProduct(
        {
          id: 'product-1',
          productCode: 'A1023',
          productName: '圆领针织衫',
          mainImageUrl: '/tmp/main.png',
          imageUrls: ['/tmp/main.png'],
          status: 'ready_to_publish',
          createdFromBatchId: 'batch-1',
          createdAt: '2026-05-07T00:00:00.000Z',
          updatedAt: '2026-05-07T00:00:00.000Z',
        },
        [
          {
            id: 'sku-1',
            productId: 'product-1',
            productCode: 'A1023',
            spec: '黑色/M',
            salePrice: 129,
            stock: 1,
          },
        ],
      ),
    ).toBe(true)
  })
})
