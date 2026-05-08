import type { UploadedImage } from '../../domain/batch/types'
import { createId } from '../../domain/shared/ids'
import type { UploadService } from './upload-service'

export const mockUploadService: UploadService = {
  async chooseImages(): Promise<UploadedImage[]> {
    return [
      { id: createId('image'), url: '/static/logo.png', name: '云e宝截图-1' },
      { id: createId('image'), url: '/static/logo.png', name: '云e宝截图-2' },
      { id: createId('image'), url: '/static/logo.png', name: '云e宝截图-3' },
    ]
  },
  async uploadProductImages(productId: string) {
    return {
      mainImageUrl: `/static/logo.png?product=${productId}`,
      imageUrls: [`/static/logo.png?product=${productId}&detail=1`],
    }
  },
}
