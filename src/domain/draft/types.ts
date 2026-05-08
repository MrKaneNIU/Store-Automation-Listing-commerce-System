export type ProductDraftStatus = 'pending' | 'confirmed' | 'deleted' | 'needs_completion'

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
  status: ProductDraftStatus
}

export type DraftValidationIssue = {
  draftId: string
  field: keyof ProductDraft
  message: string
}
