import { describe, expect, it } from 'vitest'
import { mockOcrProvider } from './mock-ocr-provider'

describe('mockOcrProvider', () => {
  it('returns PRD draft fields and marks incomplete rows for owner review', async () => {
    const result = await mockOcrProvider.recognizeBatch({
      batchId: 'batch-1',
      images: [
        { id: 'image-1', url: '/tmp/filled-yunebao-page.png', name: 'filled-product-page' },
        { id: 'image-2', url: '/tmp/spec-page.png', name: 'spec-page' },
      ],
      context: {
        jobId: 'job-batch-1',
        requestedAt: '2026-05-19T00:00:00.000Z',
      },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.drafts.length).toBeGreaterThan(0)
    expect(result.drafts[0]).toMatchObject({
      productCode: expect.any(String),
      productName: expect.any(String),
      salePrice: expect.any(Number),
      spec: expect.any(String),
      stock: expect.any(Number),
    })
    expect(result.drafts.some((draft) => draft.status === 'needs_completion')).toBe(true)
  })
})
