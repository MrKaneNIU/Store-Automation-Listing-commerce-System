import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const navPages = [
  'dashboard/index.vue',
  'products/index.vue',
  'orders/index.vue',
  'more/index.vue',
]

const navExpectations = [
  {
    page: 'dashboard/index.vue',
    activeLabel: '工作台',
    targets: [
      ['商品管理', 'routes.ownerProducts'],
      ['订单确认', 'routes.ownerOrders'],
      ['更多', 'routes.ownerMore'],
    ],
  },
  {
    page: 'products/index.vue',
    activeLabel: '商品管理',
    targets: [
      ['工作台', 'routes.ownerDashboard'],
      ['订单确认', 'routes.ownerOrders'],
      ['更多', 'routes.ownerMore'],
    ],
  },
  {
    page: 'orders/index.vue',
    activeLabel: '订单确认',
    targets: [
      ['工作台', 'routes.ownerDashboard'],
      ['商品管理', 'routes.ownerProducts'],
      ['更多', 'routes.ownerMore'],
    ],
  },
  {
    page: 'more/index.vue',
    activeLabel: '更多',
    targets: [
      ['工作台', 'routes.ownerDashboard'],
      ['商品管理', 'routes.ownerProducts'],
      ['订单确认', 'routes.ownerOrders'],
    ],
  },
] as const

const ownerPageSource = (page: string) => readFileSync(resolve(__dirname, page), 'utf8')

const getAdminNavSource = (source: string) => {
  const match = source.match(/<view class="admin-nav">[\s\S]*?<\/view>/)

  return match?.[0] ?? ''
}

describe('owner bottom navigation style contract', () => {
  it('keeps the bottom navigation geometry stable across owner tabs', () => {
    for (const page of navPages) {
      const source = ownerPageSource(page)

      expect(source).toContain('class="admin-nav"')
      expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));')
      expect(source).toContain('height: 92rpx;')
      expect(source).toContain('min-height: 92rpx;')
      expect(source).toContain('box-sizing: border-box;')
      expect(source).toContain('white-space: nowrap;')
      expect(source).toContain('.admin-nav .busy')
      expect(source).toContain('transform: none;')
    }
  })

  it('does not expose a top-right storefront shortcut on owner main tabs', () => {
    const storefrontShortcutPages = [
      'products/index.vue',
      'orders/index.vue',
      'more/index.vue',
    ]

    for (const page of storefrontShortcutPages) {
      const source = ownerPageSource(page)

      expect(source).not.toContain('class="shop-link"')
      expect(source).not.toContain('@tap="goShop"')
      expect(source).not.toContain('routes.customerProductList')
      expect(source).not.toContain('商城')
    }
  })

  it('keeps owner tab labels wired to their matching route targets', () => {
    for (const expectation of navExpectations) {
      const source = ownerPageSource(expectation.page)
      const adminNav = getAdminNavSource(source)

      expect(adminNav, expectation.page).toContain(`class="nav-item active"`)
      expect(adminNav, expectation.page).toContain(expectation.activeLabel)

      for (const [label, route] of expectation.targets) {
        expect(adminNav, `${expectation.page} ${label}`).toContain(`@tap="go`)
        expect(adminNav, `${expectation.page} ${label}`).toContain(route)
        expect(adminNav, `${expectation.page} ${label}`).toContain(label)
      }
    }
  })

  it('does not disable every owner tab while one tab navigation is pending', () => {
    for (const page of navPages) {
      const source = ownerPageSource(page)
      const adminNav = getAdminNavSource(source)

      expect(adminNav, page).not.toContain(':disabled="Boolean(navigatingRoute)"')
    }
  })
})
