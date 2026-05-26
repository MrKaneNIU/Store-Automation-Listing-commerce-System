import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { resolveProductImageFields } from '../../services/storage/product-image-url'
import { uploadService } from '../../services/storage/runtime-upload-service'
import type { CustomerProductListViewModel } from '../customer-product-list/customer-product-list'

export const customerProductListLoadFailedMessage = '商品加载失败，请稍后重试'

export const getCloudBaseCustomerProductListView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<CustomerProductListViewModel> => {
  try {
    const { products } = await client.listPublishedProductSummaries()
    const renderableProducts = await Promise.all(
      products.map((product) => resolveProductImageFields(product, uploadService)),
    )

    return {
      products: renderableProducts,
      emptyMessage: renderableProducts.length === 0 ? '暂无已上架商品' : '',
    }
  } catch {
    return {
      products: [],
      emptyMessage: customerProductListLoadFailedMessage,
    }
  }
}
