import { describe, expect, it } from 'vitest'

import { auditProductImageRecords } from './product-image-audit'

describe('product image audit', () => {
  it('reports durable product image records as healthy', () => {
    const result = auditProductImageRecords({
      products: [{
        id: 'product-1',
        productName: 'Cotton Shirt',
        mainImageUrl: 'cloud://bucket/uploads/product-1/main.jpg',
        imageUrls: ['cloud://bucket/uploads/product-1/detail.jpg'],
      }],
      skus: [],
      uploadedAssets: [],
    })

    expect(result.blockingIssues).toEqual([])
    expect(result.repairCandidates).toEqual([])
    expect(result.healthyProductIds).toEqual(['product-1'])
  })

  it('flags signed temporary URLs that have no durable product source', () => {
    const result = auditProductImageRecords({
      products: [{
        id: 'product-temp',
        productName: 'Temporary Link',
        mainImageUrl: 'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product.jpg?sign=abc&t=1780324553',
        imageUrls: [],
      }],
      skus: [],
      uploadedAssets: [],
    })

    expect(result.blockingIssues).toEqual([{
      productId: 'product-temp',
      issue: 'signed_temp_url_without_durable_source',
      field: 'mainImageUrl',
    }])
  })

  it('marks products with related SKU or uploaded asset images as staging repair candidates', () => {
    const result = auditProductImageRecords({
      products: [{
        id: 'product-missing',
        productName: 'Missing Main',
        mainImageUrl: '',
        imageUrls: [],
      }],
      skus: [{
        id: 'sku-1',
        productId: 'product-missing',
        mainImageUrl: 'cloud://bucket/uploads/product-missing/sku.jpg',
      }],
      uploadedAssets: [{
        entityId: 'product-missing',
        assetId: 'cloud://bucket/uploads/product-missing/uploaded.jpg',
        businessType: 'product_main_image',
      }],
    })

    expect(result.repairCandidates).toEqual([{
      productId: 'product-missing',
      source: 'uploaded_asset',
      suggestedMainImageUrl: 'cloud://bucket/uploads/product-missing/uploaded.jpg',
    }])
    expect(result.unrecoverableRecords).toEqual([])
  })

  it('keeps products without any recoverable image source out of repair candidates', () => {
    const result = auditProductImageRecords({
      products: [{
        id: 'product-empty',
        productName: 'Empty Product',
        mainImageUrl: '',
        imageUrls: [],
      }],
      skus: [],
      uploadedAssets: [],
    })

    expect(result.repairCandidates).toEqual([])
    expect(result.unrecoverableRecords).toEqual([{
      productId: 'product-empty',
      issue: 'no_recoverable_image_source',
    }])
  })

  it('flags signed temporary URLs in secondary image lists', () => {
    const result = auditProductImageRecords({
      products: [{
        id: 'product-temp-list',
        mainImageUrl: '',
        imageUrls: [
          '   ',
          'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/detail.jpg?sign=abc',
        ],
      }],
      skus: [],
      uploadedAssets: [],
    })

    expect(result.blockingIssues).toEqual([{
      productId: 'product-temp-list',
      issue: 'signed_temp_url_without_durable_source',
      field: 'imageUrls',
    }])
  })

  it('falls back to uploaded fileId and SKU image sources when durable product images are missing', () => {
    const result = auditProductImageRecords({
      products: [
        { id: 'product-uploaded-file', mainImageUrl: '', imageUrls: [] },
        { id: 'product-sku-image', mainImageUrl: '', imageUrls: [] },
      ],
      skus: [{
        id: 'sku-1',
        productId: 'product-sku-image',
        imageUrl: 'cloud://bucket/uploads/product-sku-image/sku.jpg',
      }],
      uploadedAssets: [{
        entityId: 'product-uploaded-file',
        fileId: 'cloud://bucket/uploads/product-uploaded-file/uploaded.jpg',
      }],
    })

    expect(result.repairCandidates).toEqual([
      {
        productId: 'product-uploaded-file',
        source: 'uploaded_asset',
        suggestedMainImageUrl: 'cloud://bucket/uploads/product-uploaded-file/uploaded.jpg',
      },
      {
        productId: 'product-sku-image',
        source: 'sku_image',
        suggestedMainImageUrl: 'cloud://bucket/uploads/product-sku-image/sku.jpg',
      },
    ])
  })
})
