import type { UploadService } from './upload-service'

const cloudFileIdPrefix = 'cloud://'
const cloudBaseTempImageHost = '.tcb.qcloud.la/'
const signedQueryPattern = /[?&]sign=/

export type ProductImageFields = {
  mainImageUrl: string
  imageUrls: string[]
}

export const isCloudFileId = (imageUrl: string): boolean =>
  imageUrl.trim().startsWith(cloudFileIdPrefix)

export const isSignedCloudBaseTempUrl = (imageUrl: string): boolean => {
  const normalizedUrl = imageUrl.trim()
  return normalizedUrl.startsWith('https://')
    && normalizedUrl.includes(cloudBaseTempImageHost)
    && signedQueryPattern.test(normalizedUrl)
}

export const isRenderableProductImageUrl = (imageUrl: string): boolean => {
  const normalizedUrl = imageUrl.trim()
  return Boolean(normalizedUrl) && !isSignedCloudBaseTempUrl(normalizedUrl)
}

export const resolveProductImageUrl = async (
  imageUrl: string,
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
): Promise<string> => {
  const normalizedUrl = imageUrl.trim()
  if (!normalizedUrl || isSignedCloudBaseTempUrl(normalizedUrl)) {
    return ''
  }

  if (!isCloudFileId(normalizedUrl)) {
    return normalizedUrl
  }

  try {
    const [asset] = await uploadService.refreshAssetUrls([normalizedUrl])
    return asset?.url ?? ''
  } catch {
    return ''
  }
}

export const resolveProductImageFields = async <TProduct extends ProductImageFields>(
  product: TProduct,
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
): Promise<TProduct> => {
  const [mainImageUrl, imageUrls] = await Promise.all([
    resolveProductImageUrl(product.mainImageUrl, uploadService),
    Promise.all(product.imageUrls.map((imageUrl) => resolveProductImageUrl(imageUrl, uploadService))),
  ])

  return {
    ...product,
    mainImageUrl,
    imageUrls: imageUrls.filter(Boolean),
  }
}
