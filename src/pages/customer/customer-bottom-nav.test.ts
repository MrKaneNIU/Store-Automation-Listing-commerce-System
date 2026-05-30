import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const readPage = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), 'utf8')

const homeSource = readPage('../index/index.vue')
const productListSource = readPage('product-list/index.vue')
const favoritesSource = readPage('favorites/index.vue')
const shoppingBagSource = readPage('shopping-bag/index.vue')
const bottomNavConfigSource = readPage('customer-bottom-nav.ts')

const pages = [
  ['home', homeSource],
  ['product list', productListSource],
  ['favorites', favoritesSource],
  ['shopping bag', shoppingBagSource],
] as const

describe('customer bottom navigation matrix', () => {
  it('keeps existing customer nav routes in a shared bottom-nav config', () => {
    expect(bottomNavConfigSource).toContain('customerBottomNavRoutes')
    expect(bottomNavConfigSource).toContain('home: routes.customerHome')
    expect(bottomNavConfigSource).toContain('catalog: routes.customerProductList')
    expect(bottomNavConfigSource).toContain('favorites: routes.customerFavorites')
    expect(bottomNavConfigSource).toContain('shoppingBag: routes.customerShoppingBag')
  })

  it('wires home shopping-bag entry to the existing shopping-bag route', () => {
    expect(homeSource).toContain('goShoppingBag')
    expect(homeSource).toContain('@tap="goShoppingBag"')
    expect(homeSource).toContain('customerBottomNavRoutes.shoppingBag')
    expect(homeSource).not.toContain("showVisualOnlyToast('购物袋为视觉入口")
    expect(homeSource).not.toContain('真实购物袋能力需单独 PRD')
  })

  it('wires shopping-bag favorites entry to the existing favorites route', () => {
    expect(shoppingBagSource).toContain('goFavorites')
    expect(shoppingBagSource).toContain('@tap="goFavorites"')
    expect(shoppingBagSource).toContain('customerBottomNavRoutes.favorites')
    expect(shoppingBagSource).not.toContain("showToast('收藏能力需单独 PRD 接入")
  })

  it('keeps favorites page shopping-bag entry routed to the existing shopping-bag route', () => {
    expect(favoritesSource).toContain('goShoppingBag')
    expect(favoritesSource).toContain('@tap="goShoppingBag"')
    expect(favoritesSource).toContain('customerBottomNavRoutes.shoppingBag')
    expect(favoritesSource).not.toContain("showToast('购物袋")
  })

  it('keeps product-list favorites and shopping-bag entries routed to existing routes', () => {
    expect(productListSource).toContain('goFavorites')
    expect(productListSource).toContain('@tap="goFavorites"')
    expect(productListSource).toContain('customerBottomNavRoutes.favorites')
    expect(productListSource).toContain('goShoppingBag')
    expect(productListSource).toContain('@tap="goShoppingBag"')
    expect(productListSource).toContain('customerBottomNavRoutes.shoppingBag')
    expect(productListSource).not.toContain("showVisualOnlyToast('收藏为视觉入口")
  })

  it('keeps all real bottom-nav jumps behind pending or busy protection', () => {
    expect(homeSource).toContain(':disabled="Boolean(navigatingRoute)"')
    expect(productListSource).toContain(':disabled="isShoppingBagNavigating"')
    expect(productListSource).toContain(':disabled="isFavoritesNavigating"')
    expect(favoritesSource).toContain(':disabled="isShoppingBagNavigating"')
    expect(shoppingBagSource).toContain(':disabled="isFavoritesNavigating"')
  })

  it('keeps mine as one unified placeholder without adding a customer mine route', () => {
    expect(bottomNavConfigSource).toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(bottomNavConfigSource).toContain('我的页面暂未开放')

    for (const [name, source] of pages) {
      expect(source, name).toContain('CUSTOMER_MINE_PLACEHOLDER')
      expect(source, name).not.toContain('我的为视觉入口')
      expect(source, name).not.toContain('我的页面需单独 PRD 接入')
      expect(source, name).not.toContain('我的页面需要单独 PRD 接入')
    }
  })
})
