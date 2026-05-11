import { describe, expect, it, vi } from 'vitest'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerSession } from '../../services/auth/customer-session'
import { startCloudBaseOwnerScreenshotRecognition } from './owner-screenshot-import'
import { getCloudBaseOwnerProductsView } from './owner-products'
import { submitCloudBaseCustomerProductDetailOrder } from './customer-product-detail'
import {
  confirmLatestCloudBaseOwnerDraftReviewBatch,
  deleteCloudBaseOwnerDraftReviewDraft,
  getCloudBaseOwnerDraftReviewView,
  updateCloudBaseOwnerDraftReviewDraft,
} from './owner-draft-review'
import { getCloudBaseCustomerProductListView } from './customer-product-list'
import {
  cancelCloudBaseOwnerOrder,
  confirmCloudBaseOwnerOrder,
  getCloudBaseOwnerOrdersView,
} from './owner-orders'
import { getCloudBaseStaffImageTasksView, supplementCloudBaseStaffProductImages } from './staff-image-tasks'

type CreateOcrBatchArgument = Parameters<CloudBaseMallApiClient['createOcrBatch']>[0]

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient => {
  const missing = vi.fn(async () => {
    throw new Error('unexpected mallApi call')
  })

  return {
    getCurrentCustomer: missing,
    bindCustomerPhone: missing,
    bindStaff: missing,
    createOcrBatch: missing,
    listOcrBatches: missing,
    getCurrentOcrBatch: missing,
    getLatestDrafts: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listPublishedProducts: missing,
    publishProduct: missing,
    listSkus: missing,
    listPendingImageTasks: missing,
    supplementProductImages: missing,
    createCustomerOrder: missing,
    getCustomerOrder: missing,
    listMerchantOrders: missing,
    confirmMerchantOrder: missing,
    cancelMerchantOrder: missing,
    ...overrides,
  }
}

const product = {
  id: 'product-1',
  productCode: 'A1023',
  productName: '圆领针织衫',
  status: 'published' as const,
  mainImageUrl: '/static/logo.png',
  imageUrls: ['/static/logo.png'],
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
}

const sku = {
  id: 'sku-1',
  productId: 'product-1',
  productCode: 'A1023',
  spec: '黑色/M',
  salePrice: 129,
  stock: 2,
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
}

const batch = {
  id: 'batch-1',
  status: 'recognized' as const,
  imageUrls: ['/tmp/page-1.png'],
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
}

const draft = {
  id: 'draft-1',
  batchId: 'batch-1',
  productCode: 'A1023',
  productName: '圆领针织衫',
  salePrice: 129,
  spec: '黑色/M',
  stock: 2,
  confidence: 0.96,
  sourceImageUrl: '/tmp/page-1.png',
  status: 'pending' as const,
}

const order = {
  id: 'order-1',
  status: 'pending_merchant_confirm' as const,
  customerName: '微信用户',
  customerPhone: '13800000000',
  customerId: 'customer-1',
  customerAuthSource: 'mock_wechat' as const,
  items: [
    {
      productId: product.id,
      productName: product.productName,
      productCode: product.productCode,
      skuId: sku.id,
      spec: sku.spec,
      salePrice: sku.salePrice,
      quantity: 1,
    },
  ],
  totalAmount: 129,
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
}

describe('CloudBase mall facades', () => {
  it('creates a CloudBase OCR batch without fabricating product fields before real OCR is connected', async () => {
    const createOcrBatch = vi.fn(async (input: CreateOcrBatchArgument) => ({
      batch: {
        id: 'batch-cloud',
        status: input.drafts.length > 0 ? ('recognized' as const) : ('uploaded' as const),
        imageUrls: input.imageUrls,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-09T00:00:00.000Z',
      },
      drafts: input.drafts.map((draft, index) => ({
        ...draft,
        id: `draft-${index}`,
        batchId: 'batch-cloud',
        status: draft.productCode && draft.productName && draft.spec ? ('pending' as const) : ('needs_completion' as const),
      })),
    }))

    const result = await startCloudBaseOwnerScreenshotRecognition(
      [{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }],
      createClient({ createOcrBatch }),
    )

    expect(createOcrBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrls: ['/tmp/page-1.png'],
        drafts: [],
      }),
    )
    expect(result.batch.id).toBe('batch-cloud')
    expect(result.totalDraftCount).toBe(0)
    expect(result.message).toContain('未接入真实 OCR')
  })

  it('loads owner products and sku counts from mallApi', async () => {
    const client = createClient({
      listProducts: vi.fn(async () => ({ products: [product] })),
      listSkus: vi.fn(async () => ({ skus: [sku] })),
    })

    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ id: 'product-1', skuCount: 1, statusLabel: '已上架' }],
    })
    expect(client.listSkus).toHaveBeenCalledWith('product-1')
  })

  it('loads and mutates draft review state through mallApi', async () => {
    const client = createClient({
      getLatestDrafts: vi.fn(async () => ({ batch, drafts: [draft] })),
      updateDraft: vi.fn(async () => ({ draft })),
      deleteDraft: vi.fn(async () => ({ draft: { ...draft, status: 'deleted' as const } })),
      confirmBatch: vi.fn(async () => ({ issues: [], products: [product], skus: [sku] })),
    })

    await expect(getCloudBaseOwnerDraftReviewView(client)).resolves.toMatchObject({
      latestBatchId: 'batch-1',
      groups: [{ productCode: 'A1023' }],
      canConfirm: true,
    })
    await expect(updateCloudBaseOwnerDraftReviewDraft('draft-1', 'productName', '新名称', client)).resolves.toEqual({ message: '' })
    await expect(deleteCloudBaseOwnerDraftReviewDraft('draft-1', client)).resolves.toEqual({ message: '' })
    await expect(confirmLatestCloudBaseOwnerDraftReviewBatch('batch-1', client)).resolves.toEqual({
      message: '已创建 1 个商品、1 个 SKU',
    })
  })

  it('loads customer product list from published mallApi products', async () => {
    const client = createClient({
      listPublishedProducts: vi.fn(async () => ({ products: [product] })),
      listSkus: vi.fn(async () => ({ skus: [sku] })),
    })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [{ id: 'product-1', minPrice: 129 }],
      emptyMessage: '',
    })
  })

  it('loads and handles owner orders through mallApi', async () => {
    const client = createClient({
      listMerchantOrders: vi.fn(async () => ({ orders: [order] })),
      confirmMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'confirmed' as const } })),
      cancelMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'canceled' as const } })),
    })

    await expect(getCloudBaseOwnerOrdersView(client)).resolves.toMatchObject({
      orders: [{ id: 'order-1', statusLabel: '待商家确认', canConfirm: true }],
    })
    await expect(confirmCloudBaseOwnerOrder('order-1', client)).resolves.toEqual({ message: '订单已确认：order-1' })
    await expect(cancelCloudBaseOwnerOrder('order-1', client)).resolves.toEqual({ message: '订单已取消：order-1' })
  })

  it('loads staff image tasks and supplements images through mallApi', async () => {
    const pendingImageProduct = { ...product, status: 'pending_images' as const, mainImageUrl: '', imageUrls: [] }
    const readyProduct = { ...pendingImageProduct, status: 'ready_to_publish' as const, mainImageUrl: '/static/logo.png' }
    const client = createClient({
      listOcrBatches: vi.fn(async () => ({ batches: [batch] })),
      listPendingImageTasks: vi.fn(async () => ({ products: [pendingImageProduct] })),
      supplementProductImages: vi.fn(async () => ({ product: readyProduct })),
    })

    await expect(getCloudBaseStaffImageTasksView({ keyword: 'A1023', selectedBatchId: 'batch-1' }, client)).resolves.toMatchObject({
      batchOptions: [{ label: '全部批次', value: '' }, { label: 'batch-1', value: 'batch-1' }],
      products: [{ id: 'product-1', statusLabel: '待补图' }],
    })
    await expect(supplementCloudBaseStaffProductImages('product-1', client)).resolves.toEqual({
      message: 'A1023 已补图，状态变为可上架',
    })
  })

  it('submits customer orders through mallApi after mock WeChat authorization', async () => {
    const session: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: '微信用户',
      authSource: 'mock_wechat',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const authorizedSession = { ...session, phoneNumber: '13800000000' }
    const createCustomerOrder = vi.fn(async () => ({
      order,
    }))
    const authService = {
      getCurrentSession: () => null,
      login: vi.fn(async () => session),
      authorizePhoneNumber: vi.fn(async () => authorizedSession),
      logout: vi.fn(),
    }

    const result = await submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      confirmLogin: async () => true,
      confirmPhoneAuthorization: async () => true,
      client: createClient({
        listPublishedProducts: vi.fn(async () => ({ products: [product] })),
        listSkus: vi.fn(async () => ({ skus: [sku] })),
        createCustomerOrder,
      }),
    })

    expect(result.status).toBe('created')
    expect(createCustomerOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'product-1',
        skuId: 'sku-1',
        session: authorizedSession,
      }),
    )
  })
})
