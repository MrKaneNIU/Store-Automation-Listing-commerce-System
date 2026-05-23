import { describe, expect, it } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { getStaffImageTasksView, supplementStaffProductImages } from './staff-image-tasks'

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

const preparePendingProducts = async () => {
  resetMockDb()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
  prepareConfirmableDrafts(batch.id)
  const result = mallWorkflow.confirmBatch(batch.id)

  return { batch, products: result.products }
}

describe('staff image tasks facade', () => {
  it('builds pending-image task lists and batch options', async () => {
    const { batch, products } = await preparePendingProducts()

    const view = getStaffImageTasksView({ keyword: '', selectedBatchId: '' })

    expect(view.batchOptions).toEqual([
      { label: '全部批次', value: '' },
      { label: batch.id, value: batch.id },
    ])
    expect(view.selectedBatchLabel).toBe('全部批次')
    expect(view.products).toHaveLength(products.length)
    expect(view.products[0].statusLabel).toBe('待补图')
  })

  it('filters pending-image products by product code and batch', async () => {
    const { batch, products } = await preparePendingProducts()
    const target = products[0]

    const matched = getStaffImageTasksView({ keyword: target.productCode, selectedBatchId: batch.id })
    const missed = getStaffImageTasksView({ keyword: 'not-a-code', selectedBatchId: batch.id })

    expect(matched.products.map((product) => product.id)).toContain(target.id)
    expect(missed.products).toEqual([])
  })

  it('supplements product images and moves the product to ready-to-publish status', async () => {
    const { products } = await preparePendingProducts()

    const result = await supplementStaffProductImages(products[0].id)
    const nextProduct = mallRepository.listProducts().find((product) => product.id === products[0].id)

    expect(result.message).toBe(`${products[0].productCode} 已补图，状态变为可上架`)
    expect(nextProduct?.status).toBe('ready_to_publish')
    expect(getStaffImageTasksView({ keyword: '', selectedBatchId: '' }).products.map((product) => product.id)).not.toContain(products[0].id)
  })
})
