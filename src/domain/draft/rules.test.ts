import { describe, expect, it } from 'vitest'
import { markDraftCompletion, validateDrafts } from './rules'
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
