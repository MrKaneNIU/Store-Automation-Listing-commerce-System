import type { UploadService } from './upload-service'

const cloudFileIdPrefix = 'cloud://'
const cloudBaseTempImageHost = '.tcb.qcloud.la/'
const signedQueryPattern = /[?&]sign=/
const productImageUrlCacheTtlMs = 45 * 60 * 1000

export type ProductImageFields = {
  mainImageUrl: string
  imageUrls: string[]
  productName?: string
}

export type ProductImageStatus = 'ready' | 'missing' | 'refresh_failed'

export type ProductImageViewModel = {
  mainImageUrl: string
  thumbnailUrl: string
  durableMainImageUrl: string
  imageStatus: ProductImageStatus
  imageFallbackReason?: string
  imageAlt: string
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

export const clearProductImageUrlCache = (imageUrl?: string): void => {
  if (imageUrl) {
    defaultProductImageUrlCache.delete(imageUrl.trim())
    return
  }

  defaultProductImageUrlCache.clear()
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

const hasImageSource = (imageUrls: string[]) =>
  imageUrls.some((imageUrl) => Boolean(imageUrl.trim()))

const createProductImageView = (
  product: ProductImageFields,
  resolvedMainImageUrl: string,
): ProductImageViewModel => {
  const durableMainImageUrl = product.mainImageUrl.trim()
  const imageAlt = product.productName?.trim() || '商品图片'

  if (resolvedMainImageUrl) {
    return {
      mainImageUrl: resolvedMainImageUrl,
      thumbnailUrl: resolvedMainImageUrl,
      durableMainImageUrl,
      imageStatus: 'ready',
      imageAlt,
    }
  }

  if (!hasImageSource([product.mainImageUrl, ...product.imageUrls])) {
    return {
      mainImageUrl: '',
      thumbnailUrl: '',
      durableMainImageUrl,
      imageStatus: 'missing',
      imageFallbackReason: '未上传商品图片',
      imageAlt,
    }
  }

  return {
    mainImageUrl: '',
    thumbnailUrl: '',
    durableMainImageUrl,
    imageStatus: 'refresh_failed',
    imageFallbackReason: '图片链接已过期，请刷新图片链接',
    imageAlt,
  }
}

export const resolveProductImageView = async <TProduct extends ProductImageFields>(
  product: TProduct,
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
  options: ProductImageUrlResolveOptions = {},
): Promise<ProductImageViewModel> => {
  const [mainImageUrl] = await resolveProductImageUrls([product.mainImageUrl], uploadService, options)
  return createProductImageView(product, mainImageUrl ?? '')
}

export const createStaticProductImageView = <TProduct extends ProductImageFields>(
  product: TProduct,
): ProductImageViewModel => {
  const mainImageUrl = isRenderableProductImageUrl(product.mainImageUrl) ? product.mainImageUrl.trim() : ''
  return createProductImageView(product, mainImageUrl)
}

export const resolveProductImageFields = async <TProduct extends ProductImageFields>(
  product: TProduct,
  uploadService: Pick<UploadService, 'refreshAssetUrls'>,
  options: ProductImageUrlResolveOptions = {},
): Promise<TProduct & ProductImageViewModel> => {
  const [mainImageUrl, ...imageUrls] = await resolveProductImageUrls(
    [product.mainImageUrl, ...product.imageUrls],
    uploadService,
    options,
  )
  const imageView = createProductImageView(product, mainImageUrl ?? '')

  return {
    ...product,
    ...imageView,
    imageUrls: imageUrls.filter(Boolean),
  }
}
