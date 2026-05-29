import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer product detail real checkout authorization wiring', () => {
  it('loads and displays product-level favorite state from the Module C facade', () => {
    expect(source).toContain('getCloudBaseCustomerFavoriteProductsView')
    expect(source).toContain('const isFavorite = computed(() =>')
    expect(source).toContain('favoriteProductsView.value.items.some((item) => item.productId === productId.value)')
    expect(source).toContain(':class="{ active: isFavorite, busy: isFavoriteBusy }"')
    expect(source).toContain("{{ isFavorite ? '♥' : '♡' }}")
    expect(source).toContain('favoriteButtonLabel')
  })

  it('favorites and unfavorites the current product through product-level Module C commands', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('const selectSku'))
    const invalidationSource = source.slice(
      source.indexOf('const hasExpectedToggleInvalidation'),
      source.indexOf('const toggleFavorite'),
    )

    expect(toggleSource).toContain('favoriteCloudBaseCustomerProduct(productId.value, undefined, previousFavoriteView)')
    expect(toggleSource).toContain('unfavoriteCloudBaseCustomerProduct(productId.value, undefined, previousFavoriteView)')
    expect(invalidationSource).toContain('customer-favorites:')
    expect(invalidationSource).toContain('customer-product-detail:${productId.value}:v1')
    expect(toggleSource).not.toContain('skuId')
    expect(toggleSource).not.toContain('requestPhoneCode')
    expect(toggleSource).not.toContain('refreshView(')
  })

  it('dedupes repeated favorite toggle taps while a product detail write is pending', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('const selectSku'))
    const busyGuardIndex = toggleSource.indexOf('if (!viewModel.value.product || isFavoriteBusy.value)')
    const favoriteCommandIndex = toggleSource.indexOf('favoriteCloudBaseCustomerProduct(productId.value')
    const unfavoriteCommandIndex = toggleSource.indexOf('unfavoriteCloudBaseCustomerProduct(productId.value')

    expect(toggleSource).toContain('isFavoriteBusy.value = true')
    expect(toggleSource).toContain('isFavoriteBusy.value = false')
    expect(busyGuardIndex).toBeGreaterThanOrEqual(0)
    expect(busyGuardIndex).toBeLessThan(favoriteCommandIndex)
    expect(busyGuardIndex).toBeLessThan(unfavoriteCommandIndex)
  })

  it('keeps product detail context when favorite toggle fails', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('const selectSku'))

    expect(toggleSource).toContain('const previousFavoriteView = favoriteProductsView.value')
    expect(toggleSource).toContain('favoriteProductsView.value = result.view')
    expect(toggleSource).toContain('favoriteMessage.value')
    expect(toggleSource).not.toContain('viewModel.value =')
    expect(toggleSource).not.toContain('isDetailLoading.value = true')
  })

  it('uses the CloudBase WeChat auth service for customer checkout', () => {
    expect(source).toContain('createCloudBaseWechatAuthService')
    expect(source).toContain('const customerAuthService = createCloudBaseWechatAuthService()')
    expect(source).toContain('authService: customerAuthService')
  })

  it('requests a WeChat phone code before submitting the order', () => {
    expect(source).toContain('open-type="getPhoneNumber"')
    expect(source).toContain('@getphonenumber="handlePhoneNumberAuthorization"')
    expect(source).toContain('requestPhoneNumber: requestPhoneCode')
  })

  it('lets sold-out SKU pills stay tappable so selected spec and stock labels can update', () => {
    expect(source).toContain(':class="{ active: sku.isSelected, disabled: sku.isDisabled }"')
    expect(source).not.toContain(':disabled="sku.isDisabled"')
    expect(source).toContain("return selectedSku.value.isDisabled ? '暂无库存' : `库存 ${selectedSku.value.stock}`")
  })

  it('switches SKU state locally without refetching the product detail snapshot', () => {
    expect(source).toContain('selectCloudBaseCustomerProductSkuInView')
    expect(source).not.toContain('selectCloudBaseCustomerProductSku,')
    expect(source).not.toContain('selectCloudBaseCustomerProductSku(')
    expect(source).toContain('const selectSku = (skuId: string) => {')
    expect(source).toContain('viewModel.value = result.view')
  })

  it('renders the product description from the product detail ViewModel', () => {
    expect(source).toContain('{{ viewModel.descriptionText }}')
    expect(source).toContain('class="detail-copy"')
    expect(source).not.toContain('利落廓形与精致比例适合通勤和晚间场景。浏览本页不会触发登录，下单时才进入微信授权。')
  })
  it('adds the selected SKU to the customer shopping bag without changing checkout wiring', () => {
    expect(source).toContain('addCloudBaseCustomerShoppingBagItem')
    expect(source).toContain('const addToShoppingBag = async () => {')
    expect(source).toContain('@tap="addToShoppingBag"')
    expect(source).toContain('submitCloudBaseCustomerProductDetailOrder')
    expect(source).toContain('confirmPhoneAuthorization')
  })

  it('does not route favorites through checkout, stock, or shopping-bag commands', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('const selectSku'))

    expect(toggleSource).not.toContain('submitCloudBaseCustomerProductDetailOrder')
    expect(toggleSource).not.toContain('addCloudBaseCustomerShoppingBagItem')
    expect(toggleSource).not.toContain('selectedStockLabel')
    expect(toggleSource).not.toContain('canSubmitOrder')
  })
})
