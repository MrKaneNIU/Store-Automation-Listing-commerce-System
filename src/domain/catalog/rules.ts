import type { ProductDraft } from '../draft/types'
import { createId, nowIso } from '../shared/ids'
import type { ImportWarning, Product, Sku } from './types'

type CreateProductsResult = {
  products: Product[]
  skus: Sku[]
  warnings: ImportWarning[]
}

const getSkuKey = (draft: ProductDraft) => `${draft.productCode}::${draft.spec}`

export const createProductsFromDrafts = (drafts: ProductDraft[]): CreateProductsResult => {
  const confirmedDrafts = drafts.filter((draft) => draft.status === 'confirmed')
  const productByCode = new Map<string, Product>()
  const skuByKey = new Map<string, Sku>()
  const priceByProductCode = new Map<string, number>()
  const warnings: ImportWarning[] = []

  confirmedDrafts.forEach((draft) => {
    const existingPrice = priceByProductCode.get(draft.productCode)
    if (existingPrice === undefined) {
      priceByProductCode.set(draft.productCode, draft.salePrice)
    } else if (existingPrice !== draft.salePrice) {
      warnings.push({
        type: 'price_conflict',
        productCode: draft.productCode,
        message: `${draft.productCode} 存在多个销售价，请复核。`,
      })
      priceByProductCode.set(draft.productCode, draft.salePrice)
    }

    let product = productByCode.get(draft.productCode)
    if (!product) {
      const timestamp = nowIso()
      product = {
        id: createId('product'),
        productCode: draft.productCode,
        productName: draft.productName,
        mainImageUrl: '',
        imageUrls: [],
        status: 'pending_images',
        createdFromBatchId: draft.batchId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      productByCode.set(draft.productCode, product)
    }

    const skuKey = getSkuKey(draft)
    const existingSku = skuByKey.get(skuKey)
    if (existingSku) {
      skuByKey.set(skuKey, {
        ...existingSku,
        salePrice: draft.salePrice,
        stock: existingSku.stock + draft.stock,
      })
      return
    }

    skuByKey.set(skuKey, {
      id: createId('sku'),
      productId: product.id,
      productCode: draft.productCode,
      spec: draft.spec,
      salePrice: draft.salePrice,
      stock: draft.stock,
    })
  })

  return {
    products: Array.from(productByCode.values()),
    skus: Array.from(skuByKey.values()),
    warnings,
  }
}

export const canPublishProduct = (product: Product, skus: Sku[]) => {
  return Boolean(product.mainImageUrl) && skus.some((sku) => sku.productId === product.id && sku.salePrice > 0)
}
