import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const routesSource = readFileSync(path.resolve(__dirname, '../../../app/routes.ts'), 'utf8')
const pagesJson = readFileSync(path.resolve(__dirname, '../../../pages.json'), 'utf8')

describe('customer order detail page', () => {
  it('is registered as a customer route and loads detail from orderId only', () => {
    expect(routesSource).toContain("customerOrderDetail: '/pages/customer/order-detail/index'")
    expect(pagesJson).toContain('"path": "pages/customer/order-detail/index"')
    expect(source).toContain('createCustomerOrderDetailPageState')
    expect(source).toContain('onLoad')
    expect(source).toContain('query?.orderId')
    expect(source).toContain('loadOrder(orderId')
    expect(source).not.toContain('customerId')
    expect(source).not.toContain('openid')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('cloudbase')
    expect(source).not.toContain('mallApi')
  })

  it('renders Phase 5 detail content and mobile feedback states', () => {
    expect(source).toContain('订单详情')
    expect(source).toContain('商品明细')
    expect(source).toContain('收货地址')
    expect(source).toContain('创建时间')
    expect(source).toContain('更新时间')
    expect(source).toContain('order.detailItems')
    expect(source).toContain('order.shippingContactLine')
    expect(source).toContain('order.shippingAddressLine')
    expect(source).toContain('未记录收货地址')
    expect(source).toContain("viewModel.loadingState === 'loading'")
    expect(source).toContain("viewModel.loadingState === 'failed'")
    expect(source).toContain('hover-class="press-feedback"')
    expect(source).toContain('overflow-x: hidden')
    expect(source).toContain('background: #f8f8f8')
    expect(source).toContain('border-radius')
  })
})
