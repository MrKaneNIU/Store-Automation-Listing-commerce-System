import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const readPage = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), 'utf8')

const homeSource = readPage('../index/index.vue')
const productListSource = readPage('product-list/index.vue')
const favoritesSource = readPage('favorites/index.vue')
const shoppingBagSource = readPage('shopping-bag/index.vue')
const mineSource = readPage('mine/index.vue')
const bottomNavConfigSource = readPage('customer-bottom-nav.ts')
const legacyVisualEntryCopy = '视觉' + '入口'
const legacySeparatePrdCopy = '单独' + ' PRD'
const legacyShoppingBagSeparatePrdCopy = '真实购物袋能力需' + legacySeparatePrdCopy
const legacyFavoritesSeparatePrdCopy = '收藏能力需' + legacySeparatePrdCopy + ' 接入'

const pages = [
  ['home', homeSource],
  ['product list', productListSource],
  ['favorites', favoritesSource],
  ['shopping bag', shoppingBagSource],
  ['mine', mineSource],
] as const

describe('customer bottom navigation matrix', () => {
  it('keeps all customer nav routes in a shared bottom-nav config', () => {
    expect(bottomNavConfigSource).toContain('customerBottomNavRoutes')
    expect(bottomNavConfigSource).toContain('home: routes.customerHome')
    expect(bottomNavConfigSource).toContain('catalog: routes.customerProductList')
    expect(bottomNavConfigSource).toContain('favorites: routes.customerFavorites')
    expect(bottomNavConfigSource).toContain('shoppingBag: routes.customerShoppingBag')
    expect(bottomNavConfigSource).toContain('mine: routes.customerMine')
    expect(bottomNavConfigSource).toContain('customerBottomNavItems')
    expect(bottomNavConfigSource).toContain('shouldIgnoreCustomerBottomNavTap')
  })

  it('wires every real customer tab through shared routes on all customer pages', () => {
    for (const [name, source] of pages) {
      expect(source, name).toContain('customerBottomNavRoutes.home')
      expect(source, name).toContain('customerBottomNavRoutes.catalog')
      expect(source, name).toContain('customerBottomNavRoutes.shoppingBag')
      expect(source, name).toContain('customerBottomNavRoutes.favorites')
      expect(source, name).toContain('customerBottomNavRoutes.mine')
    }
  })

  it('keeps all bottom-nav jumps behind one pending route lock per page', () => {
    expect(homeSource).toContain(':disabled="Boolean(navigatingRoute)"')

    for (const [name, source] of pages) {
      expect(source, name).toContain("const navigatingRoute = ref<AppRoute | ''>('')")
      expect(source, name).toContain('shouldIgnoreCustomerBottomNavTap')
      expect(source, name).toContain(':disabled="Boolean(navigatingRoute)"')
    }
  })

  it('routes mine to a minimal page instead of showing old placeholder toasts', () => {
    expect(bottomNavConfigSource).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(mineSource).toContain('客户中心暂未开放')

    for (const [name, source] of pages) {
      expect(source, name).toContain('goMine')
      expect(source, name).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
      expect(source, name).not.toContain('我的为' + legacyVisualEntryCopy)
      expect(source, name).not.toContain('我的页面需' + legacySeparatePrdCopy + ' 接入')
      expect(source, name).not.toContain('我的页面需要' + legacySeparatePrdCopy + ' 接入')
      expect(source, name).not.toContain(legacySeparatePrdCopy)
      expect(source, name).not.toContain(legacyShoppingBagSeparatePrdCopy)
      expect(source, name).not.toContain(legacyFavoritesSeparatePrdCopy)
    }
  })
})
