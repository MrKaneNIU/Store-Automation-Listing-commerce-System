import { createCloudBaseFunctionClient } from './cloudbase-function-client'
import { createCloudBaseMallApiClient, type CloudBaseMallApiClient } from './mall-api-client'

type WxCloudRuntime = {
  init?: (options: { env: string }) => void
  callFunction: (request: { name: string; data: unknown }) => Promise<{ result: unknown }>
}

declare const wx: { cloud?: WxCloudRuntime } | undefined

const cloudBaseEnvId = 'cloud1-d7gifjyzl7721b383'

let initialized = false
let client: CloudBaseMallApiClient | null = null

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export const createRuntimeCloudBaseError = (error: unknown, envId = cloudBaseEnvId): Error => {
  const message = getErrorMessage(error)

  if (message.includes('-501000') || message.includes('Environment not found') || message.includes('INVALID_ENV')) {
    return new Error(
      `CloudBase environment not found for current mini-program AppID. Runtime env: ${envId}. Open WeChat DevTools Cloud panel, confirm this AppID can access the same env, then rebuild. Original error: ${message}`,
    )
  }

  return error instanceof Error ? error : new Error(message)
}

const getWxCloudRuntime = (): WxCloudRuntime => {
  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('CloudBase runtime is only available inside WeChat Mini Program')
  }

  if (!initialized) {
    wx.cloud.init?.({ env: cloudBaseEnvId })
    initialized = true
  }

  return wx.cloud
}

export const getRuntimeCloudBaseMallApiClient = (): CloudBaseMallApiClient => {
  if (!client) {
    client = createCloudBaseMallApiClient(
      createCloudBaseFunctionClient({
        async callFunction(request) {
          try {
            return await getWxCloudRuntime().callFunction(request)
          } catch (error) {
            throw createRuntimeCloudBaseError(error)
          }
        },
      }),
    )
  }

  return client
}
