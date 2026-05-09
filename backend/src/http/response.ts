import type { ServerResponse } from 'node:http'
import type { BackendErrorCode } from './errors'

export type ApiSuccessEnvelope<TData> = {
  success: true
  data: TData
  error: null
  meta: Record<string, unknown>
}

export type ApiErrorEnvelope = {
  success: false
  data: null
  error: {
    code: BackendErrorCode | string
    message: string
  }
  meta: Record<string, unknown>
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope

export const createSuccessEnvelope = <TData>(
  data: TData,
  meta: Record<string, unknown> = {},
): ApiSuccessEnvelope<TData> => ({
  success: true,
  data,
  error: null,
  meta,
})

export const createErrorEnvelope = (
  code: BackendErrorCode | string,
  message: string,
  meta: Record<string, unknown> = {},
): ApiErrorEnvelope => ({
  success: false,
  data: null,
  error: {
    code,
    message,
  },
  meta,
})

export const sendJson = <TData>(response: ServerResponse, statusCode: number, body: ApiEnvelope<TData>) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}
