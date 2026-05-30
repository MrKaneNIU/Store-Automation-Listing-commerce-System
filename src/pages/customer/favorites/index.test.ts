import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const routesSource = readFileSync(path.resolve(__dirname, '../../../app/routes.ts'), 'utf8')
const pagesJson = readFileSync(path.resolve(__dirname, '../../../pages.json'), 'utf8')
const legacyVisualEntryCopy = '视觉' + '入口'
const legacySeparatePrdCopy = '单独' + ' PRD'

describe('customer favorites page UI integration', () => {
  it('registers the customer favorites page route', () => {
    expect(routesSource).toContain("customerFavorites: '/pages/customer/favorites/index'")
    expect(pagesJson).toContain('"path": "pages/customer/favorites/index"')
  })

  it('uses only the Module C page-facing favorites facade and ViewModel', () => {
    expect(source).toContain("from '../../../features/cloudbase-mall/customer-favorites'")
    expect(source).toContain("from '../../../features/customer-favorites/customer-favorites'")
    expect(source).not.toContain('services/repositories')
    expect(source).not.toContain('mall-api-client')
    expect(source).not.toContain('collection(')
    expect(source).not.toContain('favoriteCustomerProduct(')
    expect(source).not.toContain('unfavoriteCustomerProduct(')
  })

  it('renders saved product cards and required page states', () => {
    expect(source).toContain('v-for="item in viewModel.items"')
    expect(source).toContain('viewModel.loadingState ===')
    expect(source).toContain('viewModel.emptyMessage')
    expect(source).toContain('viewModel.failureMessage')
    expect(source).toContain('item.isUnavailable')
    expect(source).toContain('item.availabilityLabel')
    expect(source).toContain('@error="markImageFailed(item.productId)"')
  })

  it('removes favorites through the favorites remove command without SKU or checkout wiring', () => {
    expect(source).toContain('removeCloudBaseCustomerFavoriteProduct(productId')
    expect(source).not.toContain('skuId')
    expect(source).not.toContain('submitOrder')
    expect(source).not.toContain('checkout')
    expect(source).not.toContain('stock')
    expect(source).not.toContain('getPhoneNumber')
  })

  it('keeps previous favorite cards visible when refresh or retry fails', () => {
    expect(source).toContain('const keepPreviousCardsOnFailure = (')
    expect(source).toContain("nextView.loadingState === 'failed' && previousView.items.length > 0")
    expect(source).toContain('...previousView')
    expect(source).toContain("loadingState: 'failed'")
    expect(source).toContain('failureMessage: nextView.failureMessage')
    expect(source).toContain('const previousView = viewModel.value')
    expect(source).toContain('viewModel.value = keepPreviousCardsOnFailure(nextView, previousView)')
    expect(source).toContain('viewModel.value = keepPreviousCardsOnFailure(view, previousView)')
    expect(source).toContain('viewModel.loadingState === \'failed\'')
    expect(source).toContain('@tap="reload"')
  })

  it('routes shopping-bag and mine through shared bottom-nav routes', () => {
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
    expect(source).toContain('customerBottomNavRoutes.mine')
    expect(source).toContain('@tap="goShoppingBag"')
    expect(source).toContain('@tap="goMine"')
    expect(source).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(source).not.toContain(legacyVisualEntryCopy)
    expect(source).not.toContain(legacySeparatePrdCopy)
  })

  it('keeps current favorites tab from issuing a duplicate redirect', () => {
    expect(source).toContain('currentRoute: customerBottomNavRoutes.favorites')
    expect(source).toContain('shouldIgnoreCustomerBottomNavTap')
    expect(source).toContain('class="tab active"')
    expect(source).toContain(':disabled="Boolean(navigatingRoute)"')
  })
})
