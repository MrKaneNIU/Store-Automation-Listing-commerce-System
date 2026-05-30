import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const legacyVisualEntryCopy = '视觉' + '入口'
const legacySeparatePrdCopy = '单独' + ' PRD'

describe('customer home bottom navigation', () => {
  it('wires the reserved favorites entry to the favorites page', () => {
    expect(source).toContain('customerBottomNavRoutes.favorites')
    expect(source).toContain('goFavorites')
    expect(source).toContain('@tap="goFavorites"')
    expect(source).not.toContain("showVisualOnlyToast('收藏为" + legacyVisualEntryCopy)
  })

  it('wires the shopping-bag entry to the existing shopping-bag page', () => {
    expect(source).toContain('goShoppingBag')
    expect(source).toContain('@tap="goShoppingBag"')
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
    expect(source).not.toContain("showVisualOnlyToast('购物袋为" + legacyVisualEntryCopy)
  })

  it('wires mine to the customer mine page', () => {
    expect(source).toContain('customerBottomNavRoutes.mine')
    expect(source).toContain('goMine')
    expect(source).toContain('@tap="goMine"')
    expect(source).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(source).not.toContain(legacyVisualEntryCopy)
    expect(source).not.toContain(legacySeparatePrdCopy)
  })

  it('keeps all bottom nav entries behind the shared pending route guard', () => {
    expect(source).toContain('goCustomerBottomNav')
    expect(source).toContain('shouldIgnoreCustomerBottomNavTap')
    expect(source).toContain(':disabled="Boolean(navigatingRoute)"')
    expect(source).toContain('pendingRoute: navigatingRoute.value')
  })
})
