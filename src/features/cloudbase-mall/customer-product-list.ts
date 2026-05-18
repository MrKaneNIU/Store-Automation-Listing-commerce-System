import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerProductListViewModel } from '../customer-product-list/customer-product-list'

export const customerProductListLoadFailedMessage = '商品加载失败，请稍后重试'

export const getCloudBaseCustomerProductListView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<CustomerProductListViewModel> => {
  try {
    const { products } = await client.listPublishedProductSummaries()

    return {
      products,
      emptyMessage: products.length === 0 ? '暂无已上架商品' : '',
    }
  } catch {
    return {
      products: [],
      emptyMessage: customerProductListLoadFailedMessage,
    }
  }
}
