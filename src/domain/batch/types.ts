export type OcrBatchStatus = 'uploaded' | 'recognized' | 'confirmed'

export type UploadedImage = {
  id: string
  url: string
  name: string
}

export type OcrBatch = {
  id: string
  status: OcrBatchStatus
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}
