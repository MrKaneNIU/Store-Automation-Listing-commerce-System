import type { Product } from '../../domain/catalog/types'
import { createStaticProductImageView, type ProductImageViewModel } from '../../services/storage/product-image-url'
import { mallAccess } from '../mall-workflow/mall-access'

export type CustomerProductListItem = Product & ProductImageViewModel & {
  minPrice: number | '-'
}

export type CustomerProductListViewModel = {
  products: CustomerProductListItem[]
  emptyMessage: string
}

const toListItem = (product: Product): CustomerProductListItem => ({
  ...product,
  ...createStaticProductImageView(product),
  minPrice: mallAccess.getMinSkuPrice(product.id),
})

export const getCustomerProductListView = (): CustomerProductListViewModel => {
  const products = mallAccess.listPublishedProducts().map(toListItem)

  return {
    products,
    emptyMessage: products.length === 0 ? '暂无已上架商品' : '',
  }
}
