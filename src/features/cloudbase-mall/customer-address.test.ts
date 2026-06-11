import { describe, expect, it, vi } from 'vitest'
import type {
  CloudBaseMallApiClient,
  CustomerAddress,
  CustomerAddressBookSnapshot,
} from '../../services/cloudbase/mall-api-client'
import {
  createCloudBaseCustomerAddress,
  deleteCloudBaseCustomerAddress,
  getCloudBaseCustomerAddressBookView,
  setDefaultCloudBaseCustomerAddress,
  updateCloudBaseCustomerAddress,
} from './customer-address'

const address: CustomerAddress = {
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
}

const snapshot: CustomerAddressBookSnapshot = {
  customerId: 'customer-1',
  addresses: [address],
  defaultAddressId: address.id,
  serverTime: '2026-06-11T00:00:00.000Z',
}

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient => {
  const missing = vi.fn(async () => {
    throw new Error('unexpected address client call')
  })

  return {
    getCurrentCustomer: missing,
    bindCustomerPhone: missing,
    bindStaff: missing,
    createOcrBatch: missing,
    listOcrJobs: missing,
    processOcrJob: missing,
    retryOcrJob: missing,
    listOcrBatches: missing,
    getCurrentOcrBatch: missing,
    getLatestDrafts: missing,
    getLatestDraftReviewSnapshot: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listPublishedProducts: missing,
    listPublishedProductSummaries: missing,
    getPublishedProductDetail: missing,
    listOwnerProductCards: missing,
    updateProductBasics: missing,
    updateProductDescription: missing,
    updateSku: missing,
    restockSkus: missing,
    clearSkuStock: missing,
    publishProduct: missing,
    unpublishProduct: missing,
    deleteProduct: missing,
    listSkus: missing,
    listPendingImageTasks: missing,
    getStaffImageTaskSnapshot: missing,
    supplementProductImages: missing,
    createCustomerOrder: missing,
    getCustomerOrder: missing,
    getCustomerOrdersSnapshot: missing,
    getOwnerOrderSnapshot: missing,
    getManagerOrderNotificationConfig: missing,
    subscribeManagerOrderNotifications: missing,
    getOwnerDashboardSnapshot: missing,
    getCustomerShoppingBagSnapshot: missing,
    addCustomerShoppingBagItem: missing,
    updateCustomerShoppingBagItemQuantity: missing,
    selectCustomerShoppingBagItem: missing,
    removeCustomerShoppingBagItem: missing,
    clearUnavailableCustomerShoppingBagItems: missing,
    checkoutCustomerShoppingBag: missing,
    getCustomerFavoriteProductsSnapshot: missing,
    favoriteCustomerProduct: missing,
    unfavoriteCustomerProduct: missing,
    removeCustomerFavoriteProduct: missing,
    listMerchantOrders: missing,
    confirmMerchantOrder: missing,
    cancelMerchantOrder: missing,
    ...overrides,
  }
}

describe('CloudBase customer address facade', () => {
  it('loads a page-facing address book view from the current-customer snapshot', async () => {
    const client = createClient({
      getCustomerAddressBookSnapshot: vi.fn(async () => snapshot),
    })

    await expect(getCloudBaseCustomerAddressBookView(client)).resolves.toMatchObject({
      customerId: 'customer-1',
      defaultAddressId: 'address-1',
      items: [{
        id: 'address-1',
        recipientLine: 'Ada 13800000000',
        regionLine: '上海 上海市 静安区',
        detailLine: '南京西路 1 号',
        defaultLabel: '默认',
      }],
    })
  })

  it('maps address CRUD commands to refreshed views and address snapshot invalidation', async () => {
    const commandResult = {
      address,
      snapshot,
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
    }
    const client = createClient({
      createCustomerAddress: vi.fn(async () => commandResult),
      updateCustomerAddress: vi.fn(async () => commandResult),
      deleteCustomerAddress: vi.fn(async () => commandResult),
      setDefaultCustomerAddress: vi.fn(async () => commandResult),
    })
    const previousView = await getCloudBaseCustomerAddressBookView(createClient({
      getCustomerAddressBookSnapshot: vi.fn(async () => snapshot),
    }))

    await expect(createCloudBaseCustomerAddress({
      contactName: 'Ada',
      phoneNumber: '13800000000',
      province: '上海',
      city: '上海市',
      district: '静安区',
      detail: '南京西路 1 号',
    }, previousView, client)).resolves.toMatchObject({
      status: 'succeeded',
      message: '地址已保存',
      invalidatedSnapshotKeys: ['customer-addresses:customer-1:v1'],
      view: { items: [{ id: 'address-1' }] },
    })
    await updateCloudBaseCustomerAddress('address-1', { detail: '南京西路 2 号' }, previousView, client)
    await deleteCloudBaseCustomerAddress('address-1', previousView, client)
    await setDefaultCloudBaseCustomerAddress('address-1', previousView, client)

    expect(client.createCustomerAddress).toHaveBeenCalledTimes(1)
    expect(client.updateCustomerAddress).toHaveBeenCalledWith('address-1', { detail: '南京西路 2 号' })
    expect(client.deleteCustomerAddress).toHaveBeenCalledWith('address-1')
    expect(client.setDefaultCustomerAddress).toHaveBeenCalledWith('address-1')
  })
})
