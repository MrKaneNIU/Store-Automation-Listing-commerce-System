import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerProductListViewModel } from '../customer-product-list/customer-product-list'

export const getCloudBaseCustomerProductListView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<CustomerProductListViewModel> => {
  const { products } = await client.listPublishedProductSummaries()

  return {
    products,
    emptyMessage: products.length === 0 ? '暂无已上架商品' : '',
  }
}
