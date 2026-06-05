import { createId } from '../../domain/shared/ids'
import type {
  DeleteUploadResult,
  UploadAssetStatus,
  UploadContext,
  UploadedAsset,
  UploadFailureCode,
  UploadResult,
  UploadService,
  UploadedImage,
} from './upload-service'

type WxCloudRuntime = {
  init?: (options: { env: string; traceUser?: boolean }) => void
  uploadFile: (request: { cloudPath: string; filePath: string }) => Promise<{ fileID: string }>
  getTempFileURL: (request: { fileList: Array<{ fileID: string; maxAge?: number }> }) => Promise<{
    fileList: Array<{ fileID: string; tempFileURL?: string; download_url?: string }>
  }>
  deleteFile: (request: { fileList: string[] }) => Promise<{ fileList: Array<{ fileID: string; status: string }> }>
  getFileInfo?: (request: { fileList: string[]; type?: 'image' }) => Promise<{
    fileList: Array<{ fileID: string; size: number; digest?: string }>
  }>
  compressImage?: (request: { src: string; quality?: number }) => Promise<{ tempFilePath: string }>
}

type UniRuntime = {
  chooseImage?: (options: {
    count?: number
    success?: (result: { tempFilePaths: string[] | string; tempFiles?: Array<{ path: string; size: number }> }) => void
    fail?: (error: unknown) => void
  }) => void
  getImageInfo?: (options: {
    src: string
    success?: (result: { width: number; height: number; type: string; orientation: string; path?: string }) => void
    fail?: (error: unknown) => void
  }) => void
  compressImage?: (options: {
    src: string
    quality?: number
    success?: (result: { tempFilePath: string }) => void
    fail?: (error: unknown) => void
  }) => void
}

declare const wx: { cloud?: WxCloudRuntime } | undefined
declare const uni: UniRuntime | undefined

const cloudBaseEnvId = 'cloud1-d7gifjyzl7721b383'
const maxFileSizeBytes = 8 * 1024 * 1024
const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp']
const tempFileUrlMaxAgeSeconds = 45 * 60

let initialized = false

const ensureRuntime = (): WxCloudRuntime => {
  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('CloudBase storage runtime is only available inside WeChat Mini Program')
  }

  if (!initialized) {
    wx.cloud.init?.({ env: cloudBaseEnvId, traceUser: true })
    initialized = true
  }

  return wx.cloud
}

const inferMimeType = (filePath: string): string => {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

const fileNameFromPath = (filePath: string, index: number): string => {
  const trimmed = filePath.split('?')[0]
  const fallbackName = `upload-${index + 1}.jpg`
  const fileName = trimmed.split('/').pop() || fallbackName
  const lower = fileName.toLowerCase()
  if (supportedExtensions.some((extension) => lower.endsWith(extension))) {
    return fileName
  }
  return `${fileName}.jpg`
}

const extensionFromPath = (filePath: string): string => {
  const fileName = filePath.split('?')[0].split('/').pop() || ''
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex > -1 ? fileName.slice(dotIndex).toLowerCase() : ''
}

const isWechatTempPath = (filePath: string): boolean =>
  filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp/') || filePath.startsWith('https://tmp/')

const hasUnsupportedExplicitExtension = (filePath: string): boolean => {
  if (isWechatTempPath(filePath)) {
    return false
  }

  const extension = extensionFromPath(filePath)
  return extension !== '' && !supportedExtensions.includes(extension)
}

const withFailureCode = (error: unknown, failureCode: UploadFailureCode): Error =>
  error instanceof Error ? Object.assign(error, { failureCode }) : Object.assign(new Error(String(error)), { failureCode })

const resolveTempUrl = async (fileID: string): Promise<string> => {
  const result = await ensureRuntime().getTempFileURL({ fileList: [{ fileID, maxAge: tempFileUrlMaxAgeSeconds }] })
  const resolved = result.fileList[0]?.tempFileURL ?? result.fileList[0]?.download_url
  if (!resolved) {
    throw new Error('Failed to resolve temporary file URL after upload')
  }
  return resolved
}

const chooseImagePayload = async (context?: UploadContext): Promise<{ filePaths: string[]; sizes: number[] }> => {
  if (typeof uni === 'undefined' || typeof uni.chooseImage !== 'function') {
    throw new Error('Image selection is only available inside WeChat Mini Program')
  }

  const chooseImage = uni.chooseImage
  if (!chooseImage) {
    throw new Error('Image selection is only available inside WeChat Mini Program')
  }

  return new Promise((resolve, reject) => {
    chooseImage({
      count: context?.count ?? 9,
      success: (result) => {
        const tempFilePaths = Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths]
        const sizes = result.tempFiles?.map((item) => item.size) ?? tempFilePaths.map(() => 0)
        resolve({ filePaths: tempFilePaths, sizes })
      },
      fail: reject,
    })
  })
}

const compressIfPossible = async (filePath: string): Promise<string> => {
  if (typeof uni !== 'undefined' && typeof uni.compressImage === 'function') {
    return new Promise((resolve) => {
      uni.compressImage?.({
        src: filePath,
        quality: 75,
        success: (result) => resolve(result.tempFilePath),
        fail: () => resolve(filePath),
      })
    })
  }

  if (typeof ensureRuntime().compressImage === 'function') {
    try {
      const result = await ensureRuntime().compressImage?.({ src: filePath, quality: 75 })
      if (result?.tempFilePath) {
        return result.tempFilePath
      }
    } catch {
      return filePath
    }
  }

  return filePath
}

const readImageSize = async (filePath: string): Promise<number> => {
  if (typeof uni !== 'undefined' && typeof uni.getImageInfo === 'function') {
    return new Promise((resolve, reject) => {
      uni.getImageInfo?.({
        src: filePath,
        success: () => resolve(0),
        fail: reject,
      })
    })
  }

  if (typeof ensureRuntime().getFileInfo === 'function') {
    const result = await ensureRuntime().getFileInfo?.({ fileList: [filePath], type: 'image' })
    return result?.fileList[0]?.size ?? 0
  }

  return 0
}

const shouldPersistCloudFileIds = (context: UploadContext): boolean =>
  context.businessType === 'product_main_image' || context.businessType === 'product_detail_image'

const uploadFiles = async (filePaths: string[], context: UploadContext, selectedSizes: number[] = []): Promise<UploadResult> => {
  const runtime = ensureRuntime()
  const assets: UploadedAsset[] = []

  for (const [index, originalPath] of filePaths.entries()) {
    if (hasUnsupportedExplicitExtension(originalPath)) {
      throw withFailureCode(new Error(`Unsupported image format: ${originalPath}`), 'unsupported_format')
    }

    const compressedPath = await compressIfPossible(originalPath)
    const selectedSize = selectedSizes[index] ?? 0
    const size = selectedSize > 0 ? selectedSize : await readImageSize(compressedPath)
    if (size > maxFileSizeBytes) {
      throw withFailureCode(new Error(`Image too large: ${compressedPath}`), 'file_too_large')
    }

    const cloudPath = [
      'uploads',
      context.businessType,
      context.sourceRole,
      context.entityType,
      context.entityId ?? 'unbound',
      `${Date.now()}-${index + 1}-${fileNameFromPath(compressedPath, index)}`,
    ].join('/')

    try {
      const uploadResult = await runtime.uploadFile({ cloudPath, filePath: compressedPath })
      const tempUrl = await resolveTempUrl(uploadResult.fileID)

      assets.push({
        assetId: uploadResult.fileID,
        cloudPath,
        url: tempUrl,
        mimeType: inferMimeType(compressedPath),
        size,
        checksum: uploadResult.fileID,
        status: 'uploaded',
      })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'errMsg' in error && String((error as { errMsg?: string }).errMsg).includes('file too large')) {
        throw withFailureCode(error, 'file_too_large')
      }
      throw withFailureCode(error, 'network_failed')
    }
  }

  const useCloudFileIds = shouldPersistCloudFileIds(context)
  const imageUrls = assets.map((asset) => (useCloudFileIds ? asset.assetId : asset.url))

  return {
    mainImageUrl: imageUrls[0] ?? '',
    imageUrls,
    assets,
  }
}

const refreshAssetUrls = async (assetIds: string[]): Promise<UploadedAsset[]> => {
  const uniqueAssetIds = Array.from(new Set(assetIds))
  const result = uniqueAssetIds.length > 0
    ? await ensureRuntime().getTempFileURL({
        fileList: uniqueAssetIds.map((fileID) => ({ fileID, maxAge: tempFileUrlMaxAgeSeconds })),
      })
    : { fileList: [] }
  const urlByAssetId = new Map(
    result.fileList.map((item) => [item.fileID, item.tempFileURL ?? item.download_url ?? '']),
  )

  return assetIds.map((assetId) => ({
      assetId,
      cloudPath: assetId,
      url: urlByAssetId.get(assetId) ?? '',
      mimeType: 'image/png',
      size: 0,
      checksum: assetId,
      status: 'uploaded' as UploadAssetStatus,
    }))
}

export const cloudbaseUploadService: UploadService = {
  async chooseImages(context?: UploadContext): Promise<UploadedImage[]> {
    const { filePaths, sizes } = await chooseImagePayload(context)
    const uploaded = await uploadFiles(filePaths, context ?? {
      businessType: 'ocr_screenshot',
      sourceRole: 'owner',
      entityType: 'ocr_batch',
    }, sizes)

    return uploaded.imageUrls.map((url) => ({
      id: createId('image'),
      url,
      name: url.split('/').pop() || 'upload-image',
      assetId: uploaded.assets.find((asset) => asset.url === url)?.assetId,
    }))
  },
  async chooseAndUploadImages(context: UploadContext) {
    const { filePaths, sizes } = await chooseImagePayload(context)
    return uploadFiles(filePaths, context, sizes)
  },
  async uploadImages(filePaths: string[], context: UploadContext) {
    return uploadFiles(filePaths, context)
  },
  async uploadProductImages(productId: string, filePaths?: string[]) {
    const paths = filePaths ?? ['/static/logo.png']
    return uploadFiles(paths, {
      businessType: 'product_main_image',
      sourceRole: 'staff',
      entityType: 'product',
      entityId: productId,
      count: paths.length,
    })
  },
  async replaceProductImages(productId: string, previousAssetIds?: string[], filePaths?: string[]) {
    if (previousAssetIds && previousAssetIds.length > 0) {
      await this.deleteAssets(previousAssetIds)
    }

    return this.uploadProductImages(productId, filePaths)
  },
  async deleteAssets(assetIds: string[]): Promise<DeleteUploadResult> {
    if (assetIds.length === 0) {
      return { deletedAssetIds: [], failedAssetIds: [] }
    }

    try {
      const result = await ensureRuntime().deleteFile({ fileList: assetIds })
      const deletedAssetIds = result.fileList.filter((item) => item.status === 'success').map((item) => item.fileID)
      const failedAssetIds = result.fileList.filter((item) => item.status !== 'success').map((item) => item.fileID)
      return { deletedAssetIds, failedAssetIds }
    } catch (error) {
      throw withFailureCode(error, 'server_failed')
    }
  },
  async refreshAssetUrls(assetIds: string[]) {
    return refreshAssetUrls(assetIds)
  },
}
