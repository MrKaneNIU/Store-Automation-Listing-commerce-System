import type { UploadedImage } from '../../domain/batch/types'
import { markDraftCompletion } from '../../domain/draft/rules'
import type { ProductDraft } from '../../domain/draft/types'
import { createId } from '../../domain/shared/ids'
import type { OcrProvider } from './ocr-provider'

const sampleRows = [
  { productCode: 'A1023', productName: '圆领针织衫', salePrice: 129, spec: '黑色/M', stock: 1, confidence: 0.96 },
  { productCode: 'A1023', productName: '圆领针织衫', salePrice: 129, spec: '黑色/M', stock: 1, confidence: 0.93 },
  { productCode: 'A1023', productName: '圆领针织衫', salePrice: 129, spec: '白色/L', stock: 1, confidence: 0.91 },
  { productCode: 'B2088', productName: '高腰牛仔裤', salePrice: 169, spec: '蓝色/S', stock: 1, confidence: 0.88 },
  { productCode: 'B2088', productName: '高腰牛仔裤', salePrice: 179, spec: '蓝色/M', stock: 1, confidence: 0.74 },
  { productCode: '', productName: '待复核衬衫', salePrice: 99, spec: '', stock: 1, confidence: 0.52 },
]

export const mockOcrProvider: OcrProvider = {
  async recognizeBatch(batchId: string, images: UploadedImage[]): Promise<ProductDraft[]> {
    const sourceImages = images.length > 0 ? images : [{ id: 'mock-image', url: '/static/logo.png', name: 'mock' }]
    const rowCount = Math.min(sampleRows.length, Math.max(3, sourceImages.length + 4))
    const drafts = sampleRows.slice(0, rowCount).map((row, index) => ({
      id: createId('draft'),
      batchId,
      productCode: row.productCode,
      productName: row.productName,
      salePrice: row.salePrice,
      spec: row.spec,
      stock: row.stock,
      confidence: row.confidence,
      sourceImageUrl: sourceImages[index % sourceImages.length].url,
      status: 'pending' as const,
    }))

    return markDraftCompletion(drafts)
  },
}
