import type { Product, ProductStatus, Sku } from '../../domain/catalog/types'
import { validateProductForPublish } from '../../domain/catalog/rules'
import { mallAccess } from '../mall-workflow/mall-access'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export type OwnerProductStatusFilter = 'all' | ProductStatus

export type OwnerProductStatusOption = {
  label: string
  value: OwnerProductStatusFilter
}

export type OwnerProductListItem = Product & {
  statusLabel: string
  skuCount: number
  canPublish: boolean
  publishBlockReasons: string[]
}

export type OwnerSkuInventoryListItem = Sku & {
  stockStatusLabel: string
  customerStatusPreview: string
}

export type OwnerProductsViewModel = {
  statusOptions: OwnerProductStatusOption[]
  products: OwnerProductListItem[]
  canBatchPublish: boolean
  readyProductCount: number
  emptyMessage: string
}

export type OwnerProductSkuInventoryViewModel = {
  product: OwnerProductListItem | null
  skus: OwnerSkuInventoryListItem[]
  reasonOptions: string[]
  emptyMessage: string
}

export type OwnerProductCommandResult = {
  message: string
}

export type OwnerProductSkuUpdateInput = {
  spec: string
  salePrice: number
  stock: number
  reason: string
}

export const productDescriptionMaxLength = 120

export const ownerInventoryReasonOptions = ['补货入库', '盘点修正', '人工纠错', '盘点清零']

export const ownerProductStatusOptions: OwnerProductStatusOption[] = [
  { label: '全部', value: 'all' },
  { label: '待补图', value: 'pending_images' },
  { label: '可上架', value: 'ready_to_publish' },
  { label: '已上架', value: 'published' },
]

const statusLabels: Record<ProductStatus, string> = {
  pending_images: '待补图',
  ready_to_publish: '可上架',
  published: '已上架',
}

const toListItem = (product: Product): OwnerProductListItem => {
  const skus = mallAccess.listSkus(product.id)
  const validation = validateProductForPublish(product, skus)

  return {
    ...product,
    statusLabel: statusLabels[product.status],
    skuCount: skus.length,
    canPublish: product.status === 'ready_to_publish' && validation.canPublish,
    publishBlockReasons: validation.canPublish ? [] : validation.messages,
  }
}

export const toOwnerSkuInventoryListItem = (sku: Sku): OwnerSkuInventoryListItem => ({
  ...sku,
  stockStatusLabel: sku.stock > 0 ? '有库存' : '售罄',
  customerStatusPreview: sku.stock > 0 ? '可下单' : '可查看，不可下单',
})

const findProduct = (productId: string) => mallAccess.getProduct(productId)

const findSku = (productId: string, skuId: string) =>
  mallAccess.listSkus(productId).find((sku) => sku.id === skuId)

const validateReason = (reason: string): string => {
  const normalizedReason = reason.trim()
  return normalizedReason || '人工纠错'
}

const validateSkuUpdateInput = (input: OwnerProductSkuUpdateInput): OwnerProductCommandResult | null => {
  if (!input.spec.trim()) {
    return { message: '规格名不能为空' }
  }
  if (!Number.isFinite(input.salePrice) || input.salePrice <= 0) {
    return { message: '售价必须大于 0' }
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { message: '库存不能小于 0' }
  }

  return null
}

export const getOwnerProductsView = (selectedStatus: OwnerProductStatusFilter): OwnerProductsViewModel => {
  const products = mallAccess.listProducts().map(toListItem)
  const filteredProducts = selectedStatus === 'all' ? products : products.filter((product) => product.status === selectedStatus)
  const readyProductCount = products.filter((product) => product.canPublish).length

  return {
    statusOptions: ownerProductStatusOptions,
    products: filteredProducts,
    canBatchPublish: readyProductCount > 0,
    readyProductCount,
    emptyMessage: '当前筛选下暂无商品',
  }
}

export const publishOwnerProduct = (productId: string): OwnerProductCommandResult => {
  const product = mallAccess.getProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }

  const validation = validateProductForPublish(product, mallAccess.listSkus(product.id))
  if (!validation.canPublish) {
    return { message: validation.messages[0] ?? '商品暂不可上架' }
  }

  const nextProduct = mallWorkflow.publishProduct(product)
  return {
    message: nextProduct.status === 'published' ? `${nextProduct.productCode} 已上架` : `${nextProduct.productCode} 暂不可上架`,
  }
}

export const publishReadyOwnerProducts = (): OwnerProductCommandResult => {
  const readyProducts = mallAccess
    .listProductsByStatus('ready_to_publish')
    .filter((product) => validateProductForPublish(product, mallAccess.listSkus(product.id)).canPublish)
  readyProducts.forEach((product) => {
    mallWorkflow.publishProduct(product)
  })

  return { message: `已上架 ${readyProducts.length} 个商品` }
}

export const updateOwnerProductDescription = (
  productId: string,
  description: string,
): OwnerProductCommandResult => {
  const product = mallAccess.getProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }

  const normalizedDescription = description.trim()
  if (normalizedDescription.length > productDescriptionMaxLength) {
    return { message: `商品简介不能超过 ${productDescriptionMaxLength} 字` }
  }

  mallWorkflow.updateProductDescription(product, normalizedDescription)
  return { message: '商品简介已保存' }
}

export const getOwnerProductSkuInventoryView = (productId: string): OwnerProductSkuInventoryViewModel => {
  const product = findProduct(productId)
  if (!product) {
    return {
      product: null,
      skus: [],
      reasonOptions: ownerInventoryReasonOptions,
      emptyMessage: '商品不存在',
    }
  }

  const skus = mallAccess.listSkus(product.id).map(toOwnerSkuInventoryListItem)

  return {
    product: toListItem(product),
    skus,
    reasonOptions: ownerInventoryReasonOptions,
    emptyMessage: '当前商品暂无规格',
  }
}

export const updateOwnerProductSku = (
  productId: string,
  skuId: string,
  input: OwnerProductSkuUpdateInput,
): OwnerProductCommandResult => {
  const product = findProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }

  const sku = findSku(product.id, skuId)
  if (!sku) {
    return { message: '规格不存在' }
  }

  const validationResult = validateSkuUpdateInput(input)
  if (validationResult) {
    return validationResult
  }

  mallWorkflow.updateSkuOperationsData(sku, {
    spec: input.spec.trim(),
    salePrice: input.salePrice,
    stock: input.stock,
    reason: validateReason(input.reason),
  })
  return { message: '规格库存已保存' }
}

export const restockOwnerProductSkus = (
  productId: string,
  quantity: number,
  reason: string,
): OwnerProductCommandResult => {
  const product = findProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { message: '补货数量必须大于 0' }
  }

  const skus = mallWorkflow.restockProductSkus(product, quantity, validateReason(reason))
  return { message: `已补货 ${skus.length} 个规格` }
}

export const clearOwnerProductSkuStock = (
  productId: string,
  reason: string,
): OwnerProductCommandResult => {
  const product = findProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }

  const skus = mallWorkflow.clearProductSkuStock(product, validateReason(reason))
  return { message: `已清零 ${skus.length} 个规格` }
}
