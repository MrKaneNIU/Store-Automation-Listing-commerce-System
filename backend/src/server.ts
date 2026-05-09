import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { backendErrorCodes } from './http/errors'
import { createErrorEnvelope, createSuccessEnvelope, sendJson } from './http/response'

type BackendApiHandler = (request: IncomingMessage, response: ServerResponse) => Promise<boolean>

type BackendServerOptions = {
  apiHandler?: BackendApiHandler
}

const getPathname = (request: IncomingMessage): string => {
  const requestUrl = new URL(request.url || '/', 'http://localhost')
  return requestUrl.pathname
}

const handleHealth = (response: ServerResponse) => {
  sendJson(
    response,
    200,
    createSuccessEnvelope({
      service: 'vx-close-backend',
      status: 'ok',
    }),
  )
}

const handleRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  options: BackendServerOptions,
): Promise<void> => {
  if (options.apiHandler && (await options.apiHandler(request, response))) {
    return
  }

  const pathname = getPathname(request)

  if (pathname === '/health') {
    if (request.method !== 'GET') {
      sendJson(response, 405, createErrorEnvelope(backendErrorCodes.METHOD_NOT_ALLOWED, 'Method not allowed'))
      return
    }

    handleHealth(response)
    return
  }

  sendJson(response, 404, createErrorEnvelope(backendErrorCodes.NOT_FOUND, 'Route not found'))
}

export const createBackendServer = (options: BackendServerOptions = {}) =>
  createServer((request, response) => void handleRequest(request, response, options))
