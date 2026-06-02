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
    expect(source).toContain("from './useCustomerFavoritesPageState'")
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
    const pageStateSource = readFileSync(path.resolve(__dirname, 'useCustomerFavoritesPageState.ts'), 'utf8')
    const combinedSource = `${source}\n${pageStateSource}`

    expect(source).toContain('removeFavorite(item.productId)')
    expect(pageStateSource).toContain('removeCloudBaseCustomerFavoriteProduct(productId')
    expect(combinedSource).not.toContain('skuId')
    expect(combinedSource).not.toContain('submitOrder')
    expect(combinedSource).not.toContain('checkout')
    expect(combinedSource).not.toContain('stock')
    expect(combinedSource).not.toContain('getPhoneNumber')
  })

  it('keeps previous favorite cards visible when refresh or retry fails', () => {
    const pageStateSource = readFileSync(path.resolve(__dirname, 'useCustomerFavoritesPageState.ts'), 'utf8')

    expect(pageStateSource).toContain('const keepPreviousCardsOnFailure = (')
    expect(pageStateSource).toContain("nextView.loadingState === 'failed' && previousView.items.length > 0")
    expect(pageStateSource).toContain('...previousView')
    expect(pageStateSource).toContain("loadingState: 'failed'")
    expect(pageStateSource).toContain('failureMessage: nextView.failureMessage')
    expect(pageStateSource).toContain('const previousView = viewModel.value')
    expect(pageStateSource).toContain('viewModel.value = keepPreviousCardsOnFailure(nextView, previousView)')
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

  it('deduplicates and short-caches favorites snapshot loads', () => {
    const pageStateSource = readFileSync(path.resolve(__dirname, 'useCustomerFavoritesPageState.ts'), 'utf8')

    expect(pageStateSource).toContain('let pendingSnapshot: Promise<void> | null = null')
    expect(pageStateSource).toContain('if (pendingSnapshot)')
    expect(pageStateSource).toContain('cacheTtlMs: 3000')
    expect(pageStateSource).toContain('deps.now() - lastLoadedAt < deps.cacheTtlMs')
    expect(pageStateSource).toContain('hasLoadedSnapshot = true')
    expect(pageStateSource).toContain('lastLoadedAt = deps.now()')
  })
})
