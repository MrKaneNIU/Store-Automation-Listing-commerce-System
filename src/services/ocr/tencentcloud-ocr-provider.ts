import * as tencentcloud from 'tencentcloud-sdk-nodejs'
import { markDraftCompletion } from '../../domain/draft/rules'
import type { ProductDraft } from '../../domain/draft/types'
import { createId } from '../../domain/shared/ids'
import type { OcrProvider, OcrProviderErrorCode, OcrProviderInput, OcrProviderResult } from './ocr-provider'

type TencentCloudTextDetection = {
  DetectedText?: string
  Confidence?: number
}

type TencentCloudGeneralBasicOCRResponse = {
  TextDetections?: TencentCloudTextDetection[]
}

export type TencentCloudOcrClient = {
  GeneralBasicOCR: (request: { ImageUrl: string }) => Promise<TencentCloudGeneralBasicOCRResponse | { Response?: TencentCloudGeneralBasicOCRResponse }>
}

export type TencentCloudOcrProviderConfig = {
  endpoint: string
  secretId: string
  secretKey: string
  region?: string
  timeoutMs?: number
  client?: TencentCloudOcrClient
  resolveImageUrl?: (assetId: string) => Promise<string> | string
}

type ParsedTextField = {
  value: string
  confidence: number
}

const DEFAULT_REGION = 'ap-guangzhou'

const errorResult = (code: OcrProviderErrorCode, message: string): OcrProviderResult => ({
  ok: false,
  error: {
    code,
    message,
    recoverable: true,
  },
})

const normalizeConfidence = (confidence: unknown): number => {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return 0
  return Math.min(1, Math.max(0, confidence > 1 ? confidence / 100 : confidence))
}

const readDetectedText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parseTextField = (lines: Array<{ text: string; confidence: number }>, labels: string[]): ParsedTextField => {
  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index]
    for (const label of labels) {
      const pattern = new RegExp(`^${escapeRegExp(label)}\\s*[:：]?\\s*(.+)$`, 'i')
      const match = currentLine.text.match(pattern)
      if (match?.[1]) return { value: match[1].trim(), confidence: currentLine.confidence }

      const nextLine = lines[index + 1]
      if (currentLine.text === label && nextLine?.text && !labels.includes(nextLine.text)) {
        return {
          value: nextLine.text.trim(),
          confidence: Math.min(currentLine.confidence || 0, nextLine.confidence || 0) || currentLine.confidence,
        }
      }
    }
  }
  return { value: '', confidence: 0 }
}

const parseSalePrice = (value: string) => {
  const match = value.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

const textDetectionsToDraft = (batchId: string, imageUrl: string, detections: TencentCloudTextDetection[]): ProductDraft => {
  const lines = detections
    .map((item) => ({
      text: readDetectedText(item.DetectedText),
      confidence: normalizeConfidence(item.Confidence),
    }))
    .filter((line): line is { text: string; confidence: number } => Boolean(line.text))

  const productCode = parseTextField(lines, ['货号', '商品货号', '款号', 'productCode', 'product_code'])
  const productName = parseTextField(lines, ['商品名称', '品名', '名称', 'productName', 'product_name'])
  const salePrice = parseTextField(lines, ['销售价', '售价', '价格', 'productPrice', 'salePrice', 'sale_price'])
  const spec = parseTextField(lines, ['规格', '尺码', '颜色规格', 'spec'])
  const confidenceValues = [productCode.confidence, productName.confidence, salePrice.confidence, spec.confidence].filter(
    (value) => value > 0,
  )

  return {
    id: createId('draft'),
    batchId,
    productCode: productCode.value,
    productName: productName.value,
    salePrice: parseSalePrice(salePrice.value),
    spec: spec.value,
    stock: 0,
    confidence: confidenceValues.length > 0 ? Math.min(...confidenceValues) : 0,
    sourceImageUrl: imageUrl,
    fieldConfidence: {
      productCode: productCode.confidence,
      productName: productName.confidence,
      salePrice: salePrice.confidence,
      spec: spec.confidence,
    },
    fieldSources: {
      productCode: 'ocr',
      productName: 'ocr',
      salePrice: 'ocr',
      spec: 'ocr',
    },
    correctionState: 'ocr_raw',
    status: 'pending',
  }
}

const createClient = (config: TencentCloudOcrProviderConfig): TencentCloudOcrClient => {
  if (config.client) return config.client
  const Client = tencentcloud.ocr.v20181119.Client
  return new Client({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
    },
    region: config.region || DEFAULT_REGION,
    profile: {
      httpProfile: {
        endpoint: config.endpoint.replace(/^https?:\/\//, ''),
        reqMethod: 'POST',
        reqTimeout: Math.ceil((config.timeoutMs ?? 10_000) / 1000),
      },
    },
  })
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(Object.assign(new Error('Tencent Cloud OCR request timed out'), { code: 'timeout' })), timeoutMs)
    }),
  ])

const getResponsePayload = (response: unknown): TencentCloudGeneralBasicOCRResponse | undefined => {
  if (typeof response !== 'object' || response === null) return undefined
  const record = response as { Response?: TencentCloudGeneralBasicOCRResponse; TextDetections?: TencentCloudTextDetection[] }
  return record.Response ?? record
}

const getErrorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code || '') : ''

const getErrorMessage = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message || '') : ''

export const createTencentCloudOcrProvider = (config: TencentCloudOcrProviderConfig): OcrProvider => ({
  async recognizeBatch(input: OcrProviderInput): Promise<OcrProviderResult> {
    if (!config.endpoint || !config.secretId || !config.secretKey) {
      return errorResult('configuration_error', 'Tencent Cloud OCR production configuration is incomplete')
    }

    const image = input.images[0]
    if (!image?.url) {
      return errorResult('invalid_response', 'OCR job has no image URL to recognize')
    }

    try {
      const imageUrl = image.assetId && config.resolveImageUrl ? await config.resolveImageUrl(image.assetId) : image.url
      const response = await withTimeout(
        createClient(config).GeneralBasicOCR({ ImageUrl: imageUrl }),
        config.timeoutMs ?? 10_000,
      )
      const payload = getResponsePayload(response)
      const detections = payload?.TextDetections
      if (!Array.isArray(detections)) {
        return errorResult('invalid_response', 'Tencent Cloud OCR response format is invalid')
      }

      return {
        ok: true,
        drafts: markDraftCompletion([textDetectionsToDraft(input.batchId, imageUrl, detections)]),
      }
    } catch (error) {
      const code = getErrorCode(error)
      if (code === 'timeout' || code.includes('Timeout')) {
        return errorResult('timeout', 'Tencent Cloud OCR request timed out')
      }
      if (code.includes('Limit') || code.includes('Rate')) {
        return errorResult('rate_limited', 'Tencent Cloud OCR rate limited the request')
      }
      const message = getErrorMessage(error)
      return errorResult(
        'service_error',
        `Tencent Cloud OCR request failed${code ? ` (${code})` : ''}${message ? `: ${message}` : ''}`,
      )
    }
  },
})

export const createTencentCloudOcrProviderFromEnv = (env: Record<string, string | undefined> = {}) =>
  createTencentCloudOcrProvider({
    endpoint: env.OCR_PROVIDER_ENDPOINT || 'https://ocr.tencentcloudapi.com',
    secretId: env.OCR_TENCENT_SECRET_ID || env.TENCENTCLOUD_SECRET_ID || '',
    secretKey: env.OCR_TENCENT_SECRET_KEY || env.TENCENTCLOUD_SECRET_KEY || '',
    region: env.OCR_TENCENT_REGION || env.TENCENTCLOUD_REGION || DEFAULT_REGION,
    timeoutMs: env.OCR_PROVIDER_TIMEOUT_MS ? Number(env.OCR_PROVIDER_TIMEOUT_MS) : undefined,
  })
