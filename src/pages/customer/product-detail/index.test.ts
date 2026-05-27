import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer product detail real checkout authorization wiring', () => {
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
})
