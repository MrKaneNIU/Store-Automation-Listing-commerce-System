import type { UploadedImage } from '../../domain/batch/types'
import type { ProductDraft } from '../../domain/draft/types'

export type OcrProviderInput = {
  batchId: string
  images: UploadedImage[]
  context: {
    jobId: string
    requestedAt: string
  }
}

export type OcrProviderErrorCode = 'timeout' | 'rate_limited' | 'service_error' | 'invalid_response' | 'configuration_error'

export type OcrProviderError = {
  code: OcrProviderErrorCode
  message: string
  recoverable: true
}

export type OcrProviderResult =
  | { ok: true; drafts: ProductDraft[] }
  | { ok: false; error: OcrProviderError }

export interface OcrProvider {
  recognizeBatch(input: OcrProviderInput): Promise<OcrProviderResult>
}
