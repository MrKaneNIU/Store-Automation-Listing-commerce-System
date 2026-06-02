import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const readPageFile = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), 'utf8')

const source = readPageFile('index.vue')
const pageStateSource = readPageFile('useCustomerMinePageState.ts')
const routesSource = readFileSync(path.resolve(__dirname, '../../../app/routes.ts'), 'utf8')
const pagesJson = readFileSync(path.resolve(__dirname, '../../../pages.json'), 'utf8')

describe('customer mine UI integration', () => {
  it('keeps the existing customer mine route and page registration', () => {
    expect(routesSource).toContain("customerMine: '/pages/customer/mine/index'")
    expect(pagesJson).toContain('"path": "pages/customer/mine/index"')
    expect(source).toContain('<text class="nav-title">我的</text>')
  })

  it('loads the first screen through the page-facing facade state only', () => {
    expect(source).toContain("import { useCustomerMinePageState } from './useCustomerMinePageState'")
    expect(source).toContain('const mineState = useCustomerMinePageState()')
    expect(source).toContain('onShow(() =>')
    expect(source).toContain('mineState.loadSnapshot')
    expect(pageStateSource).toContain('loadCustomerMineSnapshot')

    expect(source).not.toContain('cloudbase')
    expect(source).not.toContain('CloudBase')
    expect(source).not.toContain('mallApi')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('getPhoneNumber')
    expect(source).not.toContain('openid')
  })

  it('renders identity, phone, loading, failure, retry, and recent-order empty states', () => {
    expect(source).toContain('viewModel.identityLabel')
    expect(source).toContain('viewModel.identityDisplayName')
    expect(source).toContain('viewModel.phoneLabel')
    expect(source).toContain('viewModel.phoneDisplayText')
    expect(source).toContain("viewModel.loadingState === 'loading'")
    expect(source).toContain("viewModel.loadingState === 'failed'")
    expect(source).toContain('@tap="retry"')
    expect(source).toContain('viewModel.recentOrdersEmptyMessage')
    expect(source).toContain('去逛商品')
  })

  it('renders recent order summaries without order mutation actions', () => {
    expect(source).toContain('v-for="order in viewModel.recentOrders"')
    expect(source).toContain('order.primaryProductName')
    expect(source).toContain('order.statusLabel')
    expect(source).toContain('order.itemCountLabel')
    expect(source).toContain('order.totalAmountText')
    expect(source).not.toContain('confirmOrder')
    expect(source).not.toContain('cancelOrder')
    expect(source).not.toContain('payOrder')
    expect(source).not.toContain('refund')
    expect(source).not.toContain('logistics')
  })

  it('wires favorites and shopping-bag utility entries to existing customer routes', () => {
    expect(source).toContain('v-for="entry in viewModel.utilities"')
    expect(source).toContain('@tap="navigateUtility(entry.route)"')
    expect(source).toContain('route === customerBottomNavRoutes.favorites')
    expect(source).toContain('route === customerBottomNavRoutes.shoppingBag')
    expect(source).toContain('goFavorites()')
    expect(source).toContain('goShoppingBag()')
  })

  it('keeps merchant, admin, staff, and workbench entries out of the Mine page', () => {
    expect(source).not.toContain('merchant')
    expect(source).not.toContain('admin')
    expect(source).not.toContain('staff')
    expect(source).not.toContain('workbench')
    expect(source).not.toContain('owner')
  })

  it('preserves the shared bottom-nav matrix and current Mine tab behavior', () => {
    expect(source).toContain('customerBottomNavRoutes.home')
    expect(source).toContain('customerBottomNavRoutes.catalog')
    expect(source).toContain('customerBottomNavRoutes.shoppingBag')
    expect(source).toContain('customerBottomNavRoutes.favorites')
    expect(source).toContain('customerBottomNavRoutes.mine')
    expect(source).toContain('currentRoute: customerBottomNavRoutes.mine')
    expect(source).toContain('<button class="tab active" :disabled="Boolean(navigatingRoute)" hover-class="tab-pressed" @tap="goMine">')
  })

  it('keeps the existing Mine bottom-nav labels and aligns with the customer tab bar layout', () => {
    expect(source).toContain('<text class="tab-icon">⌂</text>')
    expect(source).toContain('<text>首页</text>')
    expect(source).toContain('<text class="tab-icon">◇</text>')
    expect(source).toContain('<text>商品</text>')
    expect(source).toContain('<text class="tab-icon">▢</text>')
    expect(source).toContain('<text>购物袋</text>')
    expect(source).toContain('<text class="tab-icon">♡</text>')
    expect(source).toContain('<text>收藏</text>')
    expect(source).toContain('<text class="tab-icon">○</text>')
    expect(source).toContain('<text>我的</text>')
    expect(source).toContain('right: 0;')
    expect(source).toContain('bottom: 0;')
    expect(source).toContain('display: flex;')
    expect(source).toContain('border-top-left-radius: 38rpx;')
    expect(source).toContain('min-height: 104rpx;')
    expect(source).toContain('.tab.active')
    expect(source).toContain('color: #050505;')
    expect(source).not.toContain('background: #222222;')
    expect(source).not.toContain('grid-template-columns: repeat(5, 1fr);')
    expect(source).not.toContain('CUSTOMER')
    expect(source).not.toContain('<text class="title">Mine</text>')
    expect(source).not.toContain('Retry')
    expect(source).not.toContain('Recent orders')
    expect(source).not.toContain('Browse products')
    expect(source).not.toContain('<text>Home</text>')
    expect(source).not.toContain('<text>Catalog</text>')
    expect(source).not.toContain('<text>Bag</text>')
    expect(source).not.toContain('<text>Saved</text>')
  })

  it('does not use order cover images, so no image fallback is required in Mine UI', () => {
    expect(source).not.toContain('<image')
    expect(source).not.toContain('@error="markImageFailed')
  })
})
