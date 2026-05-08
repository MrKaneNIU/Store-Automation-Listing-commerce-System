import { describe, expect, it } from 'vitest'
import type { ProductDraft } from '../../domain/draft/types'
import { findPriceConflictCodes, groupDraftsByProductCode } from './draft-review'

const createDraft = (params: Partial<ProductDraft>): ProductDraft => ({
  id: params.id ?? 'draft-1',
  batchId: params.batchId ?? 'batch-1',
  productCode: params.productCode ?? 'A1023',
  productName: params.productName ?? 'Test Product',
  salePrice: params.salePrice ?? 129,
  spec: params.spec ?? 'Black/M',
  stock: params.stock ?? 1,
  confidence: params.confidence ?? 0.96,
  sourceImageUrl: params.sourceImageUrl ?? '/tmp/source.png',
  status: params.status ?? 'pending',
})

describe('groupDraftsByProductCode', () => {
  it('groups active drafts by trimmed product code and preserves draft order inside each group', () => {
    const aDraft = createDraft({ id: 'draft-1', productCode: ' A1023 ', spec: 'Black/M' })
    const bDraft = createDraft({ id: 'draft-2', productCode: 'B2088', spec: 'Blue/S' })
    const secondADraft = createDraft({ id: 'draft-3', productCode: 'A1023', spec: 'White/L' })

    const groups = groupDraftsByProductCode([aDraft, bDraft, secondADraft])

    expect(groups).toEqual([
      { productCode: 'A1023', drafts: [aDraft, secondADraft] },
      { productCode: 'B2088', drafts: [bDraft] },
    ])
  })

  it('filters deleted drafts and groups blank product codes under the fallback bucket', () => {
    const blankCodeDraft = createDraft({ id: 'draft-1', productCode: '   ' })
    const deletedDraft = createDraft({ id: 'draft-2', productCode: 'A1023', status: 'deleted' })

    const groups = groupDraftsByProductCode([blankCodeDraft, deletedDraft])

    expect(groups).toHaveLength(1)
    expect(groups[0].productCode).toBeTruthy()
    expect(groups[0].drafts).toEqual([blankCodeDraft])
  })
})

describe('findPriceConflictCodes', () => {
  it('returns product codes whose active drafts have more than one sale price', () => {
    const conflictA = createDraft({ id: 'draft-1', productCode: 'A1023', salePrice: 129 })
    const conflictB = createDraft({ id: 'draft-2', productCode: 'A1023', salePrice: 139 })
    const stableA = createDraft({ id: 'draft-3', productCode: 'B2088', salePrice: 169 })
    const stableB = createDraft({ id: 'draft-4', productCode: 'B2088', salePrice: 169 })

    expect(findPriceConflictCodes([conflictA, conflictB, stableA, stableB])).toEqual(new Set(['A1023']))
  })

  it('ignores deleted drafts and blank product codes when detecting price conflicts', () => {
    const activeDraft = createDraft({ id: 'draft-1', productCode: 'A1023', salePrice: 129 })
    const deletedConflictingDraft = createDraft({ id: 'draft-2', productCode: 'A1023', salePrice: 139, status: 'deleted' })
    const blankCodeA = createDraft({ id: 'draft-3', productCode: '', salePrice: 99 })
    const blankCodeB = createDraft({ id: 'draft-4', productCode: '', salePrice: 109 })

    expect(findPriceConflictCodes([activeDraft, deletedConflictingDraft, blankCodeA, blankCodeB])).toEqual(new Set())
  })
})
