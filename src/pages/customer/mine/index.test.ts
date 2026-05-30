import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const routesSource = readFileSync(path.resolve(__dirname, '../../../app/routes.ts'), 'utf8')
const pagesJson = readFileSync(path.resolve(__dirname, '../../../pages.json'), 'utf8')

describe('customer mine placeholder page', () => {
  it('registers the minimal customer mine route and page', () => {
    expect(routesSource).toContain("customerMine: '/pages/customer/mine/index'")
    expect(pagesJson).toContain('"path": "pages/customer/mine/index"')
    expect(source).toContain('客户中心暂未开放')
  })

  it('does not call backend or read sensitive customer data', () => {
    expect(source).not.toContain('cloudbase')
    expect(source).not.toContain('CloudBase')
    expect(source).not.toContain('mallApi')
    expect(source).not.toContain('getPhoneNumber')
    expect(source).not.toContain('phone')
    expect(source).not.toContain('openid')
    expect(source).not.toContain('address')
    expect(source).not.toContain('订单')
  })

  it('provides home, catalog, favorites, and shopping-bag exits', () => {
    expect(source).toContain('返回首页')
    expect(source).toContain('继续逛商品')
    expect(source).toContain('查看收藏')
    expect(source).toContain('查看购物袋')
    expect(source).toContain('customerBottomNavRoutes.home')
    expect(source).toContain('customerBottomNavRoutes.catalog')
    expect(source).toContain('customerBottomNavRoutes.favorites')
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
  })

  it('uses the shared pending route guard for fast switching', () => {
    expect(source).toContain("const navigatingRoute = ref<AppRoute | ''>('')")
    expect(source).toContain('goCustomerBottomNav')
    expect(source).toContain('shouldIgnoreCustomerBottomNavTap')
    expect(source).toContain('pendingRoute: navigatingRoute.value')
    expect(source).toContain(':disabled="Boolean(navigatingRoute)"')
  })
})
