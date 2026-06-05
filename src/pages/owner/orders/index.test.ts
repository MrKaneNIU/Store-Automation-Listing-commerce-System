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
  })

  it('refreshes server truth after confirm and cancel without treating command results as final view state', () => {
    const source = ownerOrdersPageSource()

    expect(source).toContain("processingOrderAction.value = 'confirm'")
    expect(source).toContain("processingOrderAction.value = 'cancel'")
    expect(source).toContain('await refreshView()')
    expect(source).not.toContain('viewModel.value.orders = viewModel.value.orders.map')
    expect(source).not.toContain('result.order')
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
