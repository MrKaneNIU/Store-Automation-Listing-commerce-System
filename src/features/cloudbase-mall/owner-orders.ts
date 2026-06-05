import type { Order, OrderStatus } from '../../domain/order/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type {
  CloudBaseMallApiClient,
  ManagerOrderNotificationConfig,
  ManagerOrderNotificationSubscriptionResult,
} from '../../services/cloudbase/mall-api-client'
import type {
  OwnerOrderCommandResult,
  OwnerOrderListItem,
  OwnerOrdersViewModel,
} from '../owner-orders/owner-orders'

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

export const getCloudBaseOwnerOrdersView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerOrdersViewModel> => {
  const { orders } = await client.getOwnerOrderSnapshot()

  return {
    orders: orders.map(toListItem),
    emptyMessage: '暂无订单',
  }
}

export const confirmCloudBaseOwnerOrder = async (
  orderId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerOrderCommandResult> => {
  try {
    const { order } = await client.confirmMerchantOrder(orderId)
    return { message: `订单已确认：${order.id}` }
  } catch (error) {
    return { message: error instanceof Error ? error.message : '订单确认失败' }
  }
}

export const cancelCloudBaseOwnerOrder = async (
  orderId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerOrderCommandResult> => {
  try {
    const { order } = await client.cancelMerchantOrder(orderId)
    return { message: `订单已取消：${order.id}` }
  } catch (error) {
    return { message: error instanceof Error ? error.message : '订单取消失败' }
  }
}

export type ManagerOrderNotificationCommandResult = {
  message: string
  notificationConfig: ManagerOrderNotificationConfig
}

export const getCloudBaseManagerOrderNotificationConfig = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<ManagerOrderNotificationConfig> => client.getManagerOrderNotificationConfig()

export const subscribeCloudBaseManagerOrderNotifications = async (
  templateId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<ManagerOrderNotificationCommandResult> => {
  try {
    const result: ManagerOrderNotificationSubscriptionResult = await client.subscribeManagerOrderNotifications({ templateId })
    return {
      message: '订单提醒已开启',
      notificationConfig: result.notificationConfig,
    }
  } catch (error) {
    return {
      message: error instanceof Error && error.message.trim() ? error.message : '订单提醒开启失败',
      notificationConfig: {
        isConfigured: Boolean(templateId),
        templateId,
        subscribed: false,
      },
    }
  }
}
