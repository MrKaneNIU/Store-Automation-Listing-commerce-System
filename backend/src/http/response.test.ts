import { describe, expect, it } from 'vitest'
import { createErrorEnvelope, createSuccessEnvelope } from './response'

describe('API response envelope', () => {
  it('wraps successful responses with data, null error, and metadata', () => {
    const response = createSuccessEnvelope({ status: 'ok' }, { requestId: 'test-request' })

    expect(response).toEqual({
      success: true,
      data: { status: 'ok' },
      error: null,
      meta: { requestId: 'test-request' },
    })
  })

  it('wraps failed responses with safe error details and null data', () => {
    const response = createErrorEnvelope('NOT_FOUND', 'Not found')

    expect(response).toEqual({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
      },
      meta: {},
    })
  })
})
