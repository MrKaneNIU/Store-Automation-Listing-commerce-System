export type ProductDraftStatus = 'pending' | 'confirmed' | 'deleted' | 'needs_completion'
export type OcrDraftField = 'productCode' | 'productName' | 'salePrice' | 'spec'
export type OcrDraftCorrectionState = 'ocr_raw' | 'manual_corrected' | 'accepted'

export type ProductDraft = {
  id: string
  batchId: string
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  fieldConfidence?: Partial<Record<OcrDraftField, number>>
  fieldSources?: Partial<Record<OcrDraftField, string>>
  correctionState?: OcrDraftCorrectionState
  status: ProductDraftStatus
}

export type DraftValidationIssue = {
  draftId: string
  field: keyof ProductDraft
  message: string
}
