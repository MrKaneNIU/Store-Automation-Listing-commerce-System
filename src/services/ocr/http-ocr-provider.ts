import { markDraftCompletion } from '../../domain/draft/rules'
import type { ProductDraft } from '../../domain/draft/types'
import { createId } from '../../domain/shared/ids'
import type { OcrProvider, OcrProviderErrorCode, OcrProviderInput, OcrProviderResult } from './ocr-provider'

export type HttpOcrProviderConfig = {
  provider: string
  endpoint: string
  apiKey: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

const errorResult = (code: OcrProviderErrorCode, message: string): OcrProviderResult => ({
  ok: false,
  error: {
    code,
    message,
    recoverable: true,
  },
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')
const readNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const toDraft = (batchId: string, row: Record<string, unknown>, sourceImageUrl: string): ProductDraft => ({
  id: createId('draft'),
  batchId,
  productCode: readString(row.productCode ?? row.product_code),
  productName: readString(row.productName ?? row.product_name),
  salePrice: readNumber(row.salePrice ?? row.sale_price),
  spec: readString(row.spec),
  stock: Number.isInteger(row.stock) && Number(row.stock) >= 0 ? Number(row.stock) : 0,
  confidence: Math.min(1, Math.max(0, readNumber(row.confidence))),
  sourceImageUrl: readString(row.sourceImageUrl ?? row.source_image_url) || sourceImageUrl,
  fieldConfidence: isRecord(row.fieldConfidence ?? row.field_confidence)
    ? row.fieldConfidence as ProductDraft['fieldConfidence'] ?? row.field_confidence as ProductDraft['fieldConfidence']
    : {
        productCode: Math.min(1, Math.max(0, readNumber(row.confidence))),
        productName: Math.min(1, Math.max(0, readNumber(row.confidence))),
        salePrice: Math.min(1, Math.max(0, readNumber(row.confidence))),
        spec: Math.min(1, Math.max(0, readNumber(row.confidence))),
      },
  fieldSources: isRecord(row.fieldSources ?? row.field_sources)
    ? row.fieldSources as ProductDraft['fieldSources'] ?? row.field_sources as ProductDraft['fieldSources']
    : {
        productCode: 'ocr',
        productName: 'ocr',
        salePrice: 'ocr',
        spec: 'ocr',
      },
  correctionState: 'ocr_raw',
  status: 'pending',
})

export const createHttpOcrProvider = (config: HttpOcrProviderConfig): OcrProvider => ({
  async recognizeBatch(input: OcrProviderInput): Promise<OcrProviderResult> {
    if (!config.provider || !config.endpoint || !config.apiKey) {
      return errorResult('configuration_error', 'OCR provider production configuration is incomplete')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 10_000)
    const fetcher = config.fetchImpl ?? fetch

    try {
      const response = await fetcher(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'X-OCR-Provider': config.provider,
        },
        body: JSON.stringify({
          batchId: input.batchId,
          jobId: input.context.jobId,
          images: input.images.map((image) => ({ id: image.id, url: image.url, name: image.name })),
        }),
        signal: controller.signal,
      })

      if (response.status === 429) return errorResult('rate_limited', 'OCR provider rate limited the request')
      if (!response.ok) return errorResult('service_error', 'OCR provider returned a service error')

      const data: unknown = await response.json()
      if (!isRecord(data) || !Array.isArray(data.drafts) || data.drafts.some((draft) => !isRecord(draft))) {
        return errorResult('invalid_response', 'OCR provider response format is invalid')
      }

      return {
        ok: true,
        drafts: markDraftCompletion(data.drafts.map((draft) => toDraft(input.batchId, draft, input.images[0]?.url ?? ''))),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return errorResult('timeout', 'OCR provider request timed out')
      }
      return errorResult('service_error', 'OCR provider request failed')
    } finally {
      clearTimeout(timeout)
    }
  },
})

export const createHttpOcrProviderFromEnv = (env: Record<string, string | undefined> = {}): OcrProvider =>
  createHttpOcrProvider({
    provider: env.OCR_PROVIDER || '',
    endpoint: env.OCR_PROVIDER_ENDPOINT || '',
    apiKey: env.OCR_PROVIDER_API_KEY || '',
    timeoutMs: env.OCR_PROVIDER_TIMEOUT_MS ? Number(env.OCR_PROVIDER_TIMEOUT_MS) : undefined,
  })
