import type { ProductDraft } from '../../domain/draft/types'
import type { OcrDraftField } from '../../domain/draft/types'
import { markDraftAccepted, markDraftManualCorrection } from '../../domain/draft/rules'
import { findPriceConflictCodes, groupDraftsByProductCode } from '../draft-review/draft-review'
import { mallAccess } from '../mall-workflow/mall-access'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export type OwnerDraftReviewEditableField = OcrDraftField | 'stock'

export type OwnerDraftReviewDraftView = ProductDraft & {
  isNeedsCompletion: boolean
  isLowConfidence: boolean
  isLowConfidenceResolved: boolean
  isAccepted: boolean
  isManuallyCorrected: boolean
  fieldConfidenceLabels: Partial<Record<OcrDraftField, string>>
  fieldSourceLabels: Partial<Record<OcrDraftField, string>>
}

export type OwnerDraftReviewGroupView = {
  productCode: string
  drafts: OwnerDraftReviewDraftView[]
  hasPriceConflict: boolean
}

export type OwnerDraftReviewViewModel = {
  latestBatchId: string | null
  groups: OwnerDraftReviewGroupView[]
  needsCompletionCount: number
  lowConfidenceCount: number
  priceConflictCount: number
  canConfirm: boolean
  emptyMessage: string
}

export type OwnerDraftReviewCommandResult = {
  message: string
  createdProductCount?: number
  createdSkuCount?: number
  nextAction?: 'supplementImages'
}

const noBatchMessage = '暂无 OCR 批次，请先生成草稿'
const noDraftsMessage = '暂无草稿，请先完成截图识别'
const lowConfidenceThreshold = 0.8

const isLowConfidenceResolved = (draft: ProductDraft) =>
  draft.confidence >= lowConfidenceThreshold
  || draft.correctionState === 'manual_corrected'
  || draft.correctionState === 'accepted'

const getLatestBatchDrafts = () => {
  const latestBatch = mallAccess.getLatestBatch()
  const drafts = latestBatch ? mallAccess.listDrafts(latestBatch.id) : []

  return { latestBatch, drafts }
}

const toDraftView = (draft: ProductDraft): OwnerDraftReviewDraftView => ({
  ...draft,
  isNeedsCompletion: draft.status === 'needs_completion',
  isLowConfidence: draft.confidence < lowConfidenceThreshold,
  isLowConfidenceResolved: isLowConfidenceResolved(draft),
  isAccepted: draft.correctionState === 'accepted',
  isManuallyCorrected: draft.correctionState === 'manual_corrected',
  fieldConfidenceLabels: Object.fromEntries(
    Object.entries(draft.fieldConfidence ?? {}).map(([field, confidence]) => [field, `${Math.round(confidence * 100)}%`]),
  ),
  fieldSourceLabels: Object.fromEntries(
    Object.entries(draft.fieldSources ?? {}).map(([field, source]) => [field, source === 'manual' ? 'manual' : 'ocr']),
  ),
})

export const getOwnerDraftReviewView = (): OwnerDraftReviewViewModel => {
  const { latestBatch, drafts } = getLatestBatchDrafts()
  const priceConflictCodes = findPriceConflictCodes(drafts)
  const activeDrafts = drafts.filter((draft) => draft.status !== 'deleted')
  const groups = groupDraftsByProductCode(drafts).map((group) => ({
    productCode: group.productCode,
    drafts: group.drafts.map(toDraftView),
    hasPriceConflict: priceConflictCodes.has(group.productCode),
  }))

  return {
    latestBatchId: latestBatch?.id ?? null,
    groups,
    needsCompletionCount: activeDrafts.filter((draft) => draft.status === 'needs_completion').length,
    lowConfidenceCount: activeDrafts.filter((draft) => draft.confidence < lowConfidenceThreshold).length,
    priceConflictCount: priceConflictCodes.size,
    canConfirm: groups.length > 0,
    emptyMessage: noDraftsMessage,
  }
}

export const updateOwnerDraftReviewDraft = (
  draftId: string,
  field: OwnerDraftReviewEditableField,
  value: string | number,
): OwnerDraftReviewCommandResult => {
  const { latestBatch, drafts } = getLatestBatchDrafts()
  if (!latestBatch) {
    return { message: noBatchMessage }
  }

  const nextDrafts = drafts.map((draft) =>
    draft.id === draftId
      ? field === 'stock'
        ? { ...draft, stock: Number(value) }
        : markDraftManualCorrection(draft, field, value)
      : draft,
  )
  mallAccess.replaceDrafts(latestBatch.id, nextDrafts)

  return { message: '' }
}

export const acceptOwnerDraftReviewDraft = (draftId: string): OwnerDraftReviewCommandResult => {
  const { latestBatch, drafts } = getLatestBatchDrafts()
  if (!latestBatch) {
    return { message: noBatchMessage }
  }

  const nextDrafts = drafts.map((draft) => (draft.id === draftId ? markDraftAccepted(draft) : draft))
  mallAccess.replaceDrafts(latestBatch.id, nextDrafts)

  return { message: '' }
}

export const deleteOwnerDraftReviewDraft = (draftId: string): OwnerDraftReviewCommandResult => {
  const { latestBatch, drafts } = getLatestBatchDrafts()
  if (!latestBatch) {
    return { message: noBatchMessage }
  }

  const nextDrafts = drafts.map((draft) => (draft.id === draftId ? { ...draft, status: 'deleted' as const } : draft))
  mallAccess.replaceDrafts(latestBatch.id, nextDrafts)

  return { message: '' }
}

export const confirmLatestOwnerDraftReviewBatch = (): OwnerDraftReviewCommandResult => {
  const latestBatch = mallAccess.getLatestBatch()
  if (!latestBatch) {
    return { message: noBatchMessage }
  }

  const result = mallWorkflow.confirmBatch(latestBatch.id)
  if (result.issues.length > 0) {
    return { message: `存在 ${result.issues.length} 个必填字段问题，请先补齐草稿` }
  }

  return {
    message: `已创建 ${result.products.length} 个商品、${result.skus.length} 个 SKU`,
    createdProductCount: result.products.length,
    createdSkuCount: result.skus.length,
    ...(result.products.length > 0 ? { nextAction: 'supplementImages' as const } : {}),
  }
}
