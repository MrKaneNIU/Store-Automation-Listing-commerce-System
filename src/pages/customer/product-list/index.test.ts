import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

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

  it('keeps previous product list cards visible when favorite toggle fails', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('onShow(() =>'))

    expect(toggleSource).toContain('const previousFavoriteView = favoriteProductsView.value')
    expect(toggleSource).toContain('favoriteProductsView.value = result.view')
    expect(toggleSource).toContain('favoriteMessage.value')
    expect(toggleSource).not.toContain('products.value =')
    expect(toggleSource).not.toContain('isLoading.value = true')
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
    expect(source).toContain('routes.customerShoppingBag')
    expect(source).toContain('goShoppingBag')
    expect(source).toContain('@tap="goShoppingBag"')
    expect(source).not.toContain('璐墿琚嬩负瑙嗚鍏ュ彛')
  })
})
