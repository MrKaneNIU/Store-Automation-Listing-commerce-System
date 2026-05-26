import { describe, expect, it, vi } from 'vitest'

import {
  isCloudFileId,
  isRenderableProductImageUrl,
  isSignedCloudBaseTempUrl,
  resolveProductImageFields,
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
      mainImageUrl: 'cloud://asset-main',
      imageUrls: ['cloud://asset-main', signedTempUrl, '/static/logo.png'],
    }, uploadService)).resolves.toEqual({
      id: 'product-1',
      mainImageUrl: 'https://renderable.example.com/cloud%3A%2F%2Fasset-main.jpg',
      imageUrls: [
        'https://renderable.example.com/cloud%3A%2F%2Fasset-main.jpg',
        '/static/logo.png',
      ],
    })
  })
})
