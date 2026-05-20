import { validationError } from './errors'

type JsonObject = Record<string, unknown>

export type DraftInput = {
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  correctionState?: 'ocr_raw' | 'manual_corrected'
}

export type CreateOcrBatchInput = {
  imageUrls: string[]
  drafts: DraftInput[]
}

export type DraftPatchInput = Partial<{
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  correctionState?: 'ocr_raw' | 'manual_corrected'
}>

export type SupplementImagesInput = {
  mainImageUrl: string
  imageUrls: string[]
}

export type CustomerOrderInput = {
  productId: string
  skuId: string
  quantity: number
  session: {
    customerId?: string
    nickname?: string
    phoneNumber?: string
    authSource?: 'mock_wechat' | 'wechat'
  }
}

const isObject = (value: unknown): value is JsonObject => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const readString = (input: JsonObject, field: string): string => {
  const value = input[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${field} is required`)
  }

  return value
}

const readOptionalString = (input: JsonObject, field: string): string | undefined => {
  const value = input[field]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${field} must be a non-empty string`)
  }

  return value
}

const readPositiveNumber = (input: JsonObject, field: string): number => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw validationError(`${field} must be greater than 0`)
  }

  return value
}

const readNonNegativeInteger = (input: JsonObject, field: string): number => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw validationError(`${field} must be a non-negative integer`)
  }

  return value
}

const readPositiveInteger = (input: JsonObject, field: string): number => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw validationError(`${field} must be a positive integer`)
  }

  return value
}

const readConfidence = (input: JsonObject): number => {
  const value = input.confidence
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw validationError('confidence must be between 0 and 1')
  }

  return value
}

const readStringArray = (input: JsonObject, field: string, message: string): string[] => {
  const value = input[field]
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw validationError(message)
  }

  return value
}

const parseDraftInput = (value: unknown): DraftInput => {
  if (!isObject(value)) {
    throw validationError('drafts must contain draft objects')
  }

  return {
    productCode: readString(value, 'productCode'),
    productName: readString(value, 'productName'),
    salePrice: readPositiveNumber(value, 'salePrice'),
    spec: readString(value, 'spec'),
    stock: readNonNegativeInteger(value, 'stock'),
    confidence: readConfidence(value),
    sourceImageUrl: readString(value, 'sourceImageUrl'),
    correctionState: value.correctionState === 'manual_corrected' ? 'manual_corrected' : 'ocr_raw',
  }
}

export const parseCreateOcrBatchInput = (value: unknown): CreateOcrBatchInput => {
  if (!isObject(value)) {
    throw validationError('Request body must be a JSON object')
  }

  const drafts = value.drafts === undefined ? [] : value.drafts
  if (!Array.isArray(drafts)) {
    throw validationError('drafts must be an array')
  }

  return {
    imageUrls: readStringArray(value, 'imageUrls', 'imageUrls must contain at least one image URL'),
    drafts: drafts.map(parseDraftInput),
  }
}

export const parseDraftPatchInput = (value: unknown): DraftPatchInput => {
  if (!isObject(value)) {
    throw validationError('Request body must be a JSON object')
  }

  const result: DraftPatchInput = {}
  const allowedFields = ['productCode', 'productName', 'salePrice', 'spec', 'stock', 'confidence', 'sourceImageUrl', 'correctionState']
  Object.keys(value).forEach((field) => {
    if (!allowedFields.includes(field)) {
      throw validationError(`${field} is not an editable draft field`)
    }
  })

  if (value.productCode !== undefined) result.productCode = readString(value, 'productCode')
  if (value.productName !== undefined) result.productName = readString(value, 'productName')
  if (value.salePrice !== undefined) result.salePrice = readPositiveNumber(value, 'salePrice')
  if (value.spec !== undefined) result.spec = readString(value, 'spec')
  if (value.stock !== undefined) result.stock = readNonNegativeInteger(value, 'stock')
  if (value.confidence !== undefined) result.confidence = readConfidence(value)
  if (value.sourceImageUrl !== undefined) result.sourceImageUrl = readString(value, 'sourceImageUrl')
  if (value.correctionState !== undefined) {
    if (value.correctionState !== 'ocr_raw' && value.correctionState !== 'manual_corrected') {
      throw validationError('correctionState must be ocr_raw or manual_corrected')
    }
    result.correctionState = value.correctionState
  }

  if (Object.keys(result).length === 0) {
    throw validationError('At least one draft field is required')
  }

  return result
}

export const parseSupplementImagesInput = (value: unknown): SupplementImagesInput => {
  if (!isObject(value)) {
    throw validationError('Request body must be a JSON object')
  }

  return {
    mainImageUrl: readString(value, 'mainImageUrl'),
    imageUrls: readStringArray(value, 'imageUrls', 'imageUrls must contain at least one image URL'),
  }
}

export const parseCustomerOrderInput = (value: unknown): CustomerOrderInput => {
  if (!isObject(value)) {
    throw validationError('Request body must be a JSON object')
  }

  const session = value.session
  if (!isObject(session)) {
    throw validationError('session is required')
  }

  const authSource = session.authSource
  if (authSource !== undefined && authSource !== 'mock_wechat' && authSource !== 'wechat') {
    throw validationError('session.authSource must be mock_wechat or wechat')
  }

  return {
    productId: readString(value, 'productId'),
    skuId: readString(value, 'skuId'),
    quantity: readPositiveInteger(value, 'quantity'),
    session: {
      customerId: readOptionalString(session, 'customerId'),
      nickname: readOptionalString(session, 'nickname'),
      phoneNumber: readOptionalString(session, 'phoneNumber'),
      authSource,
    },
  }
}
