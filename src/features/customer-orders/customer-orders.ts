import type { Order, OrderStatus } from '../../domain/order/types'
import type { CustomerOrdersSnapshot } from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerOrdersLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerOrderViewItem = Order & {
  statusLabel: string
  totalAmountText: string
  itemCountLabel: string
  primaryProductName: string
}

export type CustomerOrdersView = {
  items: CustomerOrderViewItem[]
  totalCount: number
  totalCountLabel: string
  emptyMessage: string
  loadingState: CustomerOrdersLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerOrdersViewOptions = {
  loadingState?: CustomerOrdersLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = 'No orders yet'
const FAILURE_MESSAGE = 'Orders are unavailable'

const statusLabels: Record<OrderStatus, string> = {
  pending_merchant_confirm: 'Pending merchant confirmation',
  confirmed: 'Confirmed',
  canceled: 'Canceled',
}

const createEmptySnapshot = (): CustomerOrdersSnapshot => ({
  customerId: '',
  orders: [],
  totalCount: 0,
  serverTime: '',
})

const formatMoney = (value: number): string => `¥${value.toFixed(2)}`

const formatTotalCount = (totalCount: number): string =>
  `${totalCount} ${totalCount === 1 ? 'order' : 'orders'}`

const formatItemCount = (order: Order): string => {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

const toFailureMessage = (error: unknown): string =>
  formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)

const toViewItem = (order: Order): CustomerOrderViewItem => ({
  ...order,
  statusLabel: statusLabels[order.status],
  totalAmountText: formatMoney(order.totalAmount),
  itemCountLabel: formatItemCount(order),
  primaryProductName: order.items[0]?.productName || 'Order',
})

export const createCustomerOrdersView = (
  snapshot: CustomerOrdersSnapshot,
  options: CustomerOrdersViewOptions = {},
): CustomerOrdersView => {
  const items = snapshot.orders.map(toViewItem)

  return {
    items,
    totalCount: snapshot.totalCount,
    totalCountLabel: formatTotalCount(snapshot.totalCount),
    emptyMessage: items.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerOrdersLoadingView = (
  previousView?: CustomerOrdersView,
): CustomerOrdersView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerOrdersView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerOrdersFailureView = (
  error: unknown,
  previousView?: CustomerOrdersView,
): CustomerOrdersView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerOrdersView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
