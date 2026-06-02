import { describe, expect, it, vi } from 'vitest'

import {
  createProductImageUrlCache,
  isCloudFileId,
  isRenderableProductImageUrl,
  isSignedCloudBaseTempUrl,
  resolveProductImageView,
  resolveProductImageFields,
  resolveProductImageUrls,
  resolveProductImageUrl,
} from './product-image-url'

const signedTempUrl = 'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product.jpg?sign=abc&t=1779673154'

describe('product image url strategy', () => {
  it('classifies stable cloud file IDs and signed temporary CloudBase URLs', () => {
    expect(isCloudFileId('cloud://asset-1')).toBe(true)
    expect(isCloudFileId('/static/logo.png')).toBe(false)
    expect(isSignedCloudBaseTempUrl(signedTempUrl)).toBe(true)
    expect(isRenderableProductImageUrl(signedTempUrl)).toBe(false)
    expect(isRenderableProductImageUrl('/static/logo.png')).toBe(true)
  })

  it('resolves cloud file IDs through the upload service before rendering', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(async () => [
        {
          assetId: 'cloud://asset-1',
          url: 'https://renderable.example.com/product.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          checksum: 'cloud://asset-1',
          status: 'uploaded' as const,
        },
      ]),
    }

    await expect(resolveProductImageUrl('cloud://asset-1', uploadService)).resolves.toBe('https://renderable.example.com/product.jpg')
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledWith(['cloud://asset-1'])
  })

  it('keeps fresh CloudBase signed temporary URLs returned by refreshAssetUrls as render URLs', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(async () => [
        {
          assetId: 'cloud://asset-1',
          url: signedTempUrl,
          mimeType: 'image/jpeg',
          size: 1024,
          checksum: 'cloud://asset-1',
          status: 'uploaded' as const,
        },
      ]),
    }

    await expect(resolveProductImageUrl('cloud://asset-1', uploadService, {
      cache: createProductImageUrlCache(),
    })).resolves.toBe(signedTempUrl)
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledWith(['cloud://asset-1'])
  })

  it('dedupes cloud file IDs and reuses cached temporary URLs until the short TTL expires', async () => {
    const cache = createProductImageUrlCache()
    let now = 1_000
    const uploadService = {
      refreshAssetUrls: vi.fn(async (assetIds: string[]) => assetIds.map((assetId) => ({
        assetId,
        url: `https://renderable.example.com/${encodeURIComponent(assetId)}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024,
        checksum: assetId,
        status: 'uploaded' as const,
      }))),
    }

    await expect(resolveProductImageUrls([
      'cloud://asset-1',
      'cloud://asset-1',
      '/static/logo.png',
      signedTempUrl,
    ], uploadService, { cache, now: () => now })).resolves.toEqual([
      'https://renderable.example.com/cloud%3A%2F%2Fasset-1.jpg',
      'https://renderable.example.com/cloud%3A%2F%2Fasset-1.jpg',
      '/static/logo.png',
      '',
    ])
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledTimes(1)
    expect(uploadService.refreshAssetUrls).toHaveBeenLastCalledWith(['cloud://asset-1'])

    await expect(resolveProductImageUrls(['cloud://asset-1'], uploadService, { cache, now: () => now })).resolves.toEqual([
      'https://renderable.example.com/cloud%3A%2F%2Fasset-1.jpg',
    ])
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledTimes(1)

    now += 45 * 60 * 1000 + 1
    await expect(resolveProductImageUrls(['cloud://asset-1'], uploadService, { cache, now: () => now })).resolves.toEqual([
      'https://renderable.example.com/cloud%3A%2F%2Fasset-1.jpg',
    ])
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledTimes(2)
  })

  it('drops expired signed temporary URLs instead of treating them as durable product images', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(),
    }

    await expect(resolveProductImageUrl(signedTempUrl, uploadService)).resolves.toBe('')
    expect(uploadService.refreshAssetUrls).not.toHaveBeenCalled()
  })

  it('normalizes product image fields for ViewModels', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(async (assetIds: string[]) => assetIds.map((assetId) => ({
        assetId,
        url: `https://renderable.example.com/${encodeURIComponent(assetId)}.jpg`,
        mimeType: 'image/jpeg',
        size: 1024,
        checksum: assetId,
        status: 'uploaded' as const,
      }))),
    }

    await expect(resolveProductImageFields({
      id: 'product-1',
      productName: 'Cotton Shirt',
      mainImageUrl: 'cloud://asset-main',
      imageUrls: ['cloud://asset-main', 'cloud://asset-detail', signedTempUrl, '/static/logo.png'],
    }, uploadService)).resolves.toEqual({
      id: 'product-1',
      productName: 'Cotton Shirt',
      mainImageUrl: 'https://renderable.example.com/cloud%3A%2F%2Fasset-main.jpg',
      durableMainImageUrl: 'cloud://asset-main',
      thumbnailUrl: 'https://renderable.example.com/cloud%3A%2F%2Fasset-main.jpg',
      imageStatus: 'ready',
      imageAlt: 'Cotton Shirt',
      imageUrls: [
        'https://renderable.example.com/cloud%3A%2F%2Fasset-main.jpg',
        'https://renderable.example.com/cloud%3A%2F%2Fasset-detail.jpg',
        '/static/logo.png',
      ],
    })
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledTimes(1)
    expect(uploadService.refreshAssetUrls).toHaveBeenCalledWith(['cloud://asset-main', 'cloud://asset-detail'])
  })

  it('marks a signed temporary URL as refresh failed instead of no-image missing', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(),
    }

    await expect(resolveProductImageView({
      id: 'product-temp',
      productName: 'Signed URL Product',
      mainImageUrl: signedTempUrl,
      imageUrls: [signedTempUrl],
    }, uploadService)).resolves.toMatchObject({
      mainImageUrl: '',
      thumbnailUrl: '',
      durableMainImageUrl: signedTempUrl,
      imageStatus: 'refresh_failed',
      imageFallbackReason: '图片链接已过期，请刷新图片链接',
      imageAlt: 'Signed URL Product',
    })
  })

  it('keeps image state as missing only when no durable source exists', async () => {
    const uploadService = {
      refreshAssetUrls: vi.fn(),
    }

    await expect(resolveProductImageView({
      id: 'product-empty',
      productName: 'Empty Product',
      mainImageUrl: '',
      imageUrls: [],
    }, uploadService)).resolves.toMatchObject({
      mainImageUrl: '',
      thumbnailUrl: '',
      durableMainImageUrl: '',
      imageStatus: 'missing',
      imageFallbackReason: '未上传商品图片',
      imageAlt: 'Empty Product',
    })
  })
})
