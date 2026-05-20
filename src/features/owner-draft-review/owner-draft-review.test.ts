import { describe, expect, it } from 'vitest'
import type { ProductDraft } from '../../domain/draft/types'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import {
  confirmLatestOwnerDraftReviewBatch,
  deleteOwnerDraftReviewDraft,
  getOwnerDraftReviewView,
  updateOwnerDraftReviewDraft,
} from './owner-draft-review'

const prepareBatch = async () => {
  resetMockDb()
  return mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
}

const replaceDrafts = (batchId: string, drafts: ProductDraft[]) => {
  mallRepository.replaceDrafts(batchId, drafts)
}

describe('owner draft review ViewModel', () => {
  it('returns an empty review model when no OCR batch exists', () => {
    resetMockDb()

    const view = getOwnerDraftReviewView()

    expect(view).toEqual({
      latestBatchId: null,
      groups: [],
      needsCompletionCount: 0,
      lowConfidenceCount: 0,
      priceConflictCount: 0,
      canConfirm: false,
      emptyMessage: '暂无草稿，请先完成截图识别',
    })
  })

  it('groups active drafts and keeps warnings in the ViewModel', async () => {
    const { batch } = await prepareBatch()
    const drafts = mallRepository.listDrafts(batch.id)
    replaceDrafts(batch.id, [
      { ...drafts[0], id: 'draft-1', productCode: 'A1023', salePrice: 129, spec: 'Black/M' },
      { ...drafts[0], id: 'draft-2', productCode: 'A1023', salePrice: 139, spec: 'White/L', confidence: 0.72 },
      { ...drafts[0], id: 'draft-3', productCode: 'B2088', salePrice: 88, spec: 'Blue/S', status: 'deleted' },
    ])

    const view = getOwnerDraftReviewView()

    expect(view.latestBatchId).toBe(batch.id)
    expect(view.groups).toHaveLength(1)
    expect(view.groups[0]).toMatchObject({ productCode: 'A1023', hasPriceConflict: true })
    expect(view.groups[0].drafts.map((draft) => draft.id)).toEqual(['draft-1', 'draft-2'])
    expect(view.groups[0].drafts[1]).toMatchObject({ isLowConfidence: true, isNeedsCompletion: false })
    expect(view.lowConfidenceCount).toBe(1)
    expect(view.priceConflictCount).toBe(1)
  })

  it('updates draft fields through the feature entry point', async () => {
    const { batch } = await prepareBatch()
    const draft = mallRepository.listDrafts(batch.id)[0]

    const result = updateOwnerDraftReviewDraft(draft.id, 'productName', 'Updated Product')

    expect(result.message).toBe('')
    expect(mallRepository.listDrafts(batch.id)[0].productName).toBe('Updated Product')
    expect(mallRepository.listDrafts(batch.id)[0].correctionState).toBe('manual_corrected')
  })

  it('exposes field confidence, sources, and manual correction markers in the ViewModel', async () => {
    const { batch } = await prepareBatch()
    const draft = mallRepository.listDrafts(batch.id)[0]
    replaceDrafts(batch.id, [{
      ...draft,
      fieldConfidence: { productCode: 0.71, productName: 0.93 },
      fieldSources: { productCode: 'ocr', productName: 'manual' },
      correctionState: 'manual_corrected',
    }])

    const view = getOwnerDraftReviewView()

    expect(view.groups[0].drafts[0]).toMatchObject({
      isManuallyCorrected: true,
      fieldConfidenceLabels: { productCode: '71%', productName: '93%' },
      fieldSourceLabels: { productCode: 'ocr', productName: 'manual' },
    })
  })

  it('marks deleted drafts so they do not create products on confirmation', async () => {
    const { batch } = await prepareBatch()
    const draft = mallRepository.listDrafts(batch.id)[0]
    replaceDrafts(batch.id, [draft])

    deleteOwnerDraftReviewDraft(draft.id)
    const result = confirmLatestOwnerDraftReviewBatch()

    expect(result.message).toBe('已创建 0 个商品、0 个 SKU')
    expect(mallRepository.listProducts()).toHaveLength(0)
    expect(mallRepository.listSkus()).toHaveLength(0)
  })

  it('blocks confirmation when required draft fields are missing and marks the draft for completion', async () => {
    const { batch } = await prepareBatch()
    const draft = mallRepository.listDrafts(batch.id)[0]
    updateOwnerDraftReviewDraft(draft.id, 'productCode', '')

    const result = confirmLatestOwnerDraftReviewBatch()
    const nextDraft = mallRepository.listDrafts(batch.id)[0]
    const view = getOwnerDraftReviewView()

    expect(result.message).toBe('存在 1 个必填字段问题，请先补齐草稿')
    expect(nextDraft.status).toBe('needs_completion')
    expect(view.needsCompletionCount).toBe(1)
    expect(view.groups[0].drafts[0].isNeedsCompletion).toBe(true)
    expect(mallRepository.listProducts()).toHaveLength(0)
  })

  it('confirms complete drafts and duplicate confirmation does not create duplicate products or SKUs', async () => {
    const { batch } = await prepareBatch()
    const draft = mallRepository.listDrafts(batch.id)[0]
    replaceDrafts(batch.id, [{ ...draft, status: 'pending' as const }])

    const firstResult = confirmLatestOwnerDraftReviewBatch()
    const secondResult = confirmLatestOwnerDraftReviewBatch()

    expect(firstResult.message).toBe('已创建 1 个商品、1 个 SKU')
    expect(secondResult.message).toBe('已创建 0 个商品、0 个 SKU')
    expect(mallRepository.listProducts()).toHaveLength(1)
    expect(mallRepository.listSkus()).toHaveLength(1)
  })
})
