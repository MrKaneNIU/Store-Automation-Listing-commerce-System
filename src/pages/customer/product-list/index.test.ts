import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const legacyVisualEntryCopy = '视觉' + '入口'
const legacySeparatePrdCopy = '单独' + ' PRD'

describe('customer product list shopping bag entry', () => {
  it('loads and displays product-level favorite state from the Module C facade', () => {
    expect(source).toContain('getCloudBaseCustomerFavoriteProductsView')
    expect(source).toContain('const isFavoriteProduct = (productId: string): boolean =>')
    expect(source).toContain('favoriteProductsView.value.items.some((item) => item.productId === productId)')
    expect(source).toContain(':class="{ active: isFavoriteProduct(product.id), busy: favoriteBusyProductId === product.id }"')
    expect(source).toContain("{{ isFavoriteProduct(product.id) ? '♥' : '♡' }}")
  })

  it('favorites and unfavorites list cards through product-level Module C commands', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))
    const invalidationSource = source.slice(
      source.indexOf('const hasExpectedListToggleInvalidation'),
      source.indexOf('const toggleFavorite'),
    )

    expect(toggleSource).toContain('favoriteCloudBaseCustomerProduct(productId, undefined, previousFavoriteView)')
    expect(toggleSource).toContain('unfavoriteCloudBaseCustomerProduct(productId, undefined, previousFavoriteView)')
    expect(invalidationSource).toContain('customer-favorites:')
    expect(toggleSource).not.toContain('skuId')
    expect(toggleSource).not.toContain('requestPhoneCode')
    expect(toggleSource).not.toContain('refreshView(')
  })

  it('dedupes repeated favorite toggle taps while a list-card write is pending', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))
    const busyGuardIndex = toggleSource.indexOf('if (favoriteBusyProductId.value)')
    const favoriteCommandIndex = toggleSource.indexOf('favoriteCloudBaseCustomerProduct(productId')
    const unfavoriteCommandIndex = toggleSource.indexOf('unfavoriteCloudBaseCustomerProduct(productId')

    expect(toggleSource).toContain('favoriteBusyProductId.value = productId')
    expect(toggleSource).toContain("favoriteBusyProductId.value = ''")
    expect(busyGuardIndex).toBeGreaterThanOrEqual(0)
    expect(busyGuardIndex).toBeLessThan(favoriteCommandIndex)
    expect(busyGuardIndex).toBeLessThan(unfavoriteCommandIndex)
  })

  it('keeps previous product list cards visible when favorite toggle fails', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))

    expect(toggleSource).toContain('const previousFavoriteView = favoriteProductsView.value')
    expect(toggleSource).toContain('favoriteProductsView.value = result.view')
    expect(toggleSource).toContain('favoriteMessage.value')
    expect(toggleSource).not.toContain('products.value =')
    expect(toggleSource).not.toContain('isLoading.value = true')
  })

  it('keeps product browsing state independent when favorite snapshot loading fails', () => {
    const loadFavoriteSource = source.slice(
      source.indexOf('const loadFavoriteState'),
      source.indexOf('const isFavoriteProduct'),
    )

    expect(loadFavoriteSource).toContain('getCloudBaseCustomerFavoriteProductsView')
    expect(loadFavoriteSource).toContain('favoriteProductsView.value = keepPreviousFavoritesOnFailure')
    expect(loadFavoriteSource).toContain("favoriteMessage.value = ''")
    expect(loadFavoriteSource).not.toContain('favoriteMessage.value = favoriteProductsView.value.failureMessage')
    expect(loadFavoriteSource).not.toContain('products.value =')
    expect(loadFavoriteSource).not.toContain('emptyMessage.value =')
    expect(loadFavoriteSource).not.toContain('isLoading.value = true')
    expect(loadFavoriteSource).not.toContain('refreshView(')
  })

  it('does not route favorites through checkout, stock, or shopping-bag commands', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))

    expect(toggleSource).not.toContain('submitCloudBaseCustomerProductDetailOrder')
    expect(toggleSource).not.toContain('addCloudBaseCustomerShoppingBagItem')
    expect(toggleSource).not.toContain('stock')
    expect(toggleSource).not.toContain('canSubmitOrder')
  })

  it('does not change product visibility or publish eligibility while wiring favorites', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))

    expect(source).toContain('getCloudBaseCustomerProductListView')
    expect(toggleSource).not.toContain('visibility')
    expect(toggleSource).not.toContain('publish')
    expect(toggleSource).not.toContain('isPublished')
    expect(toggleSource).not.toContain('getCloudBaseCustomerProductListView')
  })

  it('wires the reserved shopping-bag bottom-nav entry to the shopping-bag page', () => {
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
    expect(source).toContain('goShoppingBag')
    expect(source).toContain('@tap="goShoppingBag"')
  })

  it('wires the reserved favorites bottom-nav entry to the favorites page', () => {
    expect(source).toContain('customerBottomNavRoutes.favorites')
    expect(source).toContain('goFavorites')
    expect(source).toContain('@tap="goFavorites"')
    expect(source).not.toContain("showVisualOnlyToast('收藏为" + legacyVisualEntryCopy)
  })

  it('wires the mine bottom-nav entry to the customer mine page', () => {
    expect(source).toContain('customerBottomNavRoutes.mine')
    expect(source).toContain('goMine')
    expect(source).toContain('@tap="goMine"')
    expect(source).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(source).not.toContain(legacySeparatePrdCopy)
  })

  it('blocks rapid bottom-nav switching with one shared pending route guard', () => {
    expect(source).toContain("const navigatingRoute = ref<AppRoute | ''>('')")
    expect(source).toContain('goCustomerBottomNav')
    expect(source).toContain('shouldIgnoreCustomerBottomNavTap')
    expect(source).toContain('pendingRoute: navigatingRoute.value')
    expect(source).toContain(':disabled="Boolean(navigatingRoute)"')
    expect(source).not.toContain('isShoppingBagNavigating')
    expect(source).not.toContain('isFavoritesNavigating')
  })

  it('refreshes a product image once after the mini program image component reports a load error', () => {
    expect(source).toContain('@error="handleProductImageError(product.id)"')
    expect(source).toContain('failedImageProductIds')
    expect(source).toContain('const handleProductImageError = (productId: string) =>')
    expect(source).toContain('void refreshView({ showLoading: false })')
    expect(source).toContain('product.imageStatus')
    expect(source).toContain('product.imageFallbackReason')
  })
})
