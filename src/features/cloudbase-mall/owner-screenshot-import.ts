import type { UploadedImage } from '../../domain/batch/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { OwnerScreenshotRecognitionResult } from '../owner-screenshot-import/owner-screenshot-import'

export const startCloudBaseOwnerScreenshotRecognition = async (
  screenshots: UploadedImage[],
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerScreenshotRecognitionResult> => {
  const result = await client.createOcrBatch({
    imageUrls: screenshots.map((screenshot) => screenshot.url),
    drafts: [],
  })

  return {
    ...result,
    totalDraftCount: result.drafts.length,
    needsCompletionCount: result.drafts.length,
    message: `已写入 CloudBase 批次 ${result.batch.id}。当前入口未接入真实 OCR，不再生成固定示例字段；请在草稿复核页手动补全商品货号、名称、销售价和规格。`,
  }
}
