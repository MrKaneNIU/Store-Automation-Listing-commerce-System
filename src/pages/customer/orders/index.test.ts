import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer orders page', () => {
  it('renders customer-owned orders from page state without order mutation actions', () => {
    expect(source).toContain('createCustomerOrdersPageState')
    expect(source).toContain('onShow')
    expect(source).toContain('viewModel.items')
    expect(source).toContain('viewModel.totalCountLabel')
    expect(source).toContain('customer-scoped')
    expect(source).toContain('我的订单')
    expect(source).toContain('查看详情')
    expect(source).toContain('openOrderDetail(order.id)')
    expect(source).toContain('routes.customerOrderDetail')
    expect(source).toContain('navigateTo')
    expect(source).toContain('reload')
    expect(source).toContain('class="detail-header"')
    expect(source).toContain('class="icon-button plain"')
    expect(source).toContain('@tap="goMine"')
    expect(source).toContain('<text class="chevron">‹</text>')
    expect(source).toContain(':style="{ paddingTop: headerTopPadding }"')
    expect(source).toContain('redirectTo(routes.customerMine)')
    expect(source).not.toContain('&lt;')
    expect(source).not.toContain('detail-arrow')
    expect(source).not.toContain('back-button')
    expect(source).not.toContain('confirmOrder')
    expect(source).not.toContain('cancelOrder')
    expect(source).not.toContain('payOrder')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('mallApi')
  })

  it('uses the existing customer mobile visual system with loading empty failure and retry states', () => {
    expect(source).toContain('background: #f8f8f8')
    expect(source).toContain('hover-class="press-feedback"')
    expect(source).toContain('viewModel.loadingState === \'loading\'')
    expect(source).toContain('viewModel.loadingState === \'failed\'')
    expect(source).toContain('viewModel.loadingState === \'refreshing\'')
    expect(source).toContain('@tap="reload"')
    expect(source).toContain('viewModel.items.length === 0')
  })
})
