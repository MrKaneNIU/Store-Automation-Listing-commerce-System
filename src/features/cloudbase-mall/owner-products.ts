import type { Product, ProductStatus } from '../../domain/catalog/types'
import { validateProductForPublish } from '../../domain/catalog/rules'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import {
  ownerProductStatusOptions,
  productDescriptionMaxLength,
  toOwnerSkuInventoryListItem,
  type OwnerProductCommandResult,
  type OwnerProductListItem,
  type OwnerProductSkuInventoryViewModel,
  type OwnerProductSkuUpdateInput,
  type OwnerProductStatusFilter,
  type OwnerProductsViewModel,
} from '../owner-products/owner-products'

const statusLabels: Record<ProductStatus, string> = {
  pending_images: '待补图',
  ready_to_publish: '可上架',
  published: '已上架',
}

const toListItem = async (
  product: Product,
  client: CloudBaseMallApiClient,
): Promise<OwnerProductListItem> => {
  const { skus } = await client.listSkus(product.id)
  const validation = validateProductForPublish(product, skus)

  return {
    ...product,
    statusLabel: statusLabels[product.status],
    skuCount: skus.length,
    canPublish: product.status === 'ready_to_publish' && validation.canPublish,
    publishBlockReasons: validation.canPublish ? [] : validation.messages,
  }
}

export const getCloudBaseOwnerProductsView = async (
  selectedStatus: OwnerProductStatusFilter,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductsViewModel> => {
  const { products } = await client.listProducts()
  const items = await Promise.all(products.map((product) => toListItem(product, client)))
  const filteredProducts = selectedStatus === 'all' ? items : items.filter((product) => product.status === selectedStatus)
  const readyProductCount = items.filter((product) => product.canPublish).length

  return {
    statusOptions: ownerProductStatusOptions,
    products: filteredProducts,
    canBatchPublish: readyProductCount > 0,
    readyProductCount,
    emptyMessage: '当前筛选下暂无商品',
  }
}

export const publishCloudBaseOwnerProduct = async (
  productId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  const { product } = await client.publishProduct(productId)
  return {
    message: product.status === 'published' ? `${product.productCode} 已上架` : `${product.productCode} 暂不可上架`,
  }
}

export const publishReadyCloudBaseOwnerProducts = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  const { products } = await client.listProducts()
  const productItems = await Promise.all(products.map((product) => toListItem(product, client)))
  const readyProducts = productItems.filter((product) => product.canPublish)

  await Promise.all(readyProducts.map((product) => client.publishProduct(product.id)))
  return { message: `已上架 ${readyProducts.length} 个商品` }
}

export const updateCloudBaseOwnerProductDescription = async (
  productId: string,
  description: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  const normalizedDescription = description.trim()
  if (normalizedDescription.length > productDescriptionMaxLength) {
    return { message: `商品简介不能超过 ${productDescriptionMaxLength} 字` }
  }

  await client.updateProductDescription(productId, { description: normalizedDescription })
  return { message: '商品简介已保存' }
}

export const getCloudBaseOwnerProductSkuInventoryView = async (
  productId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductSkuInventoryViewModel> => {
  const { products } = await client.listProducts()
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return {
      product: null,
      skus: [],
      reasonOptions: ['补货入库', '盘点修正', '人工纠错', '盘点清零'],
      emptyMessage: '商品不存在',
    }
  }

  const item = await toListItem(product, client)
  const { skus } = await client.listSkus(product.id)

  return {
    product: item,
    skus: skus.map(toOwnerSkuInventoryListItem),
    reasonOptions: ['补货入库', '盘点修正', '人工纠错', '盘点清零'],
    emptyMessage: '当前商品暂无规格',
  }
}

export const updateCloudBaseOwnerProductSku = async (
  productId: string,
  skuId: string,
  input: OwnerProductSkuUpdateInput,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  await client.updateSku(productId, skuId, {
    spec: input.spec.trim(),
    salePrice: input.salePrice,
    stock: input.stock,
    reason: input.reason.trim() || '人工纠错',
  })
  return { message: '规格库存已保存' }
}

export const restockCloudBaseOwnerProductSkus = async (
  productId: string,
  quantity: number,
  reason: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  const { skus } = await client.restockSkus(productId, { quantity, reason: reason.trim() || '补货入库' })
  return { message: `已补货 ${skus.length} 个规格` }
}

export const clearCloudBaseOwnerProductSkuStock = async (
  productId: string,
  reason: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerProductCommandResult> => {
  const { skus } = await client.clearSkuStock(productId, { reason: reason.trim() || '盘点清零' })
  return { message: `已清零 ${skus.length} 个规格` }
}
