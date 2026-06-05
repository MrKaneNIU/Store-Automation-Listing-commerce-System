import { afterEach, describe, expect, it, vi } from 'vitest'

describe('cloudbase upload service', () => {
  afterEach(() => {
    vi.resetModules()
    Reflect.deleteProperty(globalThis, 'wx')
    Reflect.deleteProperty(globalThis, 'uni')
  })

  it('formats upload errors and exposes the CloudBase path helpers through upload flows', async () => {
    const globalAny = globalThis as typeof globalThis & {
      wx?: {
        cloud?: {
          init?: (options: { env: string; traceUser?: boolean }) => void
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
    const getTempFileURL = vi.fn(async (request: { fileList: Array<{ fileID: string; maxAge?: number }> }) => ({
      fileList: request.fileList.map((item) => ({
        fileID: item.fileID,
        tempFileURL: item.fileID === 'cloud://asset-1' ? 'https://temp-url' : `https://temp-url/${encodeURIComponent(item.fileID)}`,
      })),
    }))
    const deleteFile = vi.fn(async () => ({ fileList: [{ fileID: 'cloud://asset-1', status: 'success' }] }))

    const init = vi.fn()

    globalAny.wx = {
      cloud: {
        init,
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
    expect(init).toHaveBeenCalledWith({ env: 'cloud1-d7gifjyzl7721b383', traceUser: true })
    expect(images[0].url).toBe('https://temp-url')
    expect(images[0].assetId).toBe('cloud://asset-1')

    const uploaded = await cloudbaseUploadService.uploadProductImages('product-1', ['/tmp/a.png'])
    expect(uploaded.mainImageUrl).toBe('cloud://asset-1')
    expect(uploaded.imageUrls).toEqual(['cloud://asset-1'])
    expect(uploaded.assets[0].cloudPath).toContain('uploads/product_main_image/staff/product/product-1')

    const deleted = await cloudbaseUploadService.deleteAssets(['cloud://asset-1'])
    expect(deleted.deletedAssetIds).toEqual(['cloud://asset-1'])

    const refreshed = await cloudbaseUploadService.refreshAssetUrls(['cloud://asset-1', 'cloud://asset-1', 'cloud://asset-2'])
    expect(refreshed[0].assetId).toBe('cloud://asset-1')
    expect(refreshed.map((asset) => asset.assetId)).toEqual(['cloud://asset-1', 'cloud://asset-1', 'cloud://asset-2'])
    expect(getTempFileURL).toHaveBeenLastCalledWith({
      fileList: [
        { fileID: 'cloud://asset-1', maxAge: 2700 },
        { fileID: 'cloud://asset-2', maxAge: 2700 },
      ],
    })
  })

  it('handles empty delete and refresh requests without touching the CloudBase runtime', async () => {
    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')

    await expect(cloudbaseUploadService.deleteAssets([])).resolves.toEqual({
      deletedAssetIds: [],
      failedAssetIds: [],
    })
    await expect(cloudbaseUploadService.refreshAssetUrls([])).resolves.toEqual([])
  })

  it('rejects unsupported image formats before upload', async () => {
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init: vi.fn(),
        uploadFile: vi.fn(),
        getTempFileURL: vi.fn(),
        deleteFile: vi.fn(),
      },
    })

    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')

    await expect(cloudbaseUploadService.uploadImages(['/tmp/a.gif'], {
      businessType: 'ocr_screenshot',
      sourceRole: 'owner',
      entityType: 'ocr_batch',
    })).rejects.toMatchObject({ failureCode: 'unsupported_format' })
  })

  it('uploads WeChat temp image paths without filename extensions', async () => {
    const uploadFile = vi.fn(async () => ({ fileID: 'cloud://ocr-asset-1' }))
    const getTempFileURL = vi.fn(async () => ({
      fileList: [{ fileID: 'cloud://ocr-asset-1', tempFileURL: 'https://temp-url/ocr-asset-1' }],
    }))
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init: vi.fn(),
        uploadFile,
        getTempFileURL,
        deleteFile: vi.fn(),
      },
    })
    Reflect.set(globalThis, 'uni', {
      chooseImage: (options: {
        count?: number
        success?: (result: { tempFilePaths: string[]; tempFiles: Array<{ path: string; size: number }> }) => void
      }) => {
        expect(options.count).toBe(2)
        options.success?.({
          tempFilePaths: ['wxfile://tmp_ocr_screenshot'],
          tempFiles: [{ path: 'wxfile://tmp_ocr_screenshot', size: 1024 }],
        })
      },
    })

    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')
    const images = await cloudbaseUploadService.chooseImages({
      businessType: 'ocr_screenshot',
      sourceRole: 'owner',
      entityType: 'ocr_batch',
      count: 2,
    })

    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      filePath: 'wxfile://tmp_ocr_screenshot',
    }))
    expect(images).toEqual([{
      id: expect.stringMatching(/^image-/),
      url: 'https://temp-url/ocr-asset-1',
      name: 'ocr-asset-1',
      assetId: 'cloud://ocr-asset-1',
    }])
  })

  it('falls back to the original image when compression fails', async () => {
    const uploadFile = vi.fn(async () => ({ fileID: 'cloud://asset-original' }))
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init: vi.fn(),
        uploadFile,
        getTempFileURL: vi.fn(async () => ({
          fileList: [{ fileID: 'cloud://asset-original', tempFileURL: 'https://temp-url/original' }],
        })),
        deleteFile: vi.fn(),
      },
    })
    Reflect.set(globalThis, 'uni', {
      compressImage: (options: { fail?: (error: unknown) => void }) => {
        options.fail?.(new Error('compress failed'))
      },
      getImageInfo: (options: { success?: () => void }) => {
        options.success?.()
      },
    })

    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')
    await expect(cloudbaseUploadService.uploadImages(['/tmp/a.png'], {
      businessType: 'ocr_screenshot',
      sourceRole: 'owner',
      entityType: 'ocr_batch',
    })).resolves.toMatchObject({
      mainImageUrl: 'https://temp-url/original',
    })
    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ filePath: '/tmp/a.png' }))
  })

  it('maps oversized image and CloudBase upload failures to upload failure codes', async () => {
    const getFileInfo = vi.fn(async () => ({
      fileList: [{ fileID: '/tmp/a.png', size: 9 * 1024 * 1024 }],
    }))
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init: vi.fn(),
        uploadFile: vi.fn(),
        getTempFileURL: vi.fn(),
        deleteFile: vi.fn(),
        getFileInfo,
      },
    })

    const { cloudbaseUploadService } = await import('./cloudbase-upload-service')
    const context = {
      businessType: 'ocr_screenshot' as const,
      sourceRole: 'owner' as const,
      entityType: 'ocr_batch' as const,
    }

    await expect(cloudbaseUploadService.uploadImages(['/tmp/a.png'], context)).rejects.toMatchObject({
      failureCode: 'file_too_large',
    })

    vi.resetModules()
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init: vi.fn(),
        uploadFile: vi.fn(async () => {
          throw new Error('network down')
        }),
        getTempFileURL: vi.fn(),
        deleteFile: vi.fn(),
        getFileInfo: vi.fn(async () => ({ fileList: [{ fileID: '/tmp/a.png', size: 512 }] })),
      },
    })

    const retryModule = await import('./cloudbase-upload-service')
    await expect(retryModule.cloudbaseUploadService.uploadImages(['/tmp/a.png'], context)).rejects.toMatchObject({
      failureCode: 'network_failed',
    })
  })
})
