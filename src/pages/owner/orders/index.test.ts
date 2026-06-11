import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ownerOrdersPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner orders page state contract', () => {
  it('keeps order reads on the CloudBase snapshot facade and blocks duplicate refreshes', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain('getCloudBaseOwnerOrdersView')
    expect(source).toContain('pendingRefresh')
    expect(source).toContain('if (pendingRefresh) {')
    expect(source).toContain('return pendingRefresh')
    expect(source).not.toContain('listMerchantOrders')
    expect(source).not.toContain('mallRepository')
    expect(source).not.toContain('deleteMerchantOrder')
  })

  it('refreshes server truth after confirm and cancel without treating command results as final view state', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain("processingOrderAction.value = 'confirm'")
    expect(source).toContain("processingOrderAction.value = 'cancel'")
    expect(source).toContain('await refreshView()')
    expect(source).not.toContain('viewModel.value.orders = viewModel.value.orders.map')
    expect(source).not.toContain('result.order')
  })

  it('keeps order cards selectable for in-page details without adding a new route', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain('selectedOrderId')
    expect(source).toContain('toggleOrderDetail(order.id)')
    expect(source).toContain('order-detail-panel')
    expect(source).toContain('查看详情')
    expect(source).toContain('收起详情')
    expect(source).not.toContain('ownerOrderDetail')
    expect(source).not.toContain('navigateTo(')
  })

  it('adds scoped filters while keeping handled orders visible only when selected', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain("selectedOrderFilter = ref<OrderFilter>('pending')")
    expect(source).toContain('filteredOrders')
    expect(source).toContain("filterOrders('pending')")
    expect(source).toContain("filterOrders('settled')")
    expect(source).toContain("filterOrders('all')")
    expect(source).toContain('displayedEmptyMessage')
  })

  it('prevents detail selection from swallowing confirm and cancel commands', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain('@tap.stop="toggleOrderDetail(order.id)"')
    expect(source).toContain('@tap.stop="cancel(order.id)"')
    expect(source).toContain('@tap.stop="confirm(order.id)"')
  })

  it('keeps manager order notification opt-in on the facade and WeChat subscribe API', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain('getCloudBaseManagerOrderNotificationConfig')
    expect(source).toContain('subscribeCloudBaseManagerOrderNotifications')
    expect(source).toContain('requestSubscribeMessage')
    expect(source).toContain('enableOrderReminders')
    expect(source).not.toContain('order_notification_subscriptions')
    expect(source).not.toContain('ORDER_NOTIFICATION_TEMPLATE_ID')
    expect(source).not.toContain('managerOpenid')
  })
})
