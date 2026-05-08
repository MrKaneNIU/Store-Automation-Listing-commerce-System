import type { UploadedImage } from '../../domain/batch/types'

export interface UploadService {
  chooseImages(): Promise<UploadedImage[]>
  uploadProductImages(productId: string): Promise<{ mainImageUrl: string; imageUrls: string[] }>
}
