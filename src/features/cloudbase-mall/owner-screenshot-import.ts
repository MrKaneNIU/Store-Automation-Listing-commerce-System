import type { OcrBatch, OcrJob, UploadedImage } from '../../domain/batch/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { OwnerScreenshotRecognitionResult } from '../owner-screenshot-import/owner-screenshot-import'

const toResult = (
  batch: OcrBatch,
  job: OcrJob,
  drafts: OwnerScreenshotRecognitionResult['drafts'],
  action: 'created' | 'retried' | 'refreshed',
): OwnerScreenshotRecognitionResult => {
  const needsCompletionCount = drafts.filter((draft) => draft.status === 'needs_completion').length
  const statusMessage = `OCR job ${job.status}`

  if (job.status === 'failed') {
    return {
      batch,
      job,
      drafts,
      totalDraftCount: drafts.length,
      needsCompletionCount,
      nextAction: 'retry',
      statusMessage,
      message: `OCR job ${job.id} ${action === 'retried' ? '重试失败' : '识别失败'}：${job.failureReason || '请稍后重试'}`,
    }
  }

  if (job.status === 'queued' || job.status === 'running' || job.status === 'retrying') {
    return {
      batch,
      job,
      drafts,
      totalDraftCount: drafts.length,
      needsCompletionCount,
      statusMessage,
      message: `OCR job ${job.id} ${job.status}，正在刷新识别进度`,
    }
  }

  return {
    batch,
    job,
    drafts,
    totalDraftCount: drafts.length,
    needsCompletionCount,
    nextAction: 'review',
    statusMessage,
    message: `OCR job ${job.id} ${action === 'retried' ? '重试完成' : '已完成'}，生成 ${drafts.length} 条待复核草稿`,
  }
}

export const refreshCloudBaseOwnerScreenshotRecognitionJob = async (
  jobId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerScreenshotRecognitionResult> => {
  const { jobs } = await client.listOcrJobs()
  const job = jobs.find((item) => item.id === jobId)
  if (!job) {
    throw new Error('OCR job not found')
  }
  const { batch, drafts } = await client.getLatestDrafts()
  const fallbackBatch: OcrBatch = {
    id: job.batchId,
    status: job.status === 'succeeded' ? 'recognized' : 'uploaded',
    imageUrls: [],
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }

  return toResult(batch ?? fallbackBatch, job, drafts.filter((draft) => draft.batchId === job.batchId), 'refreshed')
}

export const startCloudBaseOwnerScreenshotRecognition = async (
  screenshots: UploadedImage[],
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerScreenshotRecognitionResult> => {
  const created = await client.createOcrBatch({
    imageUrls: screenshots.map((screenshot) => screenshot.url),
    imageAssetIds: screenshots.map((screenshot) => screenshot.assetId).filter((assetId): assetId is string => Boolean(assetId)),
    drafts: [],
  })
  const processed = await client.processOcrJob(created.job.id)

  return toResult(created.batch, processed.job, processed.drafts, 'created')
}

export const retryCloudBaseOwnerScreenshotRecognitionJob = async (
  jobId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerScreenshotRecognitionResult> => {
  const retried = await client.retryOcrJob(jobId)
  const processed = await client.processOcrJob(retried.job.id)
  const batch: OcrBatch = {
    id: processed.job.batchId,
    status: processed.job.status === 'succeeded' ? 'recognized' : 'uploaded',
    imageUrls: [],
    createdAt: processed.job.createdAt,
    updatedAt: processed.job.updatedAt,
  }

  return toResult(batch, processed.job, processed.drafts, 'retried')
}
