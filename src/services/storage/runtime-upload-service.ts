import type { UploadService } from './upload-service'
import { cloudbaseUploadService } from './cloudbase-upload-service'
import { mockUploadService } from './mock-upload-service'

type WxCloudRuntime = {
  cloud?: unknown
}

declare const wx: WxCloudRuntime | undefined

const isMiniProgramRuntime = (): boolean => typeof wx !== 'undefined'

export const getRuntimeUploadService = (): UploadService => {
  if (isMiniProgramRuntime()) {
    return cloudbaseUploadService
  }

  return mockUploadService
}

export const uploadService = getRuntimeUploadService()

export const formatUploadFailureMessage = (error: unknown): string => {
  if (error instanceof Error && 'failureCode' in error) {
    const failureCode = (error as Error & { failureCode?: string }).failureCode
    switch (failureCode) {
      case 'file_too_large':
        return '图片过大，请压缩后重试'
      case 'unsupported_format':
        return '仅支持 PNG、JPG、JPEG、WEBP 图片'
      case 'network_failed':
        return '图片上传失败，请检查网络后重试'
      case 'server_failed':
        return '云端删除或替换失败，请稍后重试'
      case 'security_review_failed':
        return '图片未通过安全审核'
      default:
        break
    }
  }

  return error instanceof Error ? error.message : '图片上传失败'
}
