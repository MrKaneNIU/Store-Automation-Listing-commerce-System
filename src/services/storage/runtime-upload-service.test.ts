import { afterEach, describe, expect, it, vi } from 'vitest'

const originalWx = (globalThis as typeof globalThis & { wx?: unknown }).wx

afterEach(() => {
  ;(globalThis as typeof globalThis & { wx?: unknown }).wx = originalWx
  vi.resetModules()
  vi.restoreAllMocks()
})

describe('runtime upload service', () => {
  it('falls back to mock upload service outside mini program runtime', async () => {
    delete (globalThis as typeof globalThis & { wx?: unknown }).wx

    const { getRuntimeUploadService } = await import('./runtime-upload-service')
    const service = getRuntimeUploadService()

    const images = await service.chooseImages({ businessType: 'ocr_screenshot', sourceRole: 'owner', entityType: 'ocr_batch', count: 2 })
    expect(images).toHaveLength(2)
    expect(images[0].url).toContain('/static/logo.png')
  })

  it('formats upload failures into user-friendly messages', async () => {
    const { formatUploadFailureMessage } = await import('./runtime-upload-service')

    expect(formatUploadFailureMessage(Object.assign(new Error('x'), { failureCode: 'file_too_large' }))).toContain('图片过大')
    expect(formatUploadFailureMessage(Object.assign(new Error('x'), { failureCode: 'unsupported_format' }))).toContain('PNG')
    expect(formatUploadFailureMessage(Object.assign(new Error('x'), { failureCode: 'network_failed' }))).toContain('上传失败')
  })
})
