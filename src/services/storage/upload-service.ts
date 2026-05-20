export type UploadBusinessType = 'ocr_screenshot' | 'product_main_image' | 'product_detail_image'

export type UploadSourceRole = 'owner' | 'staff'

export type UploadEntityType = 'ocr_batch' | 'product'

export type UploadContext = {
  businessType: UploadBusinessType
  sourceRole: UploadSourceRole
  entityType: UploadEntityType
  entityId?: string
  count?: number
}

export type UploadFailureCode =
  | 'file_too_large'
  | 'unsupported_format'
  | 'network_failed'
  | 'server_failed'
  | 'security_review_failed'

export type UploadAssetStatus = 'uploaded' | 'pending_review' | 'failed' | 'deleted' | 'replaced'

export type UploadedAsset = {
  assetId: string
  url: string
  mimeType: string
  size: number
  checksum: string
  status: UploadAssetStatus
  cloudPath?: string
  expiresAt?: string
  failureCode?: UploadFailureCode
}

export type UploadResult = {
  mainImageUrl: string
  imageUrls: string[]
  assets: UploadedAsset[]
}

export type UploadedImage = {
  id: string
  url: string
  name: string
  assetId?: string
}

export type DeleteUploadResult = {
  deletedAssetIds: string[]
  failedAssetIds: string[]
}

export interface UploadService {
  chooseImages(context?: UploadContext): Promise<UploadedImage[]>
  chooseAndUploadImages(context: UploadContext): Promise<UploadResult>
  uploadImages(filePaths: string[], context: UploadContext): Promise<UploadResult>
  uploadProductImages(productId: string, filePaths?: string[]): Promise<UploadResult>
  replaceProductImages(productId: string, previousAssetIds?: string[], filePaths?: string[]): Promise<UploadResult>
  deleteAssets(assetIds: string[]): Promise<DeleteUploadResult>
  refreshAssetUrls(assetIds: string[]): Promise<UploadedAsset[]>
}
