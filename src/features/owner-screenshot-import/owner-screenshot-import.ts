import type { OcrBatch, UploadedImage } from '../../domain/batch/types'
import type { ProductDraft } from '../../domain/draft/types'
import { createId } from '../../domain/shared/ids'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export type OwnerScreenshotRecognitionResult = {
  batch: OcrBatch
  drafts: ProductDraft[]
  totalDraftCount: number
  needsCompletionCount: number
  message: string
}

export const createOwnerScreenshotDescriptors = (tempFilePaths: string[], existingCount: number): UploadedImage[] =>
  tempFilePaths.map((url, index) => ({
    id: createId('image'),
    url,
    name: `云e宝截图${existingCount + index + 1}`,
  }))

export const removeOwnerScreenshotDescriptor = (screenshots: UploadedImage[], imageId: string): UploadedImage[] =>
  screenshots.filter((image) => image.id !== imageId)

export const startOwnerScreenshotRecognition = async (
  screenshots: UploadedImage[],
): Promise<OwnerScreenshotRecognitionResult> => {
  const result = await mallWorkflow.createMockImportBatch(screenshots)
  const needsCompletionCount = result.drafts.filter((draft) => draft.status === 'needs_completion').length

  return {
    ...result,
    totalDraftCount: result.drafts.length,
    needsCompletionCount,
    message: `已创建批次 ${result.batch.id}，生成 ${result.drafts.length} 条草稿，其中 ${needsCompletionCount} 条待补全`,
  }
}
