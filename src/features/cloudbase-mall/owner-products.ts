import type { Product, ProductStatus } from '../../domain/catalog/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import {
  ownerProductStatusOptions,
  type OwnerProductCommandResult,
  type OwnerProductListItem,
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

  return {
    ...product,
    statusLabel: statusLabels[product.status],
    skuCount: skus.length,
    canPublish: product.status === 'ready_to_publish',
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
  const readyProducts = products.filter((product) => product.status === 'ready_to_publish')

  await Promise.all(readyProducts.map((product) => client.publishProduct(product.id)))
  return { message: `已上架 ${readyProducts.length} 个商品` }
}
