import { describe, expect, it, vi } from 'vitest'

import type { TencentCloudOcrClient } from './tencentcloud-ocr-provider'
import { createTencentCloudOcrProvider } from './tencentcloud-ocr-provider'

const input = {
  batchId: 'batch-1',
  images: [{ id: 'image-1', url: 'https://example.test/page-1.png', name: 'page' }],
  context: {
    jobId: 'job-batch-1',
    requestedAt: '2026-05-19T00:00:00.000Z',
  },
}

const createClient = (response: unknown): TencentCloudOcrClient => ({
  GeneralBasicOCR: vi.fn(async () => response) as TencentCloudOcrClient['GeneralBasicOCR'],
})

const createProvider = (client: TencentCloudOcrClient, resolveImageUrl?: (assetId: string) => Promise<string> | string) =>
  createTencentCloudOcrProvider({
    endpoint: 'https://ocr.tencentcloudapi.com',
    secretId: 'AKIDEXAMPLE',
    secretKey: 'SECRETEXAMPLE',
    region: 'ap-guangzhou',
    timeoutMs: 10_000,
    client,
    resolveImageUrl,
  })

describe('Tencent Cloud OCR provider', () => {
  it('uses GeneralBasicOCR ImageUrl and maps text lines to review drafts', async () => {
    const client = createClient({
      Response: {
        TextDetections: [
          { DetectedText: 'productCode A1023', Confidence: 99 },
          { DetectedText: 'productName Cotton Shirt', Confidence: 98 },
          { DetectedText: 'salePrice 129', Confidence: 96 },
          { DetectedText: 'spec Black/M', Confidence: 95 },
        ],
      },
    })

    const result = await createProvider(client).recognizeBatch(input)

    expect(client.GeneralBasicOCR).toHaveBeenCalledTimes(1)
    expect(client.GeneralBasicOCR).toHaveBeenCalledWith({ ImageUrl: 'https://example.test/page-1.png' })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.drafts).toEqual([
      expect.objectContaining({
        batchId: 'batch-1',
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        salePrice: 129,
        spec: 'Black/M',
        confidence: 0.95,
        sourceImageUrl: 'https://example.test/page-1.png',
        fieldConfidence: {
          productCode: 0.99,
          productName: 0.98,
          salePrice: 0.96,
          spec: 0.95,
        },
        fieldSources: {
          productCode: 'ocr',
          productName: 'ocr',
          salePrice: 'ocr',
          spec: 'ocr',
        },
        correctionState: 'ocr_raw',
      }),
    ])
    expect(JSON.stringify(result)).not.toContain('products')
    expect(JSON.stringify(result)).not.toContain('orders')
  })

  it('extracts fields when labels and values are split across adjacent OCR lines', async () => {
    const client = createClient({
      Response: {
        TextDetections: [
          { DetectedText: 'productCode', Confidence: 100 },
          { DetectedText: '122334', Confidence: 100 },
          { DetectedText: 'productName', Confidence: 100 },
          { DetectedText: 'Shirt', Confidence: 100 },
          { DetectedText: 'salePrice', Confidence: 100 },
          { DetectedText: '666', Confidence: 100 },
          { DetectedText: 'spec', Confidence: 100 },
          { DetectedText: 'Black/XL', Confidence: 100 },
        ],
      },
    })

    const result = await createProvider(client).recognizeBatch(input)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.drafts[0]).toMatchObject({
      productCode: '122334',
      productName: 'Shirt',
      salePrice: 666,
      spec: 'Black/XL',
      status: 'pending',
    })
  })

  it('refreshes the ImageUrl from assetId before calling Tencent Cloud OCR', async () => {
    const client = createClient({
      Response: {
        TextDetections: [
          { DetectedText: 'productCode A1023', Confidence: 99 },
          { DetectedText: 'productName Cotton Shirt', Confidence: 98 },
          { DetectedText: 'salePrice 129', Confidence: 96 },
          { DetectedText: 'spec Black/M', Confidence: 95 },
        ],
      },
    })

    const result = await createProvider(
      client,
      async (assetId) => `https://fresh-url.test/${encodeURIComponent(assetId)}.png`,
    ).recognizeBatch({
      ...input,
      images: [{ ...input.images[0], assetId: 'cloud://asset-1' }],
    })

    expect(client.GeneralBasicOCR).toHaveBeenCalledWith({ ImageUrl: 'https://fresh-url.test/cloud%3A%2F%2Fasset-1.png' })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error.message)
    expect(result.drafts[0].sourceImageUrl).toBe('https://fresh-url.test/cloud%3A%2F%2Fasset-1.png')
  })

  it('returns recoverable errors for missing config, rate limits, service failures, invalid responses, and timeout', async () => {
    await expect(
      createTencentCloudOcrProvider({
        endpoint: '',
        secretId: '',
        secretKey: '',
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: false, error: { code: 'configuration_error', recoverable: true } })

    await expect(
      createTencentCloudOcrProvider({
        endpoint: 'https://ocr.tencentcloudapi.com',
        secretId: 'AKIDEXAMPLE',
        secretKey: 'SECRETEXAMPLE',
        client: createClient({ Response: { TextDetections: [] } }),
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: true })

    await expect(
      createTencentCloudOcrProvider({
        endpoint: 'https://ocr.tencentcloudapi.com',
        secretId: 'AKIDEXAMPLE',
        secretKey: 'SECRETEXAMPLE',
        client: {
          GeneralBasicOCR: async () => {
            const error = new Error('rate limited')
            ;(error as Error & { code?: string }).code = 'RequestLimitExceeded'
            throw error
          },
        },
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: false, error: { code: 'rate_limited', recoverable: true } })

    await expect(
      createTencentCloudOcrProvider({
        endpoint: 'https://ocr.tencentcloudapi.com',
        secretId: 'AKIDEXAMPLE',
        secretKey: 'SECRETEXAMPLE',
        client: {
          GeneralBasicOCR: async () => {
            throw new Error('service failed')
          },
        },
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: false, error: { code: 'service_error', recoverable: true } })

    await expect(
      createTencentCloudOcrProvider({
        endpoint: 'https://ocr.tencentcloudapi.com',
        secretId: 'AKIDEXAMPLE',
        secretKey: 'SECRETEXAMPLE',
        client: createClient({ Response: { Rows: [] } }),
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: false, error: { code: 'invalid_response', recoverable: true } })

    await expect(
      createTencentCloudOcrProvider({
        endpoint: 'https://ocr.tencentcloudapi.com',
        secretId: 'AKIDEXAMPLE',
        secretKey: 'SECRETEXAMPLE',
        timeoutMs: 1,
        client: {
          GeneralBasicOCR: () => new Promise((_resolve, reject) => {
            setTimeout(() => {
              const error = new Error('timed out')
              ;(error as Error & { code?: string }).code = 'timeout'
              reject(error)
            }, 5)
          }),
        },
      }).recognizeBatch(input),
    ).resolves.toMatchObject({ ok: false, error: { code: 'timeout', recoverable: true } })
  })
})
