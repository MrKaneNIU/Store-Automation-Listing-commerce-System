import { describe, expect, it } from 'vitest'

import type { CustomerProfileSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerProfileFailureView,
  createCustomerProfileLoadingView,
  createCustomerProfileView,
} from './customer-profile'

const createSnapshot = (overrides: Partial<CustomerProfileSnapshot['profile']> = {}): CustomerProfileSnapshot => ({
  customerId: 'customer-1',
  profile: {
    customerId: 'customer-1',
    nickname: ' Ada ',
    avatarUrl: ' cloud://avatar.png ',
    ...overrides,
  },
  serverTime: '2026-06-11T00:00:00.000Z',
})

describe('customer profile view model', () => {
  it('normalizes loaded profile fields for the page', () => {
    const view = createCustomerProfileView(createSnapshot())

    expect(view).toMatchObject({
      customerId: 'customer-1',
      nickname: 'Ada',
      avatarUrl: 'cloud://avatar.png',
      hasAvatar: true,
      avatarPlaceholderText: 'A',
      loadingState: 'idle',
      failureMessage: '',
      lastUpdatedAt: '2026-06-11T00:00:00.000Z',
    })
  })

  it('creates loading and empty-avatar states without leaking identity authority', () => {
    const emptyAvatar = createCustomerProfileView(createSnapshot({ nickname: ' ', avatarUrl: ' ' }))
    const loading = createCustomerProfileLoadingView()
    const refreshing = createCustomerProfileLoadingView(emptyAvatar)

    expect(emptyAvatar).toMatchObject({
      nickname: '',
      avatarUrl: '',
      hasAvatar: false,
      avatarPlaceholderText: expect.any(String),
    })
    expect(loading.loadingState).toBe('loading')
    expect(refreshing.loadingState).toBe('refreshing')
    expect(refreshing.failureMessage).toBe('')
    expect(JSON.stringify(emptyAvatar)).not.toContain('openid')
  })

  it('formats failure views for first load and retry failure', () => {
    const previous = createCustomerProfileView(createSnapshot())
    const firstFailure = createCustomerProfileFailureView(new Error('network unavailable'))
    const retryFailure = createCustomerProfileFailureView(new Error('retry unavailable'), previous)

    expect(firstFailure.loadingState).toBe('failed')
    expect(firstFailure.failureMessage).toBe('network unavailable')
    expect(retryFailure.loadingState).toBe('failed')
    expect(retryFailure.nickname).toBe('Ada')
    expect(retryFailure.failureMessage).toBe('retry unavailable')
  })
})
