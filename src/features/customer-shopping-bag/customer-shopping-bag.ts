import type {
  CustomerShoppingBagItem,
  CustomerShoppingBagSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerShoppingBagLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerShoppingBagViewItem = CustomerShoppingBagItem & {
  quantityLabel: string
  unitPriceText: string
  lineTotalText: string
  isUnavailable: boolean
}

export type CustomerShoppingBagViewModel = {
  items: CustomerShoppingBagViewItem[]
  totalQuantity: number
  totalQuantityLabel: string
  selectedQuantity: number
  selectedSubtotal: number
  selectedSubtotalText: string
  unavailableCount: number
  canCheckoutSelectedItems: boolean
  emptyMessage: string
  loadingState: CustomerShoppingBagLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

export type CustomerShoppingBagCheckoutItem = {
  productId: string
  skuId: string
  quantity: number
}

export type CustomerShoppingBagCheckoutResult =
  | {
      status: 'ready'
      checkoutItems: CustomerShoppingBagCheckoutItem[]
      message: string
    }
  | {
      status: 'blocked'
      checkoutItems: []
      message: string
    }

type CustomerShoppingBagViewOptions = {
  loadingState?: CustomerShoppingBagLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = 'Your shopping bag is empty'

const createEmptySnapshot = (): CustomerShoppingBagSnapshot => ({
  customerId: '',
  items: [],
  totalQuantity: 0,
  selectedQuantity: 0,
  selectedSubtotal: 0,
  unavailableCount: 0,
  serverTime: '',
})

const formatMoney = (value: number): string => `¥${value.toFixed(2)}`

const toFailureMessage = (error: unknown): string => {
  return formatCloudBaseFailureMessage(error, 'Shopping bag is unavailable')
}

const toViewItem = (item: CustomerShoppingBagItem): CustomerShoppingBagViewItem => ({
  ...item,
  quantityLabel: `x${item.quantity}`,
  unitPriceText: formatMoney(item.unitPrice),
  lineTotalText: formatMoney(item.lineTotal),
  isUnavailable: item.availability !== 'available',
})

export const createCustomerShoppingBagView = (
  snapshot: CustomerShoppingBagSnapshot,
  options: CustomerShoppingBagViewOptions = {},
): CustomerShoppingBagViewModel => {
  const items = snapshot.items.map(toViewItem)
  const canCheckoutSelectedItems = items.some((item) => item.isSelected && !item.isUnavailable)

  return {
    items,
    totalQuantity: snapshot.totalQuantity,
    totalQuantityLabel: `${snapshot.totalQuantity} ${snapshot.totalQuantity === 1 ? 'item' : 'items'}`,
    selectedQuantity: snapshot.selectedQuantity,
    selectedSubtotal: snapshot.selectedSubtotal,
    selectedSubtotalText: formatMoney(snapshot.selectedSubtotal),
    unavailableCount: snapshot.unavailableCount,
    canCheckoutSelectedItems,
    emptyMessage: items.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerShoppingBagLoadingView = (
  previousView?: CustomerShoppingBagViewModel,
): CustomerShoppingBagViewModel => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerShoppingBagView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerShoppingBagFailureView = (
  error: unknown,
  previousView?: CustomerShoppingBagViewModel,
): CustomerShoppingBagViewModel => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerShoppingBagView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}

export const submitSelectedCustomerShoppingBagItemsToCheckout = (
  view: CustomerShoppingBagViewModel,
): CustomerShoppingBagCheckoutResult => {
  const checkoutItems = view.items
    .filter((item) => item.isSelected && !item.isUnavailable)
    .map((item) => ({
      productId: item.productId,
      skuId: item.skuId,
      quantity: item.quantity,
    }))

  if (checkoutItems.length === 0) {
    return {
      status: 'blocked',
      checkoutItems: [],
      message: 'Select an available item before checkout',
    }
  }

  return {
    status: 'ready',
    checkoutItems,
    message: 'Ready for checkout',
  }
}
