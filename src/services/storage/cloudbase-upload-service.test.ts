import { describe, expect, it, vi } from 'vitest'

describe('cloudbase upload service', () => {
  it('formats upload errors and exposes the CloudBase path helpers through upload flows', async () => {
    const globalAny = globalThis as typeof globalThis & {
      wx?: {
        cloud?: {
          init?: (options: { env: string }) => void
          uploadFile: (request: { cloudPath: string; filePath: string }) => Promise<{ fileID: string }>
          getTempFileURL: (request: { fileList: Array<{ fileID: string; maxAge?: number }> }) => Promise<{
            fileList: Array<{ fileID: string; tempFileURL?: string; download_url?: string }>
          }>
          deleteFile: (request: { fileList: string[] }) => Promise<{ fileList: Array<{ fileID: string; status: string }> }>
        }
      }
      uni?: {
        chooseImage?: (options: {
          count?: number
          success?: (result: { tempFilePaths: string[] | string; tempFiles?: Array<{ path: string; size: number }> }) => void
        }) => void
      }
    }

    const uploadFile = vi.fn(async () => ({ fileID: 'cloud://asset-1' }))
    const getTempFileURL = vi.fn(async () => ({ fileList: [{ fileID: 'cloud://asset-1', tempFileURL: 'https://temp-url' }] }))
    const deleteFile = vi.fn(async () => ({ fileList: [{ fileID: 'cloud://asset-1', status: 'success' }] }))

    globalAny.wx = {
      cloud: {
        init: vi.fn(),
        uploadFile,
        getTempFileURL,
        deleteFile,
      },
    }

    globalAny.uni = {
      chooseImage: (options) => {
        options.success?.({ tempFilePaths: ['/tmp/a.png'], tempFiles: [{ path: '/tmp/a.png', size: 512 }] })
      },
    }

    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')
    const images = await cloudbaseUploadService.chooseImages({ businessType: 'ocr_screenshot', sourceRole: 'owner', entityType: 'ocr_batch' })
    expect(images[0].url).toBe('https://temp-url')
    expect(images[0].assetId).toBe('cloud://asset-1')

    const uploaded = await cloudbaseUploadService.uploadProductImages('product-1', ['/tmp/a.png'])
    expect(uploaded.assets[0].cloudPath).toContain('uploads/product_main_image/staff/product/product-1')

    const deleted = await cloudbaseUploadService.deleteAssets(['cloud://asset-1'])
    expect(deleted.deletedAssetIds).toEqual(['cloud://asset-1'])

    const refreshed = await cloudbaseUploadService.refreshAssetUrls(['cloud://asset-1'])
    expect(refreshed[0].assetId).toBe('cloud://asset-1')
  })
})
