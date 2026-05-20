import { createId } from '../../domain/shared/ids'
import type {
  DeleteUploadResult,
  UploadAssetStatus,
  UploadContext,
  UploadedAsset,
  UploadResult,
  UploadService,
  UploadedImage,
} from './upload-service'

const createMockAsset = (seed: string, index: number): UploadedAsset => ({
  assetId: createId('asset'),
  cloudPath: `mock/${seed}/${index + 1}.png`,
  url: `/static/logo.png?asset=${encodeURIComponent(`${seed}-${index + 1}`)}`,
  mimeType: 'image/png',
  size: 1024,
  checksum: `${seed}-${index + 1}`,
  status: 'uploaded' as UploadAssetStatus,
})

const buildMockResult = (seed: string, filePaths: string[] = []): UploadResult => {
  const assets = (filePaths.length > 0 ? filePaths : ['/static/logo.png']).map((filePath, index) => {
    const asset = createMockAsset(seed, index)
    return {
      ...asset,
      url: `${asset.url}&source=${encodeURIComponent(filePath)}`,
    }
  })

  return {
    mainImageUrl: assets[0]?.url ?? `/static/logo.png?asset=${encodeURIComponent(seed)}`,
    imageUrls: assets.map((asset) => asset.url),
    assets,
  }
}

export const mockUploadService: UploadService = {
  async chooseImages(context?: UploadContext): Promise<UploadedImage[]> {
    const count = context?.count ?? 3
    return Array.from({ length: count }, (_, index) => ({
      id: createId('image'),
      url: `/static/logo.png?choose=${index + 1}`,
      name: `mock-image-${index + 1}`,
      assetId: `mock/${context?.entityId ?? context?.businessType ?? 'upload'}/${index + 1}`,
    }))
  },
  async chooseAndUploadImages(context: UploadContext) {
    return buildMockResult(context.entityId ?? context.businessType)
  },
  async uploadImages(filePaths: string[], context: UploadContext) {
    return buildMockResult(context.entityId ?? context.businessType, filePaths)
  },
  async uploadProductImages(productId: string, filePaths?: string[]) {
    return buildMockResult(productId, filePaths)
  },
  async replaceProductImages(productId: string, previousAssetIds?: string[], filePaths?: string[]) {
    if (previousAssetIds && previousAssetIds.length > 0) {
      await this.deleteAssets(previousAssetIds)
    }
    return buildMockResult(productId, filePaths)
  },
  async deleteAssets(assetIds: string[]): Promise<DeleteUploadResult> {
    return {
      deletedAssetIds: assetIds,
      failedAssetIds: [],
    }
  },
  async refreshAssetUrls(assetIds: string[]) {
    return assetIds.map((assetId) => ({
      assetId,
      cloudPath: assetId,
      url: `/static/logo.png?asset=${encodeURIComponent(assetId)}&refresh=1`,
      mimeType: 'image/png',
      size: 1024,
      checksum: assetId,
      status: 'uploaded' as UploadAssetStatus,
    }))
  },
}
