import { describe, expect, it } from 'vitest'
import { mockOcrProvider } from './mock-ocr-provider'

describe('mockOcrProvider', () => {
  it('returns PRD draft fields and marks incomplete rows for owner review', async () => {
    const drafts = await mockOcrProvider.recognizeBatch('batch-1', [
      { id: 'image-1', url: '/tmp/filled-yunebao-page.png', name: '已填写商品页' },
      { id: 'image-2', url: '/tmp/spec-page.png', name: '规格页' },
    ])

    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts[0]).toMatchObject({
      productCode: expect.any(String),
      productName: expect.any(String),
      salePrice: expect.any(Number),
      spec: expect.any(String),
      stock: expect.any(Number),
    })
    expect(drafts.some((draft) => draft.status === 'needs_completion')).toBe(true)
  })
})
