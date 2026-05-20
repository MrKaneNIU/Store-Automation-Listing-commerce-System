import type { DraftValidationIssue, OcrDraftField, ProductDraft } from './types'

export const ocrDraftFields: OcrDraftField[] = ['productCode', 'productName', 'salePrice', 'spec']

export const validateDrafts = (drafts: ProductDraft[]) => {
  const issues: DraftValidationIssue[] = []

  drafts
    .filter((draft) => draft.status !== 'deleted')
    .forEach((draft) => {
      if (!draft.productCode.trim()) {
        issues.push({ draftId: draft.id, field: 'productCode', message: '商品货号不能为空' })
      }
      if (!draft.productName.trim()) {
        issues.push({ draftId: draft.id, field: 'productName', message: '商品名称不能为空' })
      }
      if (draft.salePrice <= 0) {
        issues.push({ draftId: draft.id, field: 'salePrice', message: '销售价必须大于 0' })
      }
      if (!draft.spec.trim()) {
        issues.push({ draftId: draft.id, field: 'spec', message: '规格不能为空' })
      }
    })

  return issues
}

export const markDraftCompletion = (drafts: ProductDraft[]) => {
  const issueDraftIds = new Set(validateDrafts(drafts).map((issue) => issue.draftId))
  return drafts.map((draft) => {
    if (draft.status === 'deleted') {
      return draft
    }
    return issueDraftIds.has(draft.id) ? { ...draft, status: 'needs_completion' as const } : { ...draft, status: 'pending' as const }
  })
}

export const markDraftManualCorrection = (
  draft: ProductDraft,
  field: OcrDraftField,
  value: string | number,
): ProductDraft => ({
  ...draft,
  [field]: value,
  correctionState: 'manual_corrected',
})

export const confirmDrafts = (drafts: ProductDraft[]) => {
  const issues = validateDrafts(drafts)
  if (issues.length > 0) {
    return { drafts: markDraftCompletion(drafts), issues }
  }

  return {
    drafts: drafts.map((draft) => (draft.status === 'deleted' ? draft : { ...draft, status: 'confirmed' as const })),
    issues,
  }
}
