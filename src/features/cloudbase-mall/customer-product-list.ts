import type { Product } from '../../domain/catalog/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerProductListItem, CustomerProductListViewModel } from '../customer-product-list/customer-product-list'

const toListItem = async (
  product: Product,
  client: CloudBaseMallApiClient,
): Promise<CustomerProductListItem> => {
  const { skus } = await client.listSkus(product.id)
  const prices = skus.map((sku) => sku.salePrice)

  return {
    ...product,
    minPrice: prices.length > 0 ? Math.min(...prices) : '-',
  }
}

export const getCloudBaseCustomerProductListView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<CustomerProductListViewModel> => {
  const { products } = await client.listPublishedProducts()
  const items = await Promise.all(products.map((product) => toListItem(product, client)))

  return {
    products: items,
    emptyMessage: items.length === 0 ? '暂无已上架商品' : '',
  }
}
