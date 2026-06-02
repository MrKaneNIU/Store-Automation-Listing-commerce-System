type CloudBaseFunctionRequest = {
  name: string
  data: unknown
}

type CloudBaseRuntime = {
  callFunction: (request: CloudBaseFunctionRequest) => Promise<{ result: unknown }>
}

type CloudBaseSuccessEnvelope<TData> = {
  success: true
  data: TData
  error: null
  meta: Record<string, unknown>
}

type CloudBaseErrorEnvelope = {
  success: false
  data: null
  error: {
    code: string
    message: string
  }
  meta: Record<string, unknown>
}

type CloudBaseEnvelope<TData> = CloudBaseSuccessEnvelope<TData> | CloudBaseErrorEnvelope

export type CloudBaseFunctionClient = {
  call: <TData>(name: string, data: unknown) => Promise<TData>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const rawCloudBaseErrorPattern =
  /DATABASE_COLLECTION_NOT_EXIST|Db or Table not exist|ResourceNotFound|cloud\.tencent\.com\/document|Environment not found|-501000|INVALID_ENV|module ['"][^'"]+['"] is not defined|require args is|Cannot find module/i

const recoverableInfrastructureMessage = '系统数据初始化中，请稍后重试'
const unauthorizedMessage = '请重试验证微信身份'

export class CloudBaseFunctionError extends Error {
  readonly code: string
  readonly rawMessage: string

  constructor(code: string, message: string, rawMessage: string) {
    super(message)
    this.name = 'CloudBaseFunctionError'
    this.code = code
    this.rawMessage = rawMessage
  }
}

const getErrorCode = (error: unknown): string | undefined => {
  if (error instanceof CloudBaseFunctionError) return error.code
  if (isRecord(error) && typeof error.code === 'string') return error.code
  return undefined
}

const getErrorText = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (isRecord(error) && typeof error.message === 'string') return error.message
  return ''
}

export const formatCloudBaseFailureMessage = (error: unknown, fallbackMessage: string): string => {
  const code = getErrorCode(error)
  const message = getErrorText(error).trim()

  if (code === 'INFRA_SCHEMA_MISSING' || rawCloudBaseErrorPattern.test(message)) {
    return recoverableInfrastructureMessage
  }

  if (code === 'UNAUTHORIZED' || /^UNAUTHORIZED\b/i.test(message)) {
    return unauthorizedMessage
  }

  return message || fallbackMessage
}

const isCloudBaseEnvelope = <TData>(value: unknown): value is CloudBaseEnvelope<TData> => {
  if (!isRecord(value) || typeof value.success !== 'boolean' || !('meta' in value)) {
    return false
  }

  if (value.success === true) {
    return 'data' in value && value.error === null
  }

  return (
    value.data === null &&
    isRecord(value.error) &&
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  )
}

export const parseCloudBaseFunctionResponse = <TData>(response: { result: unknown }): TData => {
  if (!isCloudBaseEnvelope<TData>(response.result)) {
    throw new Error('CloudBase function returned an invalid envelope')
  }

  if (!response.result.success) {
    const fallbackMessage = `${response.result.error.code}: ${response.result.error.message}`
    const safeMessage = formatCloudBaseFailureMessage(response.result.error, fallbackMessage)
    throw new CloudBaseFunctionError(
      response.result.error.code,
      safeMessage === response.result.error.message ? fallbackMessage : safeMessage,
      response.result.error.message,
    )
  }

  return response.result.data
}

export const createCloudBaseFunctionClient = (runtime: CloudBaseRuntime): CloudBaseFunctionClient => ({
  async call(name, data) {
    return parseCloudBaseFunctionResponse(await runtime.callFunction({ name, data }))
  },
})
