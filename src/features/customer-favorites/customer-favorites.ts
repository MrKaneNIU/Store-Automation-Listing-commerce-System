import type {
  CustomerFavoriteProductItem,
  CustomerFavoriteProductsSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerFavoriteProductsLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerFavoriteProductViewItem = CustomerFavoriteProductItem & {
  priceText: string
  isUnavailable: boolean
}

export type CustomerFavoriteProductsView = {
  items: CustomerFavoriteProductViewItem[]
  totalCount: number
  availableCount: number
  unavailableCount: number
  emptyMessage: string
  loadingState: CustomerFavoriteProductsLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerFavoriteProductsViewOptions = {
  loadingState?: CustomerFavoriteProductsLoadingState
  failureMessage?: string
}

export type CustomerFavoriteProductCommandResult = {
  status: 'succeeded' | 'failed'
  message: string
  invalidatedSnapshotKeys: string[]
  view: CustomerFavoriteProductsView
}

const EMPTY_MESSAGE = 'No favorite products yet'
const FAILURE_MESSAGE = 'Favorites are unavailable'

const createEmptySnapshot = (): CustomerFavoriteProductsSnapshot => ({
  customerId: '',
  items: [],
  totalCount: 0,
  availableCount: 0,
  unavailableCount: 0,
  serverTime: '',
})

const formatPrice = (value: number | '-'): string =>
  value === '-' ? '-' : `CNY ${value.toFixed(2)}`

const toFailureMessage = (error: unknown): string => {
  return formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)
}

const toViewItem = (item: CustomerFavoriteProductItem): CustomerFavoriteProductViewItem => ({
  ...item,
  priceText: formatPrice(item.minPrice),
  isUnavailable: item.availability !== 'available',
})

export const createCustomerFavoriteProductsView = (
  snapshot: CustomerFavoriteProductsSnapshot,
  options: CustomerFavoriteProductsViewOptions = {},
): CustomerFavoriteProductsView => {
  const items = snapshot.items.map(toViewItem)

  return {
    items,
    totalCount: snapshot.totalCount,
    availableCount: snapshot.availableCount,
    unavailableCount: snapshot.unavailableCount,
    emptyMessage: items.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerFavoriteProductsLoadingView = (
  previousView?: CustomerFavoriteProductsView,
): CustomerFavoriteProductsView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerFavoriteProductsView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerFavoriteProductsFailureView = (
  error: unknown,
  previousView?: CustomerFavoriteProductsView,
): CustomerFavoriteProductsView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerFavoriteProductsView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
