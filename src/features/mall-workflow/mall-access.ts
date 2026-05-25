import type { ProductStatus } from '../../domain/catalog/types'
import { canPublishProduct } from '../../domain/catalog/rules'
import type { ProductDraft } from '../../domain/draft/types'
import { mallRepository } from '../../services/repositories/mall-repository'

export const mallAccess = {
  listBatches() {
    return mallRepository.listBatches()
  },
  getLatestBatch() {
    return mallRepository.listBatches().at(-1)
  },
  listDrafts(batchId?: string) {
    return mallRepository.listDrafts(batchId)
  },
  replaceDrafts(batchId: string, drafts: ProductDraft[]) {
    return mallRepository.replaceDrafts(batchId, drafts)
  },
  listProducts() {
    return mallRepository.listProducts()
  },
  getProduct(productId: string) {
    return mallRepository.listProducts().find((product) => product.id === productId)
  },
  listProductsByStatus(status: ProductStatus) {
    return mallRepository.listProducts().filter((product) => product.status === status)
  },
  listPublishedProducts() {
    return mallAccess
      .listProductsByStatus('published')
      .filter((product) => canPublishProduct(product, mallRepository.listSkus(product.id)))
  },
  listPendingImageProducts() {
    return mallAccess.listProductsByStatus('pending_images')
  },
  listSkus(productId?: string) {
    return mallRepository.listSkus(productId)
  },
  countSkus(productId: string) {
    return mallRepository.listSkus(productId).length
  },
  getMinSkuPrice(productId: string) {
    const prices = mallRepository.listSkus(productId).filter((sku) => sku.stock > 0).map((sku) => sku.salePrice)
    return prices.length > 0 ? Math.min(...prices) : '-'
  },
  listOrders() {
    return mallRepository.listOrders()
  },
}
