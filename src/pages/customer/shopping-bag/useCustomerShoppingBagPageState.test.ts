import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createCustomerShoppingBagView, type CustomerShoppingBagViewModel } from '../../../features/customer-shopping-bag/customer-shopping-bag'
import type {
  CloudBaseCustomerShoppingBagCheckoutResult,
  CloudBaseCustomerShoppingBagCommandResult,
} from '../../../features/cloudbase-mall/customer-shopping-bag'
import type { CustomerShoppingBagSnapshot } from '../../../services/cloudbase/mall-api-client'
import { createCustomerShoppingBagPageState } from './useCustomerShoppingBagPageState'
import type { CustomerRuntimeRequestLogEntry } from '../../../services/performance/customer-runtime-request-log'
import {
  createCustomerAddressBookView,
  type CustomerAddressBookView,
} from '../../../features/customer-address/customer-address'

const pageSource = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const legacyVisualEntryCopy = '视觉' + '入口'
const legacySeparatePrdCopy = '单独' + ' PRD'
const legacyFavoritesSeparatePrdCopy = '收藏能力需' + legacySeparatePrdCopy + ' 接入'

const createSnapshot = (quantity: number): CustomerShoppingBagSnapshot => ({
  customerId: 'customer-1',
  items: [
    {
      id: 'bag-item-1',
      productId: 'product-1',
      skuId: 'sku-1',
      productName: 'Cotton Shirt',
      skuSpec: 'Black/M',
      quantity,
      unitPrice: 129,
      lineTotal: 129 * quantity,
      mainImageUrl: '/static/logo.png',
      availability: 'available',
      availabilityLabel: 'Available',
      isAvailableForCheckout: true,
      isSelected: true,
    },
  ],
  totalQuantity: quantity,
  selectedQuantity: quantity,
  selectedSubtotal: 129 * quantity,
  unavailableCount: 0,
  serverTime: '2026-05-28T00:00:00.000Z',
})

const createCommandResult = (view: CustomerShoppingBagViewModel): CloudBaseCustomerShoppingBagCommandResult => ({
  status: 'succeeded',
  message: 'Quantity updated',
  invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1'],
  view,
})

const createCheckoutResult = (view: CustomerShoppingBagViewModel): CloudBaseCustomerShoppingBagCheckoutResult => ({
  status: 'succeeded',
  message: 'Order submitted',
  invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1', 'customer-mine:customer-1:v1'],
  view,
  order: {
    id: 'order-1',
    customerName: 'Wechat Customer',
    customerPhone: '13800000000',
    customerId: 'customer-1',
    customerAuthSource: 'wechat',
    status: 'pending_merchant_confirm',
    items: [
      {
        skuId: 'sku-1',
        productId: 'product-1',
        productName: 'Cotton Shirt',
        productCode: 'A1023',
        spec: 'Black/M',
        salePrice: 129,
        quantity: 1,
      },
    ],
    totalAmount: 129,
    createdAt: '2026-05-28T00:00:00.000Z',
    updatedAt: '2026-05-28T00:00:00.000Z',
  },
  removedItemIds: ['bag-item-1'],
})

const createAddressView = (): CustomerAddressBookView =>
  createCustomerAddressBookView({
    customerId: 'customer-1',
    addresses: [{
      id: 'address-1',
      customerId: 'customer-1',
      contactName: 'Ada',
      phoneNumber: '13800000000',
      province: '上海',
      city: '上海市',
      district: '静安区',
      detail: '南京西路 1 号',
      isDefault: true,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    }],
    defaultAddressId: 'address-1',
    serverTime: '2026-06-11T00:00:00.000Z',
  })

describe('customer shopping bag page state', () => {
  it('deduplicates concurrent snapshot loads', async () => {
    const loader = vi.fn(async () => createCustomerShoppingBagView(createSnapshot(1)))
    const logs: CustomerRuntimeRequestLogEntry[] = []
    const state = createCustomerShoppingBagPageState({
      loadView: loader,
      requestLogger: (entry) => logs.push(entry),
    })

    await Promise.all([state.loadSnapshot({ showLoading: true }), state.loadSnapshot({ showLoading: true })])

    expect(loader).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.totalQuantity).toBe(1)
    expect(state.viewModel.value.loadingState).toBe('idle')
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'getCustomerShoppingBagSnapshot',
        source: 'onShow',
        status: 'success',
        deduped: true,
      }),
      expect.objectContaining({
        action: 'getCustomerShoppingBagSnapshot',
        source: 'onShow',
        status: 'success',
        deduped: false,
      }),
    ]))
  })

  it('keeps the cached view visible while refreshing on return entry', async () => {
    let currentTime = 1000
    let resolveRefresh: (view: CustomerShoppingBagViewModel) => void = () => {}
    const firstView = createCustomerShoppingBagView(createSnapshot(1))
    const refreshedView = createCustomerShoppingBagView(createSnapshot(2))
    const loader = vi
      .fn()
      .mockResolvedValueOnce(firstView)
      .mockImplementationOnce(() => new Promise<CustomerShoppingBagViewModel>((resolve) => {
        resolveRefresh = resolve
      }))
    const state = createCustomerShoppingBagPageState({
      loadView: loader,
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.handlePageShow()
    currentTime += 3001
    const refreshPromise = state.handlePageShow()

    expect(state.viewModel.value.items).toEqual(firstView.items)
    expect(state.viewModel.value.loadingState).toBe('refreshing')

    resolveRefresh(refreshedView)
    await refreshPromise

    expect(state.viewModel.value.totalQuantity).toBe(2)
  })

  it('skips quick tab-return reloads while the snapshot is still fresh', async () => {
    let currentTime = 1000
    const loader = vi.fn(async () => createCustomerShoppingBagView(createSnapshot(1)))
    const state = createCustomerShoppingBagPageState({
      loadView: loader,
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.handlePageShow()
    currentTime += 500
    await state.handlePageShow()

    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('prevents stale snapshot responses from overwriting a newer write command view', async () => {
    let resolveLoad: (view: CustomerShoppingBagViewModel) => void = () => {}
    const commandView = createCustomerShoppingBagView(createSnapshot(2))
    const staleView = createCustomerShoppingBagView(createSnapshot(1))
    const state = createCustomerShoppingBagPageState({
      loadView: () => new Promise<CustomerShoppingBagViewModel>((resolve) => {
        resolveLoad = resolve
      }),
      updateQuantity: vi.fn(async () => createCommandResult(commandView)),
    })

    const load = state.loadSnapshot({ showLoading: true })
    await state.updateQuantity('bag-item-1', 2)
    resolveLoad(staleView)
    await load

    expect(state.viewModel.value.totalQuantity).toBe(2)
  })

  it('keeps the previous usable view when a return refresh fails', async () => {
    let currentTime = 1000
    const firstView = createCustomerShoppingBagView(createSnapshot(1))
    const loader = vi
      .fn()
      .mockResolvedValueOnce(firstView)
      .mockRejectedValueOnce(new Error('network timeout'))
    const state = createCustomerShoppingBagPageState({
      loadView: loader,
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.handlePageShow()
    currentTime += 3001
    await state.handlePageShow()

    expect(state.viewModel.value.items).toEqual(firstView.items)
    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.viewModel.value.failureMessage).toBe('network timeout')
  })

  it('maps write commands to refreshed views and invalidated snapshot keys', async () => {
    const initialView = createCustomerShoppingBagView(createSnapshot(1))
    const updatedView = createCustomerShoppingBagView(createSnapshot(2))
    const updateQuantity = vi.fn(async () => createCommandResult(updatedView))
    const state = createCustomerShoppingBagPageState({
      loadView: vi.fn(async () => initialView),
      updateQuantity,
    })

    await state.handlePageShow()
    await state.updateQuantity('bag-item-1', 2)

    expect(updateQuantity).toHaveBeenCalledWith('bag-item-1', 2, initialView)
    expect(state.message.value).toBe('Quantity updated')
    expect(state.invalidatedSnapshotKeys.value).toEqual(['customer-shopping-bag:customer-1:v1'])
    expect(state.viewModel.value.selectedSubtotalText).toBe('¥258.00')
  })

  it('submits selected shopping-bag items through the backend checkout command with addressId', async () => {
    const initialView = createCustomerShoppingBagView(createSnapshot(1))
    const checkedOutView = createCustomerShoppingBagView({
      ...createSnapshot(1),
      items: [],
      totalQuantity: 0,
      selectedQuantity: 0,
      selectedSubtotal: 0,
    })
    const checkoutSelectedItems = vi.fn(async () => createCheckoutResult(checkedOutView))
    const state = createCustomerShoppingBagPageState({
      loadView: vi.fn(async () => initialView),
      checkoutSelectedItems,
    })

    await state.handlePageShow()
    state.selectAddress('address-1')
    await expect(state.submitSelectedItems()).resolves.toMatchObject({
      status: 'succeeded',
      order: { id: 'order-1' },
      removedItemIds: ['bag-item-1'],
    })

    expect(checkoutSelectedItems).toHaveBeenCalledWith('address-1', initialView)
    expect(state.message.value).toBe('Order submitted')
    expect(state.invalidatedSnapshotKeys.value).toEqual(['customer-shopping-bag:customer-1:v1', 'customer-mine:customer-1:v1'])
    expect(state.viewModel.value.items).toEqual([])
  })

  it('loads checkout addresses and blocks backend checkout when no address is selected', async () => {
    const initialView = createCustomerShoppingBagView(createSnapshot(1))
    const checkoutSelectedItems = vi.fn(async () => createCheckoutResult(initialView))
    const state = createCustomerShoppingBagPageState({
      loadView: vi.fn(async () => initialView),
      loadAddressView: vi.fn(async () => createAddressView()),
      checkoutSelectedItems,
    })

    await state.handlePageShow()
    await state.loadAddressBook({ showLoading: true })
    state.selectAddress('')
    await expect(state.submitSelectedItems()).resolves.toMatchObject({
      status: 'blocked',
      message: '请选择收货地址',
      checkoutItems: [],
    })

    expect(state.addressBookView.value.items).toHaveLength(1)
    expect(checkoutSelectedItems).not.toHaveBeenCalled()
  })

  it('keeps shopping-bag checkout on the backend order path instead of product-detail navigation', () => {
    expect(pageSource).toContain('const submitCheckout = async () =>')
    expect(pageSource).toContain('shoppingBagState.submitSelectedItems()')
    expect(pageSource).toContain('shoppingBagState.loadAddressBook({ showLoading: true })')
    expect(pageSource).toContain('@tap="selectCheckoutAddress(item.id)"')
    expect(pageSource).toContain('selectedAddressId')
    expect(pageSource).not.toContain('routes.customerProductDetail')
    expect(pageSource).not.toContain('result.checkoutItems[0]')
  })

  it('routes favorites and mine through shared bottom-nav routes without old placeholder copy', () => {
    expect(pageSource).toContain('customerBottomNavRoutes.favorites')
    expect(pageSource).toContain('customerBottomNavRoutes.mine')
    expect(pageSource).toContain('@tap="goFavorites"')
    expect(pageSource).toContain('@tap="goMine"')
    expect(pageSource).not.toContain('CUSTOMER_MINE_PLACEHOLDER')
    expect(pageSource).not.toContain(legacyFavoritesSeparatePrdCopy)
    expect(pageSource).not.toContain(legacyVisualEntryCopy)
    expect(pageSource).not.toContain(legacySeparatePrdCopy)
  })

  it('aligns the custom header with the WeChat capsule and removes the title-bar refresh action', () => {
    expect(pageSource).toContain('<view class="bag-header" :style="{ paddingTop: headerTopPadding }">')
    expect(pageSource).toContain('onMounted(syncHeaderTopPadding)')
    expect(pageSource).toContain('uni.getMenuButtonBoundingClientRect?.()')
    expect(pageSource).toContain('<view class="nav-spacer" />')
    expect(pageSource).toContain('position: sticky;')
    expect(pageSource).not.toContain('aria-label="重新加载购物袋"')
    expect(pageSource).not.toContain('refresh-mark')
  })

  it('shows a retryable identity failure before the empty shopping-bag state', () => {
    const failureStateIndex = pageSource.indexOf('viewModel.loadingState === \'failed\' && viewModel.items.length === 0')
    const emptyStateIndex = pageSource.indexOf('v-else-if="viewModel.items.length === 0"')

    expect(failureStateIndex).toBeGreaterThanOrEqual(0)
    expect(emptyStateIndex).toBeGreaterThanOrEqual(0)
    expect(failureStateIndex).toBeLessThan(emptyStateIndex)
    expect(pageSource.slice(failureStateIndex, emptyStateIndex)).toContain('viewModel.failureMessage')
    expect(pageSource.slice(failureStateIndex, emptyStateIndex)).toContain('@tap="reload"')
  })

  it('blocks rapid bottom-nav switching with one shared pending route guard', () => {
    expect(pageSource).toContain("const navigatingRoute = ref<AppRoute | ''>('')")
    expect(pageSource).toContain('goCustomerBottomNav')
    expect(pageSource).toContain('shouldIgnoreCustomerBottomNavTap')
    expect(pageSource).toContain('pendingRoute: navigatingRoute.value')
    expect(pageSource).toContain(':disabled="Boolean(navigatingRoute)"')
  })
})
