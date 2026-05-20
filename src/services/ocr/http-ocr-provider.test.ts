import { describe, expect, it, vi } from 'vitest'

import { createHttpOcrProvider } from './http-ocr-provider'

const input = {
  batchId: 'batch-1',
  images: [{ id: 'image-1', url: 'cloud://page-1.png', name: 'page' }],
  context: {
    jobId: 'job-batch-1',
    requestedAt: '2026-05-19T00:00:00.000Z',
  },
}

const createResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('http OCR provider', () => {
  it('maps provider rows to review drafts without touching products SKUs or orders', async () => {
    const fetchImpl = vi.fn(async () =>
      createResponse(200, {
        drafts: [
          {
            product_code: 'A1023',
            product_name: 'Cotton Shirt',
            sale_price: 129,
            spec: 'Black/M',
            confidence: 0.92,
            field_confidence: {
              productCode: 0.91,
              productName: 0.9,
              salePrice: 0.88,
              spec: 0.87,
            },
            field_sources: {
              productCode: 'ocr',
              productName: 'ocr',
              salePrice: 'ocr',
              spec: 'ocr',
            },
          },
        ],
      }),
    ) as unknown as typeof fetch
    const provider = createHttpOcrProvider({
      provider: 'http',
      endpoint: 'https://ocr.example.test/recognize',
      apiKey: 'secret-from-env',
      fetchImpl,
    })

    const result = await provider.recognizeBatch(input)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.drafts).toEqual([
      expect.objectContaining({
        batchId: 'batch-1',
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        salePrice: 129,
        spec: 'Black/M',
        sourceImageUrl: 'cloud://page-1.png',
        correctionState: 'ocr_raw',
        fieldConfidence: {
          productCode: 0.91,
          productName: 0.9,
          salePrice: 0.88,
          spec: 0.87,
        },
      }),
    ])
    expect(JSON.stringify(result)).not.toContain('products')
    expect(JSON.stringify(result)).not.toContain('skus')
    expect(JSON.stringify(result)).not.toContain('orders')
  })

  it('returns recoverable errors for configuration, rate limit, service, timeout, and invalid response failures', async () => {
    await expect(createHttpOcrProvider({ provider: '', endpoint: '', apiKey: '' }).recognizeBatch(input)).resolves.toEqual({
      ok: false,
      error: {
        code: 'configuration_error',
        message: 'OCR provider production configuration is incomplete',
        recoverable: true,
      },
    })

    await expect(createHttpOcrProvider({
      provider: 'http',
      endpoint: 'https://ocr.example.test/recognize',
      apiKey: 'secret-from-env',
      fetchImpl: vi.fn(async () => createResponse(429, {})) as unknown as typeof fetch,
    }).recognizeBatch(input)).resolves.toMatchObject({ ok: false, error: { code: 'rate_limited', recoverable: true } })

    await expect(createHttpOcrProvider({
      provider: 'http',
      endpoint: 'https://ocr.example.test/recognize',
      apiKey: 'secret-from-env',
      fetchImpl: vi.fn(async () => createResponse(500, {})) as unknown as typeof fetch,
    }).recognizeBatch(input)).resolves.toMatchObject({ ok: false, error: { code: 'service_error', recoverable: true } })

    await expect(createHttpOcrProvider({
      provider: 'http',
      endpoint: 'https://ocr.example.test/recognize',
      apiKey: 'secret-from-env',
      fetchImpl: vi.fn(async () => createResponse(200, { rows: [] })) as unknown as typeof fetch,
    }).recognizeBatch(input)).resolves.toMatchObject({ ok: false, error: { code: 'invalid_response', recoverable: true } })

    await expect(createHttpOcrProvider({
      provider: 'http',
      endpoint: 'https://ocr.example.test/recognize',
      apiKey: 'secret-from-env',
      timeoutMs: 1,
      fetchImpl: vi.fn((_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })) as unknown as typeof fetch,
    }).recognizeBatch(input)).resolves.toMatchObject({ ok: false, error: { code: 'timeout', recoverable: true } })
  })
})
