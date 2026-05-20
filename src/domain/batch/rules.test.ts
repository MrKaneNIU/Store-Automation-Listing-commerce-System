import { describe, expect, it } from 'vitest'

import { transitionOcrJob } from './rules'
import type { OcrJob } from './types'

const job: OcrJob = {
  id: 'job-1',
  batchId: 'batch-1',
  status: 'queued',
  retryCount: 0,
  createdAt: '2026-05-19T00:00:00.000Z',
  updatedAt: '2026-05-19T00:00:00.000Z',
}

describe('OCR job state machine', () => {
  it('allows the queued -> running -> failed -> retrying flow', () => {
    const running = transitionOcrJob(job, 'running', { now: '2026-05-19T00:01:00.000Z' })
    const failed = transitionOcrJob(running, 'failed', {
      now: '2026-05-19T00:02:00.000Z',
      failureReason: 'provider timeout',
    })
    const retrying = transitionOcrJob(failed, 'retrying', {
      now: '2026-05-19T00:03:00.000Z',
      retryCount: failed.retryCount + 1,
    })

    expect(retrying).toMatchObject({
      status: 'retrying',
      retryCount: 1,
      failureReason: undefined,
    })
  })

  it('rejects illegal transitions with a clear error', () => {
    expect(() =>
      transitionOcrJob({ ...job, status: 'failed' }, 'succeeded', { now: '2026-05-19T00:01:00.000Z' }),
    ).toThrow('Invalid OCR job transition from failed to succeeded')
  })
})
