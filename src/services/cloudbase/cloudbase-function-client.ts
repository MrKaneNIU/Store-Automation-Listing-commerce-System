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
    throw new Error(`${response.result.error.code}: ${response.result.error.message}`)
  }

  return response.result.data
}

export const createCloudBaseFunctionClient = (runtime: CloudBaseRuntime): CloudBaseFunctionClient => ({
  async call(name, data) {
    return parseCloudBaseFunctionResponse(await runtime.callFunction({ name, data }))
  },
})
