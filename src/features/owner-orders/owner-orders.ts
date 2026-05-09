import type { Order, OrderStatus } from '../../domain/order/types'
import { mallAccess } from '../mall-workflow/mall-access'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export type OwnerOrderListItem = Order & {
  statusLabel: string
  canConfirm: boolean
  canCancel: boolean
}

export type OwnerOrdersViewModel = {
  orders: OwnerOrderListItem[]
  emptyMessage: string
}

export type OwnerOrderCommandResult = {
  message: string
}

const statusLabels: Record<OrderStatus, string> = {
  pending_merchant_confirm: '待商家确认',
  confirmed: '已确认',
  canceled: '已取消',
}

const canHandleOrder = (order: Order) => order.status === 'pending_merchant_confirm'

const toListItem = (order: Order): OwnerOrderListItem => ({
  ...order,
  statusLabel: statusLabels[order.status],
  canConfirm: canHandleOrder(order),
  canCancel: canHandleOrder(order),
})

export const getOwnerOrdersView = (): OwnerOrdersViewModel => ({
  orders: mallAccess.listOrders().map(toListItem),
  emptyMessage: '暂无订单',
})

export const confirmOwnerOrder = (orderId: string): OwnerOrderCommandResult => {
  try {
    const order = mallWorkflow.confirmOrder(orderId)
    return { message: `订单已确认：${order.id}` }
  } catch (error) {
    return { message: error instanceof Error ? error.message : '订单确认失败' }
  }
}

export const cancelOwnerOrder = (orderId: string): OwnerOrderCommandResult => {
  try {
    const order = mallWorkflow.cancelOrder(orderId)
    return { message: `订单已取消：${order.id}` }
  } catch (error) {
    return { message: error instanceof Error ? error.message : '订单取消失败' }
  }
}
