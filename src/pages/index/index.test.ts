import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer home bottom navigation', () => {
  it('wires the reserved favorites entry to the favorites page', () => {
    expect(source).toContain('customerBottomNavRoutes.favorites')
    expect(source).toContain('goFavorites')
    expect(source).toContain('@tap="goFavorites"')
    expect(source).not.toContain("showVisualOnlyToast('收藏为视觉入口")
  })

  it('wires the shopping-bag entry to the existing shopping-bag page', () => {
    expect(source).toContain('goShoppingBag')
    expect(source).toContain('@tap="goShoppingBag"')
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
    expect(source).not.toContain("showVisualOnlyToast('购物袋为视觉入口")
  })

  it('keeps mine as the unified placeholder', () => {
    expect(source).toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(source).not.toContain("showVisualOnlyToast('我的为视觉入口")
  })
})
