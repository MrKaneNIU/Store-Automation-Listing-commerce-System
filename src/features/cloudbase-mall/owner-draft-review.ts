import type { ProductDraft } from '../../domain/draft/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { findPriceConflictCodes, groupDraftsByProductCode } from '../draft-review/draft-review'
import type {
  OwnerDraftReviewCommandResult,
  OwnerDraftReviewDraftView,
  OwnerDraftReviewEditableField,
  OwnerDraftReviewViewModel,
} from '../owner-draft-review/owner-draft-review'

const noBatchMessage = '暂无 OCR 批次，请先生成草稿'
const noDraftsMessage = '暂无草稿，请先完成截图识别'
const lowConfidenceThreshold = 0.8

const isLowConfidenceResolved = (draft: ProductDraft) =>
  draft.confidence >= lowConfidenceThreshold
  || draft.correctionState === 'manual_corrected'
  || draft.correctionState === 'accepted'

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

export const getCloudBaseOwnerDraftReviewView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDraftReviewViewModel> => {
  const { batch, drafts } = await client.getLatestDrafts()
  const priceConflictCodes = findPriceConflictCodes(drafts)
  const activeDrafts = drafts.filter((draft) => draft.status !== 'deleted')
  const groups = groupDraftsByProductCode(drafts).map((group) => ({
    productCode: group.productCode,
    drafts: group.drafts.map(toDraftView),
    hasPriceConflict: priceConflictCodes.has(group.productCode),
  }))

  return {
    latestBatchId: batch?.id ?? null,
    groups,
    needsCompletionCount: activeDrafts.filter((draft) => draft.status === 'needs_completion').length,
    lowConfidenceCount: activeDrafts.filter((draft) => draft.confidence < lowConfidenceThreshold).length,
    priceConflictCount: priceConflictCodes.size,
    canConfirm: groups.length > 0,
    emptyMessage: noDraftsMessage,
  }
}

export const updateCloudBaseOwnerDraftReviewDraft = async (
  draftId: string,
  field: OwnerDraftReviewEditableField,
  value: string | number,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDraftReviewCommandResult> => {
  if (!draftId) {
    return { message: noBatchMessage }
  }

  await client.updateDraft(draftId, {
    [field]: value,
    ...(field === 'stock' ? {} : { correctionState: 'manual_corrected' as const }),
  })
  return { message: '' }
}

export const acceptCloudBaseOwnerDraftReviewDraft = async (
  draftId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDraftReviewCommandResult> => {
  if (!draftId) {
    return { message: noBatchMessage }
  }

  await client.updateDraft(draftId, {
    correctionState: 'accepted',
  })
  return { message: '' }
}

export const deleteCloudBaseOwnerDraftReviewDraft = async (
  draftId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDraftReviewCommandResult> => {
  if (!draftId) {
    return { message: noBatchMessage }
  }

  await client.deleteDraft(draftId)
  return { message: '' }
}

export const confirmLatestCloudBaseOwnerDraftReviewBatch = async (
  latestBatchId: string | null,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDraftReviewCommandResult> => {
  if (!latestBatchId) {
    return { message: noBatchMessage }
  }

  const result = await client.confirmBatch(latestBatchId)
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
