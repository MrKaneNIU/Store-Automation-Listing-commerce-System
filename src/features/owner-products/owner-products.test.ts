import { describe, expect, it } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { getOwnerProductsView, publishOwnerProduct, publishReadyOwnerProducts } from './owner-products'

const prepareProducts = async () => {
  resetMockDb()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
  mallRepository.replaceDrafts(
    batch.id,
    mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
  )
  return mallWorkflow.confirmBatch(batch.id)
}

describe('owner products facade', () => {
  it('builds filtered product display models with status labels and SKU counts', async () => {
    const result = await prepareProducts()

    const allView = getOwnerProductsView('all')
    const pendingView = getOwnerProductsView('pending_images')

    expect(allView.statusOptions.map((option) => option.value)).toEqual(['all', 'pending_images', 'ready_to_publish', 'published'])
    expect(allView.products).toHaveLength(result.products.length)
    expect(allView.products[0]).toMatchObject({
      statusLabel: '待补图',
      canPublish: false,
      skuCount: mallRepository.listSkus(result.products[0].id).length,
    })
    expect(pendingView.products).toHaveLength(result.products.length)
  })

  it('keeps publish eligibility behind workflow rules', async () => {
    const result = await prepareProducts()

    const blocked = publishOwnerProduct(result.products[0].id)
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    const published = publishOwnerProduct(ready.id)

    expect(blocked.message).toBe(`${result.products[0].productCode} 暂不可上架`)
    expect(published.message).toBe(`${ready.productCode} 已上架`)
    expect(mallRepository.listProducts().find((product) => product.id === ready.id)?.status).toBe('published')
  })

  it('batch publishes only ready products', async () => {
    const result = await prepareProducts()
    await mallWorkflow.supplementProductImages(result.products[0])

    const viewBefore = getOwnerProductsView('all')
    const publishResult = publishReadyOwnerProducts()
    const statuses = mallRepository.listProducts().map((product) => product.status)

    expect(viewBefore.readyProductCount).toBe(1)
    expect(publishResult.message).toBe('已上架 1 个商品')
    expect(statuses).toContain('published')
    expect(statuses).toContain('pending_images')
  })
})
