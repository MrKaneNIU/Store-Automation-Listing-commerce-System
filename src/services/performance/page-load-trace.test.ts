import { describe, expect, it } from 'vitest'

import {
  createManualPerformanceTimer,
  createPageLoadTrace,
  describeParamsShape,
  finishPageLoadTrace,
  recordImageResolutionTrace,
  recordRemoteCallTrace,
  summarizeRemoteActionCount,
} from './page-load-trace'

describe('page load trace', () => {
  it('records remote action durations with an injected timer', () => {
    const timer = createManualPerformanceTimer(100)
    let trace = createPageLoadTrace({
      pageName: 'owner-products',
      cacheStatus: 'miss',
      timer,
    })

    timer.advanceBy(25)
    trace = recordRemoteCallTrace(trace, {
      action: 'listProducts',
      params: {},
      status: 'success',
      timer,
    })

    timer.advanceBy(50)
    trace = recordRemoteCallTrace(trace, {
      action: 'listSkus',
      params: { productId: 'product-1' },
      status: 'success',
      timer,
      startedAt: 125,
    })

    trace = finishPageLoadTrace(trace, { timer })

    expect(trace.startedAt).toBe(100)
    expect(trace.endedAt).toBe(175)
    expect(trace.durationMs).toBe(75)
    expect(trace.remoteCalls).toEqual([
      {
        action: 'listProducts',
        paramsShape: {},
        startedAt: 100,
        endedAt: 125,
        durationMs: 25,
        status: 'success',
      },
      {
        action: 'listSkus',
        paramsShape: { productId: 'string' },
        startedAt: 125,
        endedAt: 175,
        durationMs: 50,
        status: 'success',
      },
    ])
  })

  it('summarizes remote action count for O(1) budget assertions', () => {
    const timer = createManualPerformanceTimer()
    let trace = createPageLoadTrace({
      pageName: 'owner-products',
      cacheStatus: 'miss',
      timer,
    })

    trace = recordRemoteCallTrace(trace, { action: 'listProducts', params: {}, status: 'success', timer })
    trace = recordRemoteCallTrace(trace, { action: 'listSkus', params: { productId: 'product-1' }, status: 'success', timer })
    trace = recordRemoteCallTrace(trace, { action: 'listSkus', params: { productId: 'product-2' }, status: 'success', timer })

    expect(summarizeRemoteActionCount(trace)).toEqual({
      total: 3,
      byAction: {
        listProducts: 1,
        listSkus: 2,
      },
    })
  })

  it('redacts sensitive params and signed URL query strings from trace shape', () => {
    expect(
      describeParamsShape({
        productId: 'product-1',
        openid: 'openid-secret',
        phoneNumber: '13800000000',
        token: 'token-secret',
        imageUrl: 'https://example.tcb.qcloud.la/a.png?sign=secret&token=secret',
        nested: {
          skuId: 'sku-1',
          secretKey: 'secret',
        },
        tags: ['a', 'b'],
      }),
    ).toEqual({
      productId: 'string',
      openid: '[redacted]',
      phoneNumber: '[redacted]',
      token: '[redacted]',
      imageUrl: 'url',
      nested: {
        skuId: 'string',
        secretKey: '[redacted]',
      },
      tags: {
        type: 'array',
        length: 2,
      },
    })
  })

  it('records image resolution traces without persisting image values', () => {
    const timer = createManualPerformanceTimer(10)
    let trace = createPageLoadTrace({
      pageName: 'customer-product-list',
      cacheStatus: 'hit',
      timer,
    })

    timer.advanceBy(15)
    trace = recordImageResolutionTrace(trace, {
      imageCount: 3,
      status: 'failed',
      errorCode: 'TEMP_URL_FAILED',
      startedAt: 10,
      timer,
    })

    expect(trace.imageResolutions).toEqual([
      {
        imageCount: 3,
        startedAt: 10,
        endedAt: 25,
        durationMs: 15,
        status: 'failed',
        errorCode: 'TEMP_URL_FAILED',
      },
    ])
  })
})
