import type { OcrJob, OcrJobStatus } from './types'

const allowedOcrJobTransitions: Record<OcrJobStatus, OcrJobStatus[]> = {
  queued: ['running', 'failed'],
  running: ['succeeded', 'failed'],
  succeeded: [],
  failed: ['retrying'],
  retrying: ['queued', 'running', 'failed'],
}

export const canTransitionOcrJob = (from: OcrJobStatus, to: OcrJobStatus): boolean =>
  from === to || allowedOcrJobTransitions[from].includes(to)

export const transitionOcrJob = (
  job: OcrJob,
  status: OcrJobStatus,
  options: { now: string; failureReason?: string; retryCount?: number },
): OcrJob => {
  if (!canTransitionOcrJob(job.status, status)) {
    throw new Error(`Invalid OCR job transition from ${job.status} to ${status}`)
  }

  return {
    ...job,
    status,
    failureReason: options.failureReason,
    retryCount: options.retryCount ?? job.retryCount,
    updatedAt: options.now,
  }
}
