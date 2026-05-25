import type { ProductDraft } from '../draft/types'
import { createId, nowIso } from '../shared/ids'
import type { ImportWarning, Product, Sku } from './types'

type CreateProductsResult = {
  products: Product[]
  skus: Sku[]
  warnings: ImportWarning[]
}

export type PublishValidationIssue = {
  code:
    | 'missing_main_image'
    | 'missing_sku'
    | 'no_saleable_stock'
    | 'invalid_sale_price'
    | 'empty_spec'
    | 'duplicate_spec'
  message: string
}

export type PublishValidationResult = {
  canPublish: boolean
  issues: PublishValidationIssue[]
  messages: string[]
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
        description: '',
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

export const validateProductForPublish = (product: Product, skus: Sku[]): PublishValidationResult => {
  const productSkus = skus.filter((sku) => sku.productId === product.id)
  const saleableSkus = productSkus.filter((sku) => sku.stock > 0)
  const normalizedSpecs = productSkus.map((sku) => sku.spec.trim()).filter(Boolean)
  const hasDuplicateSpec = normalizedSpecs.length !== new Set(normalizedSpecs).size
  const issues: PublishValidationIssue[] = []

  if (!product.mainImageUrl.trim()) {
    issues.push({ code: 'missing_main_image', message: '缺少主图，无法上架' })
  }

  if (productSkus.length === 0) {
    issues.push({ code: 'missing_sku', message: '没有可售规格，无法上架' })
  } else if (saleableSkus.length === 0) {
    issues.push({ code: 'no_saleable_stock', message: '全部规格暂无库存，请先补库存' })
  }

  if (saleableSkus.some((sku) => sku.salePrice <= 0)) {
    issues.push({ code: 'invalid_sale_price', message: '存在价格为 0 的规格，请先补全售价' })
  }

  if (saleableSkus.some((sku) => !sku.spec.trim())) {
    issues.push({ code: 'empty_spec', message: '存在规格名为空的规格，请先补全规格名' })
  }

  if (hasDuplicateSpec) {
    issues.push({ code: 'duplicate_spec', message: '存在重复规格，请先合并或修改' })
  }

  return {
    canPublish: issues.length === 0,
    issues,
    messages: issues.map((issue) => issue.message),
  }
}

export const canPublishProduct = (product: Product, skus: Sku[]) => {
  return validateProductForPublish(product, skus).canPublish
}
