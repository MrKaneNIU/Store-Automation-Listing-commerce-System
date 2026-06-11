import type { CustomerProfileSnapshot } from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerProfileLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerProfileView = {
  customerId: string
  nickname: string
  avatarUrl: string
  hasAvatar: boolean
  avatarPlaceholderText: string
  loadingState: CustomerProfileLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerProfileViewOptions = {
  loadingState?: CustomerProfileLoadingState
  failureMessage?: string
}

const FAILURE_MESSAGE = '个人信息暂时无法加载'
const AVATAR_PLACEHOLDER_TEXT = '我'

const createEmptySnapshot = (): CustomerProfileSnapshot => ({
  customerId: '',
  profile: {
    customerId: '',
    nickname: '',
    avatarUrl: '',
  },
  serverTime: '',
})

const toFailureMessage = (error: unknown): string =>
  formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)

export const createCustomerProfileView = (
  snapshot: CustomerProfileSnapshot,
  options: CustomerProfileViewOptions = {},
): CustomerProfileView => {
  const nickname = snapshot.profile.nickname.trim()
  const avatarUrl = snapshot.profile.avatarUrl.trim()

  return {
    customerId: snapshot.customerId,
    nickname,
    avatarUrl,
    hasAvatar: avatarUrl.length > 0,
    avatarPlaceholderText: nickname.slice(0, 1) || AVATAR_PLACEHOLDER_TEXT,
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerProfileLoadingView = (
  previousView?: CustomerProfileView,
): CustomerProfileView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerProfileView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerProfileFailureView = (
  error: unknown,
  previousView?: CustomerProfileView,
): CustomerProfileView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerProfileView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
