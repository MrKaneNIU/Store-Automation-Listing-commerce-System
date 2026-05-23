import { describe, expect, it, vi } from 'vitest'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerSession } from '../../services/auth/customer-session'
import {
  retryCloudBaseOwnerScreenshotRecognitionJob,
  startCloudBaseOwnerScreenshotRecognition,
} from './owner-screenshot-import'
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
    listOcrJobs: missing,
    processOcrJob: missing,
    retryOcrJob: missing,
    listOcrBatches: missing,
    getCurrentOcrBatch: missing,
    getLatestDrafts: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listPublishedProducts: missing,
    listPublishedProductSummaries: missing,
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
  productName: 'Cotton Shirt',
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
  spec: 'Black/M',
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
  productName: 'Cotton Shirt',
  salePrice: 129,
  spec: 'Black/M',
  stock: 2,
  confidence: 0.96,
  sourceImageUrl: '/tmp/page-1.png',
  status: 'pending' as const,
}

const order = {
  id: 'order-1',
  status: 'pending_merchant_confirm' as const,
  customerName: 'Wechat Customer',
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

const queuedJob = {
  id: 'job-batch-cloud',
  batchId: 'batch-cloud',
  status: 'queued' as const,
  retryCount: 0,
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
}

describe('CloudBase mall facades', () => {
  it('creates an OCR job and reports provider failure without fabricating drafts', async () => {
    const createOcrBatch = vi.fn(async (input: CreateOcrBatchArgument) => ({
      batch: {
        id: 'batch-cloud',
        status: input.drafts.length > 0 ? ('recognized' as const) : ('uploaded' as const),
        imageUrls: input.imageUrls,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-09T00:00:00.000Z',
      },
      job: queuedJob,
      drafts: [],
    }))
    const processOcrJob = vi.fn(async () => ({
      job: {
        ...queuedJob,
        status: 'failed' as const,
        failureReason: 'timeout: OCR provider request timed out',
      },
      drafts: [],
    }))
    const result = await startCloudBaseOwnerScreenshotRecognition(
      [{ id: 'image-1', url: '/tmp/page-1.png', name: 'product-page' }],
      createClient({ createOcrBatch, processOcrJob }),
    )

    expect(createOcrBatch).toHaveBeenCalledWith(expect.objectContaining({ imageUrls: ['/tmp/page-1.png'], drafts: [] }))
    expect(processOcrJob).toHaveBeenCalledWith('job-batch-cloud')
    expect(result.nextAction).toBe('retry')
    expect(result.drafts).toEqual([])
  })

  it('does not require customer WeChat identity before starting OCR recognition', async () => {
    const getCurrentCustomer = vi.fn(async () => {
      throw new Error('UNAUTHORIZED: Verified WeChat identity is required')
    })
    const createOcrBatch = vi.fn(async () => ({ batch, job: queuedJob, drafts: [] }))
    const processOcrJob = vi.fn(async () => ({ job: queuedJob, drafts: [] }))

    await expect(startCloudBaseOwnerScreenshotRecognition(
      [{ id: 'image-1', url: '/tmp/page-1.png', name: 'product-page' }],
      createClient({ getCurrentCustomer, createOcrBatch, processOcrJob }),
    )).resolves.toMatchObject({
      job: queuedJob,
      drafts: [],
    })

    expect(getCurrentCustomer).not.toHaveBeenCalled()
    expect(createOcrBatch).toHaveBeenCalledTimes(1)
  })

  it('retries a failed OCR job through mallApi without creating duplicate drafts', async () => {
    const retryOcrJob = vi.fn(async () => ({
      job: { ...queuedJob, status: 'retrying' as const, retryCount: 1 },
      drafts: [],
    }))
    const processOcrJob = vi.fn(async () => ({
      job: { ...queuedJob, status: 'succeeded' as const, retryCount: 1 },
      drafts: [draft],
    }))

    const result = await retryCloudBaseOwnerScreenshotRecognitionJob('job-batch-cloud', createClient({
      retryOcrJob,
      processOcrJob,
    }))

    expect(retryOcrJob).toHaveBeenCalledWith('job-batch-cloud')
    expect(processOcrJob).toHaveBeenCalledWith('job-batch-cloud')
    expect(result.nextAction).toBe('review')
    expect(result.drafts).toEqual([draft])
  })

  it('loads owner products and sku counts from mallApi', async () => {
    const client = createClient({
      listProducts: vi.fn(async () => ({ products: [product] })),
      listSkus: vi.fn(async () => ({ skus: [sku] })),
    })

    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ id: 'product-1', skuCount: 1 }],
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
    await expect(updateCloudBaseOwnerDraftReviewDraft('draft-1', 'productName', 'Updated Product', client)).resolves.toEqual({ message: '' })
    await expect(deleteCloudBaseOwnerDraftReviewDraft('draft-1', client)).resolves.toEqual({ message: '' })
    await expect(confirmLatestCloudBaseOwnerDraftReviewBatch('batch-1', client)).resolves.toMatchObject({
      message: expect.stringContaining('1'),
    })
  })

  it('loads customer product list from a single published summary mallApi call', async () => {
    const listPublishedProductSummaries = vi.fn(async () => ({ products: [{ ...product, minPrice: 129 }] }))
    const listSkus = vi.fn(async () => ({ skus: [sku] }))
    const client = createClient({ listPublishedProductSummaries, listSkus })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [{ id: 'product-1', minPrice: 129 }],
      emptyMessage: '',
    })
    expect(listPublishedProductSummaries).toHaveBeenCalledTimes(1)
    expect(listSkus).not.toHaveBeenCalled()
  })

  it('keeps customer product browsing open when the published summary call fails', async () => {
    const client = createClient({
      listPublishedProductSummaries: vi.fn(async () => {
        throw new Error('UNAUTHORIZED: Verified WeChat identity is required')
      }),
    })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [],
    })
  })

  it('loads and handles owner orders through mallApi', async () => {
    const client = createClient({
      listMerchantOrders: vi.fn(async () => ({ orders: [order] })),
      confirmMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'confirmed' as const } })),
      cancelMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'canceled' as const } })),
    })

    await expect(getCloudBaseOwnerOrdersView(client)).resolves.toMatchObject({
      orders: [{ id: 'order-1', canConfirm: true }],
    })
    await expect(confirmCloudBaseOwnerOrder('order-1', client)).resolves.toMatchObject({ message: expect.stringContaining('order-1') })
    await expect(cancelCloudBaseOwnerOrder('order-1', client)).resolves.toMatchObject({ message: expect.stringContaining('order-1') })
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
      products: [{ id: 'product-1' }],
    })
    await expect(supplementCloudBaseStaffProductImages('product-1', client)).resolves.toMatchObject({
      message: expect.stringContaining('A1023'),
    })
  })

  it('submits customer orders through mallApi after mock WeChat authorization', async () => {
    const session: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: 'Wechat Customer',
      authSource: 'mock_wechat',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const authorizedSession = { ...session, phoneNumber: '13800000000' }
    const createCustomerOrder = vi.fn(async () => ({ order }))
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
    expect(createCustomerOrder).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      skuId: 'sku-1',
      session: authorizedSession,
    }))
  })
})
