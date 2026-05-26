import { describe, expect, it } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import {
  clearOwnerProductSkuStock,
  deleteOwnerProduct,
  getOwnerProductsView,
  getOwnerProductSkuInventoryView,
  publishOwnerProduct,
  publishReadyOwnerProducts,
  restockOwnerProductSkus,
  unpublishOwnerProduct,
  updateOwnerProductSku,
  updateOwnerProductDescription,
} from './owner-products'

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
      description: '',
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

    expect(blocked.message).toBe('缺少主图，无法上架')
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

  it('updates product description through the owner product facade', async () => {
    const result = await prepareProducts()

    const updateResult = updateOwnerProductDescription(result.products[0].id, '利落廓形，适合通勤和晚间场景。')
    const refreshed = getOwnerProductsView('all')

    expect(updateResult).toEqual({ message: '商品简介已保存' })
    expect(refreshed.products[0].description).toBe('利落廓形，适合通勤和晚间场景。')
  })

  it('rejects product descriptions over the first-phase length limit', async () => {
    const result = await prepareProducts()

    const updateResult = updateOwnerProductDescription(result.products[0].id, '超'.repeat(121))

    expect(updateResult).toEqual({ message: '商品简介不能超过 120 字' })
    expect(getOwnerProductsView('all').products[0].description).toBe('')
  })

  it('loads a product SKU inventory workbench view', async () => {
    const result = await prepareProducts()

    const view = getOwnerProductSkuInventoryView(result.products[0].id)

    expect(view.product?.id).toBe(result.products[0].id)
    expect(view.skus[0]).toMatchObject({
      id: mallRepository.listSkus(result.products[0].id)[0].id,
      spec: mallRepository.listSkus(result.products[0].id)[0].spec,
      stockStatusLabel: '有库存',
      customerStatusPreview: '可下单',
    })
  })

  it('updates SKU operations data through the owner product facade and writes inventory ledger', async () => {
    const result = await prepareProducts()
    const sku = mallRepository.listSkus(result.products[0].id)[0]

    const updateResult = updateOwnerProductSku(result.products[0].id, sku.id, {
      spec: 'Black/XL',
      salePrice: 139,
      stock: 5,
      reason: '补货入库',
    })
    const refreshedSku = mallRepository.listSkus(result.products[0].id)[0]
    const ledger = mallRepository.listInventoryLedgerEntries(sku.id)

    expect(updateResult).toEqual({ message: '规格库存已保存' })
    expect(refreshedSku).toMatchObject({ spec: 'Black/XL', salePrice: 139, stock: 5 })
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({
      skuId: sku.id,
      action: 'adjust',
      quantityDelta: 3,
      sourceType: 'manual',
      note: '补货入库',
    })
  })

  it('rejects invalid SKU inventory edits without mutating data', async () => {
    const result = await prepareProducts()
    const sku = mallRepository.listSkus(result.products[0].id)[0]

    const updateResult = updateOwnerProductSku(result.products[0].id, sku.id, {
      spec: '',
      salePrice: 0,
      stock: -1,
      reason: '人工纠错',
    })

    expect(updateResult.message).toBe('规格名不能为空')
    expect(mallRepository.listSkus(result.products[0].id)[0]).toEqual(sku)
    expect(mallRepository.listInventoryLedgerEntries(sku.id)).toEqual([])
  })

  it('supports batch restock and clear operations with manual inventory ledger entries', async () => {
    const result = await prepareProducts()
    const skus = mallRepository.listSkus(result.products[0].id)

    const restocked = restockOwnerProductSkus(result.products[0].id, 4, '补货入库')
    const cleared = clearOwnerProductSkuStock(result.products[0].id, '盘点清零')

    expect(restocked).toEqual({ message: `已补货 ${skus.length} 个规格` })
    expect(cleared).toEqual({ message: `已清零 ${skus.length} 个规格` })
    expect(mallRepository.listSkus(result.products[0].id).every((item) => item.stock === 0)).toBe(true)
    skus.forEach((sku) => {
      expect(mallRepository.listInventoryLedgerEntries(sku.id).map((entry) => entry.quantityDelta)).toEqual([4, -(sku.stock + 4)])
    })
  })

  it('surfaces publish block reasons when a ready product has no saleable stock', async () => {
    const result = await prepareProducts()
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    mallWorkflow.clearProductSkuStock(ready, '盘点清零')

    const view = getOwnerProductsView('ready_to_publish')
    const blocked = publishOwnerProduct(ready.id)

    expect(view.products[0]).toMatchObject({
      id: ready.id,
      canPublish: false,
      publishBlockReasons: ['全部规格暂无库存，请先补库存'],
    })
    expect(blocked.message).toBe('全部规格暂无库存，请先补库存')
    expect(mallRepository.listProducts().find((product) => product.id === ready.id)?.status).toBe('ready_to_publish')
  })

  it('batch publishes only ready products that pass the shared publish validation', async () => {
    const result = await prepareProducts()
    const validReadyProduct = await mallWorkflow.supplementProductImages(result.products[0])
    const blockedReadyProduct = await mallWorkflow.supplementProductImages(result.products[1])
    mallWorkflow.clearProductSkuStock(blockedReadyProduct, '盘点清零')

    const viewBefore = getOwnerProductsView('all')
    const publishResult = publishReadyOwnerProducts()
    const products = mallRepository.listProducts()

    expect(viewBefore.readyProductCount).toBe(1)
    expect(publishResult.message).toContain('1')
    expect(products.find((product) => product.id === validReadyProduct.id)?.status).toBe('published')
    expect(products.find((product) => product.id === blockedReadyProduct.id)?.status).toBe('ready_to_publish')
  })

  it('supports owner unpublish and delete product lifecycle operations', async () => {
    const result = await prepareProducts()
    const ready = await mallWorkflow.supplementProductImages(result.products[0])
    publishOwnerProduct(ready.id)

    const unpublished = unpublishOwnerProduct(ready.id)
    expect(unpublished.message).toContain(ready.productCode)
    expect(getOwnerProductsView('ready_to_publish').products.map((item) => item.id)).toContain(ready.id)

    const deleted = deleteOwnerProduct(ready.id)
    expect(deleted.message).toContain(ready.productCode)
    expect(getOwnerProductsView('all').products.map((item) => item.id)).not.toContain(ready.id)
    expect(mallRepository.listSkus(ready.id)).toEqual([])
  })
})
