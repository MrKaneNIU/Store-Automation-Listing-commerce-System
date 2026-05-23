import { describe, expect, it } from 'vitest'
import { resetMockDb } from '../../services/repositories/mock-db'
import {
  createOwnerScreenshotDescriptors,
  removeOwnerScreenshotDescriptor,
  startOwnerScreenshotRecognition,
} from './owner-screenshot-import'

describe('owner screenshot import facade', () => {
  it('creates uploaded image descriptors from selected temp file paths', () => {
    const existing = [{ id: 'image-existing', url: '/tmp/existing.png', name: 'existing' }]

    const descriptors = createOwnerScreenshotDescriptors(['/tmp/a.png', '/tmp/b.png'], existing.length)

    expect(descriptors).toHaveLength(2)
    expect(descriptors[0]).toMatchObject({ url: '/tmp/a.png', name: '截图 2' })
    expect(descriptors[1]).toMatchObject({ url: '/tmp/b.png', name: '截图 3' })
    expect(descriptors.every((descriptor) => descriptor.id.startsWith('image-'))).toBe(true)
  })

  it('removes descriptors immutably by image id', () => {
    const descriptors = [
      { id: 'image-1', url: '/tmp/a.png', name: '截图 1' },
      { id: 'image-2', url: '/tmp/b.png', name: '截图 2' },
    ]

    const nextDescriptors = removeOwnerScreenshotDescriptor(descriptors, 'image-1')

    expect(nextDescriptors).toEqual([{ id: 'image-2', url: '/tmp/b.png', name: '截图 2' }])
    expect(descriptors).toHaveLength(2)
  })

  it('runs OCR import and returns draft summary fields for the page', async () => {
    resetMockDb()

    const result = await startOwnerScreenshotRecognition([
      { id: 'image-1', url: '/tmp/page-1.png', name: '截图 1' },
    ])

    expect(result.batch.status).toBe('recognized')
    expect(result.drafts.length).toBeGreaterThan(0)
    expect(result.totalDraftCount).toBe(result.drafts.length)
    expect(result.needsCompletionCount).toBe(result.drafts.filter((draft) => draft.status === 'needs_completion').length)
    expect(result.message).toBe(
      `已创建批次 ${result.batch.id}，生成 ${result.totalDraftCount} 条草稿，其中 ${result.needsCompletionCount} 条待补全`,
    )
  })
})
