import type { UploadService } from './upload-service'

const cloudFileIdPrefix = 'cloud://'
const cloudBaseTempImageHost = '.tcb.qcloud.la/'
const signedQueryPattern = /[?&]sign=/
const productImageUrlCacheTtlMs = 45 * 60 * 1000

export type ProductImageFields = {
  mainImageUrl: string
  imageUrls: string[]
}

type ProductImageUrlCacheEntry = {
  url: string
  expiresAt: number
}

export type ProductImageUrlCache = Map<string, ProductImageUrlCacheEntry>

type ProductImageUrlResolveOptions = {
  cache?: ProductImageUrlCache
  now?: () => number
}

const defaultProductImageUrlCache = new Map<string, ProductImageUrlCacheEntry>()

export const createProductImageUrlCache = (): ProductImageUrlCache => new Map<string, ProductImageUrlCacheEntry>()

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
  options: ProductImageUrlResolveOptions = {},
): Promise<string> => {
  const [resolvedUrl] = await resolveProductImageUrls([imageUrl], uploadService, options)
  return resolvedUrl ?? ''
}

export const resolveProductImageUrls = async (
  imageUrls: string[],
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
  options: ProductImageUrlResolveOptions = {},
): Promise<string[]> => {
  const cache = options.cache ?? defaultProductImageUrlCache
  const now = options.now?.() ?? Date.now()
  const normalizedUrls = imageUrls.map((imageUrl) => imageUrl.trim())
  const unresolvedCloudFileIds = normalizedUrls
    .filter((imageUrl) => Boolean(imageUrl))
    .filter((imageUrl) => !isSignedCloudBaseTempUrl(imageUrl))
    .filter(isCloudFileId)
    .filter((imageUrl) => {
      const cached = cache.get(imageUrl)
      return !cached || cached.expiresAt <= now || !cached.url
    })

  const uniqueCloudFileIds = Array.from(new Set(unresolvedCloudFileIds))

  if (uniqueCloudFileIds.length > 0) {
    try {
      const assets = await uploadService.refreshAssetUrls(uniqueCloudFileIds)
      const expiresAt = now + productImageUrlCacheTtlMs
      assets.forEach((asset) => {
        if (asset.url) {
          cache.set(asset.assetId, { url: asset.url, expiresAt })
        }
      })
    } catch {
      uniqueCloudFileIds.forEach((assetId) => cache.delete(assetId))
    }
  }

  return normalizedUrls.map((imageUrl) => {
    if (!imageUrl || isSignedCloudBaseTempUrl(imageUrl)) {
      return ''
    }

    if (!isCloudFileId(imageUrl)) {
      return imageUrl
    }

    const cached = cache.get(imageUrl)
    return cached && cached.expiresAt > now ? cached.url : ''
  })
}

export const resolveProductImageFields = async <TProduct extends ProductImageFields>(
  product: TProduct,
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
  options: ProductImageUrlResolveOptions = {},
): Promise<TProduct> => {
  const [mainImageUrl, ...imageUrls] = await resolveProductImageUrls(
    [product.mainImageUrl, ...product.imageUrls],
    uploadService,
    options,
  )

  return {
    ...product,
    mainImageUrl,
    imageUrls: imageUrls.filter(Boolean),
  }
}
