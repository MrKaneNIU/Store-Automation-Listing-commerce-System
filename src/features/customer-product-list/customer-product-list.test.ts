import { describe, expect, it } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { getCustomerProductListView } from './customer-product-list'

const prepareConfirmableDrafts = (batchId: string) => {
  mallRepository.replaceDrafts(
    batchId,
    mallRepository.listDrafts(batchId).map((draft) => {
      if (draft.status === 'needs_completion') {
        return { ...draft, status: 'deleted' as const }
      }

      if (draft.confidence < 0.8) {
        return { ...draft, correctionState: 'accepted' as const }
      }

      return { ...draft, status: 'confirmed' as const }
    }),
  )
}

const prepareProducts = async () => {
  resetMockDb()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
  prepareConfirmableDrafts(batch.id)
  const result = mallWorkflow.confirmBatch(batch.id)
  const readyProduct = await mallWorkflow.supplementProductImages(result.products[0])
  const publishedProduct = mallWorkflow.publishProduct(readyProduct)

  return { unpublishedProduct: result.products[1], publishedProduct }
}

describe('customer product list ViewModel', () => {
  it('shows only published products with minimum SKU price display', async () => {
    const { unpublishedProduct, publishedProduct } = await prepareProducts()

    const view = getCustomerProductListView()

    expect(view.products.map((product) => product.id)).toEqual([publishedProduct.id])
    expect(view.products.map((product) => product.id)).not.toContain(unpublishedProduct.id)
    expect(view.products[0]).toMatchObject({
      id: publishedProduct.id,
      productCode: publishedProduct.productCode,
      productName: publishedProduct.productName,
      minPrice: mallRepository.listSkus(publishedProduct.id)[0].salePrice,
    })
    expect(view.emptyMessage).toBe('')
  })

  it('returns a stable empty message when no products are published', async () => {
    resetMockDb()

    const view = getCustomerProductListView()

    expect(view.products).toEqual([])
    expect(view.emptyMessage).toBe('暂无已上架商品')
  })
})
