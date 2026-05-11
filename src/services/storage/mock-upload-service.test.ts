import { describe, expect, it } from 'vitest'
import { mockUploadService } from './mock-upload-service'

describe('mock upload service', () => {
  it('creates deterministic mock upload results and deletion responses', async () => {
    const result = await mockUploadService.uploadProductImages('product-1', ['/tmp/a.png', '/tmp/b.png'])

    expect(result.mainImageUrl).toContain('/static/logo.png')
    expect(result.imageUrls).toHaveLength(2)

    const deleted = await mockUploadService.deleteAssets(['asset-1', 'asset-2'])
    expect(deleted).toEqual({ deletedAssetIds: ['asset-1', 'asset-2'], failedAssetIds: [] })
  })

  it('refreshes asset urls without changing the asset ids', async () => {
    const refreshed = await mockUploadService.refreshAssetUrls(['asset-1'])

    expect(refreshed[0].assetId).toBe('asset-1')
    expect(refreshed[0].url).toContain('asset-1')
  })
})
