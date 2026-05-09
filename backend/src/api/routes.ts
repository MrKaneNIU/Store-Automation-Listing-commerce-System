import type { IncomingMessage, ServerResponse } from 'node:http'

import { apiHandlers, ensurePathParam, handleApiError, methodNotAllowed, routeNotFound, type MallApiContext } from './handlers/mall-api'
import { validationError } from './errors'

type RouteDefinition = {
  method: string
  pattern: RegExp
  handler: keyof typeof apiHandlers
  params?: string[]
}

export type ApiRequestHandler = (request: IncomingMessage, response: ServerResponse) => Promise<boolean>

const routes: RouteDefinition[] = [
  { method: 'POST', pattern: /^\/api\/ocr-batches$/, handler: 'createOcrBatch' },
  { method: 'GET', pattern: /^\/api\/ocr-batches$/, handler: 'listOcrBatches' },
  { method: 'GET', pattern: /^\/api\/ocr-batches\/current$/, handler: 'getCurrentOcrBatch' },
  { method: 'GET', pattern: /^\/api\/drafts\/latest$/, handler: 'getLatestDrafts' },
  { method: 'PATCH', pattern: /^\/api\/drafts\/([^/]+)$/, handler: 'updateDraft', params: ['draftId'] },
  { method: 'DELETE', pattern: /^\/api\/drafts\/([^/]+)$/, handler: 'deleteDraft', params: ['draftId'] },
  { method: 'POST', pattern: /^\/api\/batches\/([^/]+)\/confirm$/, handler: 'confirmBatch', params: ['batchId'] },
  { method: 'GET', pattern: /^\/api\/products$/, handler: 'listProducts' },
  { method: 'GET', pattern: /^\/api\/products\/published$/, handler: 'listPublishedProducts' },
  { method: 'POST', pattern: /^\/api\/products\/([^/]+)\/publish$/, handler: 'publishProduct', params: ['productId'] },
  { method: 'GET', pattern: /^\/api\/products\/([^/]+)\/skus$/, handler: 'listSkus', params: ['productId'] },
  { method: 'GET', pattern: /^\/api\/image-tasks\/pending$/, handler: 'listPendingImageTasks' },
  {
    method: 'POST',
    pattern: /^\/api\/image-tasks\/([^/]+)\/supplement$/,
    handler: 'supplementProductImages',
    params: ['productId'],
  },
  { method: 'POST', pattern: /^\/api\/customer-orders$/, handler: 'createCustomerOrder' },
  { method: 'GET', pattern: /^\/api\/customer-orders\/([^/]+)$/, handler: 'getCustomerOrder', params: ['orderId'] },
  { method: 'GET', pattern: /^\/api\/merchant-orders$/, handler: 'listMerchantOrders' },
  {
    method: 'POST',
    pattern: /^\/api\/merchant-orders\/([^/]+)\/confirm$/,
    handler: 'confirmMerchantOrder',
    params: ['orderId'],
  },
  {
    method: 'POST',
    pattern: /^\/api\/merchant-orders\/([^/]+)\/cancel$/,
    handler: 'cancelMerchantOrder',
    params: ['orderId'],
  },
]

const getPathname = (request: IncomingMessage): string => {
  const requestUrl = new URL(request.url || '/', 'http://localhost')
  return requestUrl.pathname
}

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  if (request.method === 'GET' || request.method === 'DELETE') {
    return undefined
  }

  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    throw validationError('Request body must be valid JSON')
  }
}

const matchRoute = (
  pathname: string,
  method: string | undefined,
): { route: RouteDefinition; match: RegExpMatchArray } | undefined => {
  for (const route of routes) {
    const match = pathname.match(route.pattern)
    if (match && route.method === method) {
      return { route, match }
    }
  }

  return undefined
}

const hasPathMatch = (pathname: string): boolean => {
  return routes.some((route) => route.pattern.test(pathname))
}

const extractParams = (route: RouteDefinition, match: RegExpMatchArray): Record<string, string> => {
  return Object.fromEntries(
    (route.params ?? []).map((name, index) => [name, ensurePathParam(match[index + 1], name)]),
  )
}

export const createApiRequestHandler = (context: MallApiContext): ApiRequestHandler => {
  return async (request, response) => {
    const pathname = getPathname(request)
    if (!pathname.startsWith('/api/')) {
      return false
    }

    const matched = matchRoute(pathname, request.method)
    if (!matched) {
      if (hasPathMatch(pathname)) {
        methodNotAllowed(response)
        return true
      }
      routeNotFound(response)
      return true
    }

    try {
      const body = await readBody(request)
      const params = extractParams(matched.route, matched.match)
      await apiHandlers[matched.route.handler]({ method: request.method, body, params, response }, context)
    } catch (error) {
      handleApiError(response, error)
    }

    return true
  }
}
