import { describe, expect, it } from 'vitest'
import {
  confirmDrafts,
  isLowConfidenceDraftResolved,
  markDraftCompletion,
  markDraftManualCorrection,
  markDraftAccepted,
  validateDrafts,
} from './rules'
import type { ProductDraft } from './types'

const completeDraft: ProductDraft = {
  id: 'draft-1',
  batchId: 'batch-1',
  productCode: 'A1023',
  productName: '圆领针织衫',
  salePrice: 129,
  spec: '黑色/M',
  stock: 1,
  confidence: 0.96,
  sourceImageUrl: '/tmp/source.png',
  status: 'pending',
}

describe('validateDrafts', () => {
  it('requires product code product name sale price and spec before confirmation', () => {
    const issues = validateDrafts([
      {
        ...completeDraft,
        productCode: '',
        productName: '',
        salePrice: 0,
        spec: '',
      },
    ])

    expect(issues.map((issue) => issue.field)).toEqual(['productCode', 'productName', 'salePrice', 'spec'])
  })

  it('blocks low confidence drafts until they are manually corrected or explicitly accepted', () => {
    const issues = validateDrafts([
      {
        ...completeDraft,
        confidence: 0.72,
        correctionState: 'ocr_raw',
      },
    ])

    expect(issues).toEqual([
      expect.objectContaining({
        draftId: 'draft-1',
        field: 'confidence',
      }),
    ])
  })
})

describe('markDraftCompletion', () => {
  it('marks drafts with missing required fields as needs_completion', () => {
    const drafts = markDraftCompletion([
      { ...completeDraft, id: 'draft-1' },
      { ...completeDraft, id: 'draft-2', productCode: '' },
    ])

    expect(drafts[0].status).toBe('pending')
    expect(drafts[1].status).toBe('needs_completion')
  })
})

describe('markDraftManualCorrection', () => {
  it('marks the draft as manually corrected while preserving OCR confidence metadata', () => {
    const corrected = markDraftManualCorrection(
      {
        ...completeDraft,
        fieldConfidence: { productCode: 0.7 },
        fieldSources: { productCode: 'ocr' },
        correctionState: 'ocr_raw',
      },
      'productCode',
      'A1024',
    )

    expect(corrected).toMatchObject({
      productCode: 'A1024',
      correctionState: 'manual_corrected',
      fieldConfidence: { productCode: 0.7 },
      fieldSources: { productCode: 'ocr' },
    })
  })
})

describe('low confidence resolution', () => {
  it('allows explicitly accepted low confidence drafts to pass confirmation', () => {
    const accepted = markDraftAccepted({
      ...completeDraft,
      confidence: 0.74,
    })

    expect(isLowConfidenceDraftResolved(accepted)).toBe(true)
    expect(validateDrafts([accepted])).toEqual([])
  })
})

describe('confirmDrafts', () => {
  it('keeps deleted drafts deleted and does not require deleted draft fields', () => {
    const result = confirmDrafts([
      { ...completeDraft, id: 'draft-1' },
      {
        ...completeDraft,
        id: 'draft-2',
        productCode: '',
        productName: '',
        salePrice: 0,
        spec: '',
        status: 'deleted',
      },
    ])

    expect(result.issues).toEqual([])
    expect(result.drafts.map((draft) => draft.status)).toEqual(['confirmed', 'deleted'])
  })

  it('moves incomplete active drafts to needs_completion instead of confirming them', () => {
    const result = confirmDrafts([{ ...completeDraft, productCode: '' }])

    expect(result.issues.map((issue) => issue.field)).toEqual(['productCode'])
    expect(result.drafts[0].status).toBe('needs_completion')
  })
})
