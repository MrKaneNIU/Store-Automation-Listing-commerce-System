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

  it('keeps product detail browsing quiet when favorite snapshot loading fails', () => {
    const loadFavoriteSource = source.slice(
      source.indexOf('const loadFavoriteState'),
      source.indexOf('const loadInitialView'),
    )

    expect(loadFavoriteSource).toContain('getCloudBaseCustomerFavoriteProductsView')
    expect(loadFavoriteSource).toContain('favoriteProductsView.value = keepPreviousFavoritesOnFailure')
    expect(loadFavoriteSource).toContain("favoriteMessage.value = ''")
    expect(loadFavoriteSource).not.toContain('favoriteMessage.value = favoriteProductsView.value.failureMessage')
    expect(loadFavoriteSource).not.toContain('viewModel.value =')
    expect(loadFavoriteSource).not.toContain('isDetailLoading.value = true')
    expect(loadFavoriteSource).not.toContain('refreshView(')
  })

  it('uses the CloudBase WeChat auth service for customer checkout', () => {
    expect(source).toContain('createCloudBaseWechatAuthService')
    expect(source).toContain('const customerAuthService = createCloudBaseWechatAuthService()')
    expect(source).toContain('authService: customerAuthService')
  })

  it('prompts account login before submitting the order without requesting a phone code', () => {
    expect(source).toContain('@tap="submitOrder"')
    expect(source).toContain('confirmLogin: confirmCustomerLoginForOrder')
    expect(source).toContain("title: '请先登录'")
    expect(source).toContain("content: '登录账户后即可提交订单。'")
    expect(source).toContain("confirmText: '登录下单'")
    expect(source).not.toContain('open-type="getPhoneNumber"')
    expect(source).not.toContain('@getphonenumber')
    expect(source).not.toContain('requestPhoneNumber')
    expect(source).not.toContain('手机号授权未完成')
    expect(source).not.toContain('confirmPhoneAuthorization')
  })

  it('uses a single account-login order submit path regardless of phone binding state', () => {
    expect(source).toContain('@tap="submitOrder"')
    expect(source).not.toContain('const hasBoundCustomerPhone = ref(false)')
    expect(source).not.toContain('v-if="hasBoundCustomerPhone"')
    expect(source).not.toContain('@tap="submitBoundOrder"')
    expect(source).not.toContain('open-type="getPhoneNumber"')
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
    expect(source).toContain('confirmCustomerLoginForOrder')
  })

  it('loads checkout addresses and passes only addressId into product-detail order submission', () => {
    expect(source).toContain('getCloudBaseCustomerAddressBookView')
    expect(source).toContain('selectedAddressId')
    expect(source).toContain('@tap="selectAddress(address.id)"')
    expect(source).toContain("message.value = '请选择收货地址'")
    expect(source).toContain('addressId: selectedAddressId.value')
    expect(source).not.toContain('shippingAddress:')
    expect(source).not.toContain('contactName: selectedAddress')
  })

  it('does not route favorites through checkout, stock, or shopping-bag commands', () => {
    const toggleSource = source.slice(source.indexOf('const toggleFavorite'), source.indexOf('const selectSku'))

    expect(toggleSource).not.toContain('submitCloudBaseCustomerProductDetailOrder')
    expect(toggleSource).not.toContain('addCloudBaseCustomerShoppingBagItem')
    expect(toggleSource).not.toContain('selectedStockLabel')
    expect(toggleSource).not.toContain('canSubmitOrder')
  })

  it('refreshes the detail gallery once after a product image load error', () => {
    expect(source).toContain('@error="handleProductImageError"')
    expect(source).toContain('hasRetriedProductImage')
    expect(source).toContain('const handleProductImageError = () =>')
    expect(source).toContain('void refreshView({ showLoading: false })')
    expect(source).toContain('viewModel.product.imageStatus')
    expect(source).toContain('viewModel.product.imageFallbackReason')
  })
})
