import { describe, expect, it } from 'vitest'

import type { CustomerShoppingBagSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerShoppingBagFailureView,
  createCustomerShoppingBagLoadingView,
  createCustomerShoppingBagView,
  submitSelectedCustomerShoppingBagItemsToCheckout,
} from './customer-shopping-bag'

const snapshot: CustomerShoppingBagSnapshot = {
  customerId: 'customer-1',
  items: [
    {
      id: 'bag-item-1',
      productId: 'product-1',
      skuId: 'sku-1',
      productName: 'Cotton Shirt',
      skuSpec: 'Black/M',
      quantity: 2,
      unitPrice: 129,
      lineTotal: 258,
      mainImageUrl: '/static/logo.png',
      availability: 'available',
      availabilityLabel: 'Available',
      isAvailableForCheckout: true,
      isSelected: true,
    },
    {
      id: 'bag-item-2',
      productId: 'product-2',
      skuId: 'sku-2',
      productName: 'Wool Coat',
      skuSpec: 'Gray/L',
      quantity: 1,
      unitPrice: 399,
      lineTotal: 399,
      mainImageUrl: '',
      availability: 'outOfStock',
      availabilityLabel: 'Out of stock',
      isAvailableForCheckout: false,
      isSelected: true,
    },
  ],
  totalQuantity: 3,
  selectedQuantity: 3,
  selectedSubtotal: 258,
  unavailableCount: 1,
  serverTime: '2026-05-27T00:00:00.000Z',
}

describe('customer shopping bag ViewModel', () => {
  it('maps snapshot items into page-facing totals, labels, and unavailable state', () => {
    const view = createCustomerShoppingBagView(snapshot)

    expect(view).toMatchObject({
      totalQuantity: 3,
      totalQuantityLabel: '3 items',
      selectedQuantity: 3,
      selectedSubtotal: 258,
      selectedSubtotalText: '¥258.00',
      unavailableCount: 1,
      canCheckoutSelectedItems: true,
      loadingState: 'idle',
      failureMessage: '',
      lastUpdatedAt: '2026-05-27T00:00:00.000Z',
    })
    expect(view.items).toEqual([
      expect.objectContaining({
        id: 'bag-item-1',
        quantityLabel: 'x2',
        unitPriceText: '¥129.00',
        lineTotalText: '¥258.00',
        isUnavailable: false,
      }),
      expect.objectContaining({
        id: 'bag-item-2',
        quantityLabel: 'x1',
        unitPriceText: '¥399.00',
        lineTotalText: '¥399.00',
        isUnavailable: true,
      }),
    ])
  })

  it('builds empty, loading, and failure views without losing usable cached content', () => {
    const emptyView = createCustomerShoppingBagView({ ...snapshot, items: [], totalQuantity: 0, selectedQuantity: 0, selectedSubtotal: 0, unavailableCount: 0 })
    const cachedView = createCustomerShoppingBagView(snapshot)
    const loadingView = createCustomerShoppingBagLoadingView(cachedView)
    const failureView = createCustomerShoppingBagFailureView(new Error('network timeout'), cachedView)

    expect(emptyView).toMatchObject({
      items: [],
      emptyMessage: 'Your shopping bag is empty',
      canCheckoutSelectedItems: false,
    })
    expect(loadingView).toMatchObject({
      items: cachedView.items,
      loadingState: 'refreshing',
      failureMessage: '',
    })
    expect(failureView).toMatchObject({
      items: cachedView.items,
      loadingState: 'failed',
      failureMessage: 'network timeout',
    })
  })

  it('prepares only selected available items for checkout without creating orders', () => {
    const view = createCustomerShoppingBagView(snapshot)
    const result = submitSelectedCustomerShoppingBagItemsToCheckout(view)

    expect(result).toEqual({
      status: 'ready',
      checkoutItems: [
        {
          productId: 'product-1',
          skuId: 'sku-1',
          quantity: 2,
        },
      ],
      message: 'Ready for checkout',
    })
  })

  it('blocks checkout when no selected available items exist', () => {
    const view = createCustomerShoppingBagView({
      ...snapshot,
      items: snapshot.items.map((item) => ({ ...item, isSelected: false })),
      selectedQuantity: 0,
      selectedSubtotal: 0,
    })

    expect(submitSelectedCustomerShoppingBagItemsToCheckout(view)).toEqual({
      status: 'blocked',
      checkoutItems: [],
      message: 'Select an available item before checkout',
    })
  })
})
