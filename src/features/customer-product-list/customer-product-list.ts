import type { Product } from '../../domain/catalog/types'
import { mallAccess } from '../mall-workflow/mall-access'

export type CustomerProductListItem = Product & {
  minPrice: number | '-'
}

export type CustomerProductListViewModel = {
  products: CustomerProductListItem[]
  emptyMessage: string
}

const toListItem = (product: Product): CustomerProductListItem => ({
  ...product,
  minPrice: mallAccess.getMinSkuPrice(product.id),
})

export const getCustomerProductListView = (): CustomerProductListViewModel => {
  const products = mallAccess.listPublishedProducts().map(toListItem)

  return {
    products,
    emptyMessage: products.length === 0 ? '暂无已上架商品' : '',
  }
}
