import { isCloudFileId, isSignedCloudBaseTempUrl } from './product-image-url'

export type ProductImageAuditProduct = {
  id: string
  productName?: string
  mainImageUrl?: string
  imageUrls?: string[]
}

export type ProductImageAuditSku = {
  id: string
  productId: string
  mainImageUrl?: string
  imageUrl?: string
  imageUrls?: string[]
}

export type ProductImageAuditUploadedAsset = {
  entityId?: string
  assetId?: string
  fileId?: string
  businessType?: string
}

export type ProductImageBlockingIssue = {
  productId: string
  issue: 'signed_temp_url_without_durable_source'
  field: 'mainImageUrl' | 'imageUrls'
}

export type ProductImageRepairCandidate = {
  productId: string
  source: 'uploaded_asset' | 'sku_image'
  suggestedMainImageUrl: string
}

export type ProductImageUnrecoverableRecord = {
  productId: string
  issue: 'no_recoverable_image_source'
}

export type ProductImageAuditResult = {
  healthyProductIds: string[]
  blockingIssues: ProductImageBlockingIssue[]
  repairCandidates: ProductImageRepairCandidate[]
  unrecoverableRecords: ProductImageUnrecoverableRecord[]
}

const normalizeImageUrl = (imageUrl?: string) => imageUrl?.trim() ?? ''

const getSkuRecoverableImage = (sku: ProductImageAuditSku): string => {
  const candidates = [
    sku.mainImageUrl,
    sku.imageUrl,
    ...(sku.imageUrls ?? []),
  ].map(normalizeImageUrl)

  return candidates.find(isCloudFileId) ?? ''
}

const getUploadedAssetRecoverableImage = (asset: ProductImageAuditUploadedAsset): string => {
  const assetId = normalizeImageUrl(asset.assetId || asset.fileId)
  return isCloudFileId(assetId) ? assetId : ''
}

export const auditProductImageRecords = (input: {
  products: ProductImageAuditProduct[]
  skus: ProductImageAuditSku[]
  uploadedAssets: ProductImageAuditUploadedAsset[]
}): ProductImageAuditResult => {
  const healthyProductIds: string[] = []
  const blockingIssues: ProductImageBlockingIssue[] = []
  const repairCandidates: ProductImageRepairCandidate[] = []
  const unrecoverableRecords: ProductImageUnrecoverableRecord[] = []

  input.products.forEach((product) => {
    const mainImageUrl = normalizeImageUrl(product.mainImageUrl)
    const imageUrls = (product.imageUrls ?? []).map(normalizeImageUrl).filter(Boolean)

    if (isCloudFileId(mainImageUrl)) {
      healthyProductIds.push(product.id)
      return
    }

    if (isSignedCloudBaseTempUrl(mainImageUrl)) {
      blockingIssues.push({
        productId: product.id,
        issue: 'signed_temp_url_without_durable_source',
        field: 'mainImageUrl',
      })
      return
    }

    if (imageUrls.some(isSignedCloudBaseTempUrl)) {
      blockingIssues.push({
        productId: product.id,
        issue: 'signed_temp_url_without_durable_source',
        field: 'imageUrls',
      })
      return
    }

    const uploadedAssetImage = input.uploadedAssets
      .filter((asset) => asset.entityId === product.id)
      .map(getUploadedAssetRecoverableImage)
      .find(Boolean)
    if (uploadedAssetImage) {
      repairCandidates.push({
        productId: product.id,
        source: 'uploaded_asset',
        suggestedMainImageUrl: uploadedAssetImage,
      })
      return
    }

    const skuImage = input.skus
      .filter((sku) => sku.productId === product.id)
      .map(getSkuRecoverableImage)
      .find(Boolean)
    if (skuImage) {
      repairCandidates.push({
        productId: product.id,
        source: 'sku_image',
        suggestedMainImageUrl: skuImage,
      })
      return
    }

    unrecoverableRecords.push({
      productId: product.id,
      issue: 'no_recoverable_image_source',
    })
  })

  return {
    healthyProductIds,
    blockingIssues,
    repairCandidates,
    unrecoverableRecords,
  }
}
