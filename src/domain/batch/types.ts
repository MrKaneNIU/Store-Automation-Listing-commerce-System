export type OcrBatchStatus = 'uploaded' | 'recognized' | 'confirmed'
export type OcrJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying'

export type UploadedImage = {
  id: string
  url: string
  name: string
  assetId?: string
}

export type OcrBatch = {
  id: string
  status: OcrBatchStatus
  imageUrls: string[]
  imageAssetIds?: string[]
  createdAt: string
  updatedAt: string
}

export type OcrJob = {
  id: string
  batchId: string
  status: OcrJobStatus
  failureReason?: string
  retryCount: number
  createdAt: string
  updatedAt: string
}
