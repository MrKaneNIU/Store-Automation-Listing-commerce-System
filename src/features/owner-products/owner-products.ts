import type { Product, ProductStatus } from '../../domain/catalog/types'
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
}

export type OwnerProductsViewModel = {
  statusOptions: OwnerProductStatusOption[]
  products: OwnerProductListItem[]
  canBatchPublish: boolean
  readyProductCount: number
  emptyMessage: string
}

export type OwnerProductCommandResult = {
  message: string
}

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

const toListItem = (product: Product): OwnerProductListItem => ({
  ...product,
  statusLabel: statusLabels[product.status],
  skuCount: mallAccess.countSkus(product.id),
  canPublish: product.status === 'ready_to_publish',
})

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

  const nextProduct = mallWorkflow.publishProduct(product)
  return {
    message: nextProduct.status === 'published' ? `${nextProduct.productCode} 已上架` : `${nextProduct.productCode} 暂不可上架`,
  }
}

export const publishReadyOwnerProducts = (): OwnerProductCommandResult => {
  const readyProducts = mallAccess.listProductsByStatus('ready_to_publish')
  readyProducts.forEach((product) => {
    mallWorkflow.publishProduct(product)
  })

  return { message: `已上架 ${readyProducts.length} 个商品` }
}
