import { describe, expect, it } from 'vitest'
import { canPublishProduct, createProductsFromDrafts, validateProductForPublish } from './rules'
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

  it('ignores drafts that are not confirmed', () => {
    const result = createProductsFromDrafts([
      { ...baseDraft, id: 'draft-1', productCode: 'A1023', spec: 'Black/M', stock: 1 },
      { ...baseDraft, id: 'draft-2', productCode: 'B2088', spec: 'Blue/S', stock: 1, status: 'pending' },
      { ...baseDraft, id: 'draft-3', productCode: 'C3001', spec: 'Red/L', stock: 1, status: 'deleted' },
    ] as ProductDraft[])

    expect(result.products.map((item) => item.productCode)).toEqual(['A1023'])
    expect(result.skus.map((item) => item.productCode)).toEqual(['A1023'])
  })

  it('records a warning when one product code has multiple sale prices', () => {
    const result = createProductsFromDrafts([
      { ...baseDraft, id: 'draft-1', productCode: 'A1023', spec: 'Black/M', stock: 1, salePrice: 129 },
      { ...baseDraft, id: 'draft-2', productCode: 'A1023', spec: 'White/L', stock: 1, salePrice: 139 },
    ] as ProductDraft[])

    expect(result.warnings).toEqual([
      expect.objectContaining({
        type: 'price_conflict',
        productCode: 'A1023',
      }),
    ])
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
          description: '',
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
          description: '',
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

  it('blocks publishing when all SKUs are unpriced', () => {
    expect(
      canPublishProduct(
        {
          id: 'product-1',
          productCode: 'A1023',
          productName: 'Test Product',
          description: '',
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
            spec: 'Black/M',
            salePrice: 0,
            stock: 1,
          },
        ],
      ),
    ).toBe(false)
  })
})

describe('validateProductForPublish', () => {
  const product = {
    id: 'product-1',
    productCode: 'A1023',
    productName: 'Test Product',
    description: '',
    mainImageUrl: '/tmp/main.png',
    imageUrls: ['/tmp/main.png'],
    status: 'ready_to_publish' as const,
    createdFromBatchId: 'batch-1',
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
  }

  const sku = {
    id: 'sku-1',
    productId: 'product-1',
    productCode: 'A1023',
    spec: 'Black/M',
    salePrice: 129,
    stock: 1,
  }

  it('returns publish blocking reasons for missing image, missing SKU, and empty stock', () => {
    expect(validateProductForPublish({ ...product, mainImageUrl: '' }, []).messages).toEqual([
      '缺少主图，无法上架',
      '没有可售规格，无法上架',
    ])
    expect(validateProductForPublish(product, [{ ...sku, stock: 0 }]).messages).toEqual([
      '全部规格暂无库存，请先补库存',
    ])
  })

  it('checks only in-stock saleable SKUs for price and spec completion', () => {
    expect(
      validateProductForPublish(product, [
        { ...sku, id: 'sku-1', salePrice: 0, stock: 1 },
        { ...sku, id: 'sku-2', spec: '', salePrice: 129, stock: 1 },
        { ...sku, id: 'sku-3', spec: 'Sold out', salePrice: 0, stock: 0 },
      ]).messages,
    ).toEqual(['存在价格为 0 的规格，请先补全售价', '存在规格名为空的规格，请先补全规格名'])
  })

  it('blocks duplicate specs under one product before publishing', () => {
    expect(
      validateProductForPublish(product, [
        sku,
        { ...sku, id: 'sku-2', spec: ' Black/M ' },
      ]).messages,
    ).toEqual(['存在重复规格，请先合并或修改'])
  })
})
