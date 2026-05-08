import type { UploadedImage } from '../../domain/batch/types'
import type { ProductDraft } from '../../domain/draft/types'

export interface OcrProvider {
  recognizeBatch(batchId: string, images: UploadedImage[]): Promise<ProductDraft[]>
}
