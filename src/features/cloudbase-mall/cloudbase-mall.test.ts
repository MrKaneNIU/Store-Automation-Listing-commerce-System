import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type { CustomerSession } from '../../services/auth/customer-session'

const uploadServiceMock = vi.hoisted(() => ({
  chooseAndUploadImages: vi.fn(),
  refreshAssetUrls: vi.fn(),
}))

vi.mock('../../services/storage/runtime-upload-service', () => ({
  uploadService: {
    chooseAndUploadImages: uploadServiceMock.chooseAndUploadImages,
    refreshAssetUrls: uploadServiceMock.refreshAssetUrls,
  },
}))

beforeEach(() => {
  uploadServiceMock.chooseAndUploadImages.mockReset()
  uploadServiceMock.chooseAndUploadImages.mockImplementation(async (context: { entityId?: string; businessType: string }) => {
    const seed = context.entityId ?? context.businessType
    const url = `/static/logo.png?asset=${encodeURIComponent(seed)}`

    return {
      mainImageUrl: url,
      imageUrls: [url],
      assets: [{
        assetId: `asset-${seed}`,
        cloudPath: `mock/${seed}/1.png`,
        url,
        mimeType: 'image/png',
        size: 1024,
        checksum: seed,
        status: 'uploaded' as const,
      }],
    }
  })
  uploadServiceMock.refreshAssetUrls.mockReset()
  uploadServiceMock.refreshAssetUrls.mockImplementation(async (assetIds: string[]) => assetIds.map((assetId) => ({
    assetId,
    cloudPath: assetId,
    url: `/static/logo.png?asset=${encodeURIComponent(assetId)}&refresh=1`,
    mimeType: 'image/png',
    size: 1024,
    checksum: assetId,
    status: 'uploaded' as const,
  })))
})
import {
  retryCloudBaseOwnerScreenshotRecognitionJob,
  startCloudBaseOwnerScreenshotRecognition,
} from './owner-screenshot-import'
import {
  clearCloudBaseOwnerProductSkuStock,
  deleteCloudBaseOwnerProduct,
  getCloudBaseOwnerProductsView,
  getCloudBaseOwnerProductSkuInventoryView,
  restockCloudBaseOwnerProductSkus,
  unpublishCloudBaseOwnerProduct,
  updateCloudBaseOwnerProductBasics,
  updateCloudBaseOwnerProductDescription,
  updateCloudBaseOwnerProductSku,
} from './owner-products'
import {
  getCloudBaseCustomerProductDetailView,
  selectCloudBaseCustomerProductSkuInView,
  selectCloudBaseCustomerProductSku,
  submitCloudBaseCustomerProductDetailOrder,
} from './customer-product-detail'
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
import { getCloudBaseOwnerDashboardView } from './owner-dashboard'
import {
  filterCloudBaseStaffImageTasksView,
  getCloudBaseStaffImageTasksView,
  supplementCloudBaseStaffProductImages,
} from './staff-image-tasks'

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
    getLatestDraftReviewSnapshot: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listPublishedProducts: missing,
    listPublishedProductSummaries: missing,
    getPublishedProductDetail: missing,
    listOwnerProductCards: missing,
  updateProductDescription: missing,
  updateProductBasics: missing,
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
    getOwnerOrderSnapshot: missing,
    getOwnerDashboardSnapshot: missing,
    getCustomerShoppingBagSnapshot: missing,
    addCustomerShoppingBagItem: missing,
    updateCustomerShoppingBagItemQuantity: missing,
    selectCustomerShoppingBagItem: missing,
    removeCustomerShoppingBagItem: missing,
    clearUnavailableCustomerShoppingBagItems: missing,
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

const signedCloudBaseRenderUrl =
  'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product_main_image/staff/product/product-1/main.jpg?sign=abc&t=1779673154'

const product = {
  id: 'product-1',
  productCode: 'A1023',
  productName: 'Cotton Shirt',
  description: '轻盈棉质衬衫，适合日常通勤。',
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
      listOwnerProductCards: vi.fn(async () => ({
        products: [{
          ...product,
          statusLabel: '已上架',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        }],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
      listProducts: vi.fn(async () => {
        throw new Error('listProducts should not be called')
      }),
      listSkus: vi.fn(async () => {
        throw new Error('listSkus should not be called')
      }),
    })

    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ id: 'product-1', skuCount: 1 }],
    })
    expect(client.listOwnerProductCards).toHaveBeenCalledTimes(1)
    expect(client.listProducts).not.toHaveBeenCalled()
    expect(client.listSkus).not.toHaveBeenCalled()
  })

  it('filters owner product cards locally after the aggregated mallApi read', async () => {
    const pendingProduct = {
      ...product,
      id: 'product-2',
      productCode: 'A1024',
      status: 'pending_images' as const,
      statusLabel: '待补图',
      skuCount: 0,
      canPublish: false,
      publishBlockReasons: ['商品主图不能为空'],
    }
    const client = createClient({
      listOwnerProductCards: vi.fn(async () => ({
        products: [
          {
            ...product,
            statusLabel: '已上架',
            skuCount: 1,
            canPublish: false,
            publishBlockReasons: [],
          },
          pendingProduct,
        ],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseOwnerProductsView('published', client)).resolves.toMatchObject({
      products: [{ id: 'product-1', status: 'published' }],
      readyProductCount: 0,
    })
    expect(client.listOwnerProductCards).toHaveBeenCalledTimes(1)
  })

  it('updates product descriptions through mallApi', async () => {
    const updateProductDescription = vi.fn(async () => ({
      product: { ...product, description: '进口羊毛混纺，适合通勤叠穿。' },
    }))
    const client = createClient({ updateProductDescription })

    await expect(updateCloudBaseOwnerProductDescription(product.id, '进口羊毛混纺，适合通勤叠穿。', client)).resolves.toEqual({
      message: '商品简介已保存',
    })
    expect(updateProductDescription).toHaveBeenCalledWith('product-1', {
      description: '进口羊毛混纺，适合通勤叠穿。',
    })
  })

  it('updates product basics through mallApi without exposing productCode mutation', async () => {
    const updateProductBasics = vi.fn(async () => ({
      product: {
        ...product,
        productName: 'Updated Cotton Shirt',
        description: '进口羊毛混纺，适合通勤叠穿。',
      },
    }))
    const client = createClient({ updateProductBasics })

    await expect(updateCloudBaseOwnerProductBasics(product.id, {
      productName: '  Updated Cotton Shirt  ',
      description: '  进口羊毛混纺，适合通勤叠穿。  ',
    }, client)).resolves.toEqual({
      message: '商品基础信息已保存',
    })
    expect(updateProductBasics).toHaveBeenCalledWith('product-1', {
      productName: 'Updated Cotton Shirt',
      description: '进口羊毛混纺，适合通勤叠穿。',
    })
    expect(JSON.stringify(updateProductBasics.mock.calls)).not.toContain('productCode')
  })

  it('loads and updates owner SKU inventory through mallApi', async () => {
    const client = createClient({
      listProducts: vi.fn(async () => ({ products: [product] })),
      listSkus: vi.fn(async () => ({ skus: [sku] })),
      updateSku: vi.fn(async () => ({ sku: { ...sku, spec: 'Black/XL', salePrice: 139, stock: 5 } })),
      restockSkus: vi.fn(async () => ({ skus: [{ ...sku, stock: 6 }] })),
      clearSkuStock: vi.fn(async () => ({ skus: [{ ...sku, stock: 0 }] })),
    })

    await expect(getCloudBaseOwnerProductSkuInventoryView(product.id, client)).resolves.toMatchObject({
      product: { id: product.id },
      skus: [{ id: sku.id, customerStatusPreview: '可下单' }],
    })
    await expect(updateCloudBaseOwnerProductSku(product.id, sku.id, {
      spec: 'Black/XL',
      salePrice: 139,
      stock: 5,
      reason: '补货入库',
    }, client)).resolves.toEqual({ message: '规格库存已保存' })
    await expect(restockCloudBaseOwnerProductSkus(product.id, 4, '补货入库', client)).resolves.toEqual({ message: '已补货 1 个规格' })
    await expect(clearCloudBaseOwnerProductSkuStock(product.id, '盘点清零', client)).resolves.toEqual({ message: '已清零 1 个规格' })

    expect(client.updateSku).toHaveBeenCalledWith(product.id, sku.id, {
      spec: 'Black/XL',
      salePrice: 139,
      stock: 5,
      reason: '补货入库',
    })
    expect(client.restockSkus).toHaveBeenCalledWith(product.id, { quantity: 4, reason: '补货入库' })
    expect(client.clearSkuStock).toHaveBeenCalledWith(product.id, { reason: '盘点清零' })
  })

  it('runs owner product unpublish and delete operations through mallApi', async () => {
    const client = createClient({
      unpublishProduct: vi.fn(async () => ({ product: { ...product, status: 'ready_to_publish' as const } })),
      deleteProduct: vi.fn(async () => ({ product, deletedSkuCount: 1 })),
    })

    await expect(unpublishCloudBaseOwnerProduct(product.id, client)).resolves.toMatchObject({
      message: expect.stringContaining(product.productCode),
    })
    await expect(deleteCloudBaseOwnerProduct(product.id, client)).resolves.toMatchObject({
      message: expect.stringContaining(product.productCode),
    })
    expect(client.unpublishProduct).toHaveBeenCalledWith(product.id)
    expect(client.deleteProduct).toHaveBeenCalledWith(product.id)
  })

  it('shows CloudBase product detail descriptions with the empty fallback', async () => {
    const client = createClient({
      getPublishedProductDetail: vi.fn(async (productId: string) => ({
        product: productId === 'product-2' ? { ...product, id: 'product-2', description: '' } : product,
        skus: [sku],
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseCustomerProductDetailView(product.id, '', client)).resolves.toMatchObject({
      descriptionText: '轻盈棉质衬衫，适合日常通勤。',
    })
    await expect(getCloudBaseCustomerProductDetailView('product-2', '', client)).resolves.toMatchObject({
      descriptionText: '暂无商品简介，商家正在完善中。',
    })
  })

  it('loads and mutates draft review state through mallApi', async () => {
    const client = createClient({
      getLatestDraftReviewSnapshot: vi.fn(async () => ({ batch, drafts: [draft], serverTime: '2026-05-27T00:00:00.000Z' })),
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
    expect(client.getLatestDraftReviewSnapshot).toHaveBeenCalledTimes(1)
    expect(client.getLatestDrafts).not.toHaveBeenCalled()
  })

  it('hides confirmed cloud drafts from the draft review ViewModel', async () => {
    const client = createClient({
      getLatestDraftReviewSnapshot: vi.fn(async () => ({
        batch,
        drafts: [
          { ...draft, id: 'confirmed-draft', status: 'confirmed' as const },
          { ...draft, id: 'deleted-draft', status: 'deleted' as const },
        ],
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseOwnerDraftReviewView(client)).resolves.toMatchObject({
      latestBatchId: 'batch-1',
      groups: [],
      needsCompletionCount: 0,
      lowConfidenceCount: 0,
      priceConflictCount: 0,
      canConfirm: false,
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

  it('does not resolve customer product list detail image arrays', async () => {
    const cloudImageProduct = {
      ...product,
      mainImageUrl: 'cloud://asset-main',
      imageUrls: ['cloud://asset-main', 'cloud://asset-detail'],
    }
    const client = createClient({
      listPublishedProductSummaries: vi.fn(async () => ({ products: [{ ...cloudImageProduct, minPrice: 129 }] })),
    })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [{
        mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main'),
        imageUrls: [],
      }],
    })
  })

  it('batch resolves repeated owner product main images without resolving detail arrays', async () => {
    const cloudImageProduct = {
      ...product,
      mainImageUrl: 'cloud://asset-main',
      imageUrls: ['cloud://asset-detail'],
    }
    const listOwnerProductCards = vi.fn(async () => ({
      products: [
        {
          ...cloudImageProduct,
          id: 'product-1',
          statusLabel: 'published',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        },
        {
          ...cloudImageProduct,
          id: 'product-2',
          statusLabel: 'published',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        },
      ],
      readyProductCount: 0,
      serverTime: '2026-05-27T00:00:00.000Z',
    }))
    const client = createClient({ listOwnerProductCards })

    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [
        {
          id: 'product-1',
          mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main'),
          imageUrls: ['cloud://asset-detail'],
        },
        {
          id: 'product-2',
          mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main'),
          imageUrls: ['cloud://asset-detail'],
        },
      ],
    })
    expect(listOwnerProductCards).toHaveBeenCalledTimes(1)
  })

  it('resolves CloudBase product image file IDs before returning customer and owner ViewModels', async () => {
    const cloudImageProduct = {
      ...product,
      mainImageUrl: 'cloud://asset-main',
      imageUrls: ['cloud://asset-main'],
    }
    const client = createClient({
      listPublishedProductSummaries: vi.fn(async () => ({ products: [{ ...cloudImageProduct, minPrice: 129 }] })),
      getPublishedProductDetail: vi.fn(async () => ({ product: cloudImageProduct, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
      listOwnerProductCards: vi.fn(async () => ({
        products: [{
          ...cloudImageProduct,
          statusLabel: '已上架',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        }],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [{ mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main') }],
    })
    await expect(getCloudBaseCustomerProductDetailView(product.id, '', client)).resolves.toMatchObject({
      product: { mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main') },
    })
    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ mainImageUrl: expect.stringContaining('/static/logo.png?asset=cloud%3A%2F%2Fasset-main') }],
    })
  })

  it('keeps fresh signed CloudBase render URLs resolved from cloud file IDs in customer and owner ViewModels', async () => {
    uploadServiceMock.refreshAssetUrls.mockImplementation(async (assetIds: string[]) => assetIds.map((assetId) => ({
      assetId,
      cloudPath: assetId,
      url: signedCloudBaseRenderUrl,
      mimeType: 'image/jpeg',
      size: 1024,
      checksum: assetId,
      status: 'uploaded' as const,
    })))
    const cloudImageProduct = {
      ...product,
      mainImageUrl: 'cloud://asset-signed-main',
      imageUrls: ['cloud://asset-signed-main'],
    }
    const client = createClient({
      listPublishedProductSummaries: vi.fn(async () => ({ products: [{ ...cloudImageProduct, minPrice: 129 }] })),
      getPublishedProductDetail: vi.fn(async () => ({ product: cloudImageProduct, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
      listOwnerProductCards: vi.fn(async () => ({
        products: [{
          ...cloudImageProduct,
          statusLabel: 'published',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        }],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseCustomerProductListView(client)).resolves.toMatchObject({
      products: [{ mainImageUrl: signedCloudBaseRenderUrl }],
    })
    await expect(getCloudBaseCustomerProductDetailView(product.id, '', client)).resolves.toMatchObject({
      product: {
        mainImageUrl: signedCloudBaseRenderUrl,
        imageUrls: [signedCloudBaseRenderUrl],
      },
    })
    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ mainImageUrl: signedCloudBaseRenderUrl }],
    })
  })

  it('drops signed CloudBase temporary product image URLs from page-facing ViewModels', async () => {
    const signedTempUrl = 'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product.jpg?sign=abc&t=1779673154'
    const signedImageProduct = {
      ...product,
      mainImageUrl: signedTempUrl,
      imageUrls: [signedTempUrl],
    }
    const client = createClient({
      listOwnerProductCards: vi.fn(async () => ({
        products: [{
          ...signedImageProduct,
          statusLabel: '已上架',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        }],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseOwnerProductsView('all', client)).resolves.toMatchObject({
      products: [{ mainImageUrl: '', imageUrls: [] }],
    })
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
    const listMerchantOrders = vi.fn(async () => ({ orders: [order] }))
    const client = createClient({
      getOwnerOrderSnapshot: vi.fn(async () => ({ orders: [order], serverTime: '2026-05-27T00:00:00.000Z' })),
      listMerchantOrders,
      confirmMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'confirmed' as const } })),
      cancelMerchantOrder: vi.fn(async () => ({ order: { ...order, status: 'canceled' as const } })),
    })

    await expect(getCloudBaseOwnerOrdersView(client)).resolves.toMatchObject({
      orders: [{ id: 'order-1', canConfirm: true }],
    })
    expect(listMerchantOrders).not.toHaveBeenCalled()
    await expect(confirmCloudBaseOwnerOrder('order-1', client)).resolves.toMatchObject({ message: expect.stringContaining('order-1') })
    await expect(cancelCloudBaseOwnerOrder('order-1', client)).resolves.toMatchObject({ message: expect.stringContaining('order-1') })
  })

  it('loads owner dashboard counts through one mallApi snapshot', async () => {
    const client = createClient({
      getOwnerDashboardSnapshot: vi.fn(async () => ({
        pendingDraftCount: 2,
        pendingImageTaskCount: 3,
        pendingOrderCount: 1,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseOwnerDashboardView(client)).resolves.toEqual({
      remainingUploadCount: 13,
      pendingDraftCount: 2,
      pendingImageTaskCount: 3,
      pendingOrderCount: 1,
    })
    expect(client.getOwnerDashboardSnapshot).toHaveBeenCalledTimes(1)
  })

  it('loads staff image tasks and supplements images through mallApi', async () => {
    const pendingImageProduct = { ...product, status: 'pending_images' as const, mainImageUrl: '', imageUrls: [] }
    const readyProduct = { ...pendingImageProduct, status: 'ready_to_publish' as const, mainImageUrl: '/static/logo.png' }
    const client = createClient({
      getStaffImageTaskSnapshot: vi.fn(async () => ({
        batches: [batch],
        products: [pendingImageProduct],
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
      listOcrBatches: vi.fn(async () => ({ batches: [batch] })),
      listPendingImageTasks: vi.fn(async () => ({ products: [pendingImageProduct] })),
      supplementProductImages: vi.fn(async () => ({ product: readyProduct })),
    })

    const view = await getCloudBaseStaffImageTasksView({ keyword: 'A1023', selectedBatchId: 'batch-1' }, client)

    expect(view).toMatchObject({
      products: [{ id: 'product-1' }],
    })
    expect(view.batchOptions[1]).toMatchObject({ value: 'batch-1' })
    expect(view.batchOptions[1].label).toContain('批次')
    expect(view.batchOptions[1].label).toContain('待补图 1 件')
    expect(view.selectedBatchLabel).toBe(view.batchOptions[1].label)
    expect(client.getStaffImageTaskSnapshot).toHaveBeenCalledTimes(1)
    expect(client.listOcrBatches).not.toHaveBeenCalled()
    expect(client.listPendingImageTasks).not.toHaveBeenCalled()
    await expect(supplementCloudBaseStaffProductImages('product-1', client)).resolves.toMatchObject({
      message: expect.stringContaining('A1023'),
    })
  })

  it('filters staff image tasks locally after the snapshot read', async () => {
    const anotherBatch = { ...batch, id: 'batch-2' }
    const pendingImageProduct = { ...product, status: 'pending_images' as const, mainImageUrl: '', imageUrls: [] }
    const anotherProduct = {
      ...pendingImageProduct,
      id: 'product-2',
      productCode: 'B2088',
      createdFromBatchId: 'batch-2',
    }
    const getStaffImageTaskSnapshot = vi.fn(async () => ({
      batches: [batch, anotherBatch],
      products: [pendingImageProduct, anotherProduct],
      serverTime: '2026-05-27T00:00:00.000Z',
    }))
    const client = createClient({ getStaffImageTaskSnapshot })
    const view = await getCloudBaseStaffImageTasksView({ keyword: '', selectedBatchId: '' }, client)

    const filteredByKeyword = filterCloudBaseStaffImageTasksView(view, { keyword: 'B2088', selectedBatchId: '' })
    const filteredByBatch = filterCloudBaseStaffImageTasksView(view, { keyword: '', selectedBatchId: 'batch-1' })

    expect(filteredByKeyword.products.map((item) => item.id)).toEqual(['product-2'])
    expect(filteredByBatch.products.map((item) => item.id)).toEqual(['product-1'])
    expect(getStaffImageTaskSnapshot).toHaveBeenCalledTimes(1)
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
      requestPhoneNumber: async () => '13800000000',
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
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

  it('submits customer orders only after real WeChat phone binding returns a phone-bound session', async () => {
    const session: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: 'Wechat Customer',
      authSource: 'wechat',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const authorizedSession = {
      ...session,
      phoneNumber: '13800000000',
      phoneAuthorizedAt: '2026-05-09T00:01:00.000Z',
    }
    const createCustomerOrder = vi.fn(async () => ({ order: { ...order, customerAuthSource: 'wechat' as const } }))
    const requestPhoneNumber = vi.fn(async () => 'phone-code-ok')
    const authService = {
      getCurrentSession: () => null,
      login: vi.fn(async () => session),
      authorizePhoneNumber: vi.fn(async (phoneCode?: string) => {
        expect(phoneCode).toBe('phone-code-ok')
        expect(createCustomerOrder).not.toHaveBeenCalled()
        return authorizedSession
      }),
      logout: vi.fn(),
    }

    const result = await submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      confirmLogin: async () => true,
      confirmPhoneAuthorization: async () => true,
      requestPhoneNumber,
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
        createCustomerOrder,
      }),
    })

    expect(result.status).toBe('created')
    expect(requestPhoneNumber).toHaveBeenCalledTimes(1)
    expect(authService.authorizePhoneNumber).toHaveBeenCalledWith('phone-code-ok')
    expect(createCustomerOrder).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      skuId: 'sku-1',
      session: authorizedSession,
    }))
  })

  it('cancels checkout without creating an order when native phone authorization returns no code', async () => {
    const session: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: 'Wechat Customer',
      authSource: 'wechat',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const createCustomerOrder = vi.fn(async () => ({ order }))
    const requestPhoneNumber = vi.fn(async () => null)
    const authService = {
      getCurrentSession: () => null,
      login: vi.fn(async () => session),
      authorizePhoneNumber: vi.fn(),
      logout: vi.fn(),
    }

    const result = await submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      requestPhoneNumber,
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
        createCustomerOrder,
      }),
    })

    expect(result.status).toBe('canceled')
    expect(requestPhoneNumber).toHaveBeenCalledTimes(1)
    expect(authService.authorizePhoneNumber).not.toHaveBeenCalled()
    expect(createCustomerOrder).not.toHaveBeenCalled()
  })

  it('submits customer orders directly for phone-bound sessions without requesting another phone code', async () => {
    const boundSession: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: 'Wechat Customer',
      authSource: 'wechat',
      phoneNumber: '13800000000',
      phoneAuthorizedAt: '2026-05-09T00:01:00.000Z',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const createCustomerOrder = vi.fn(async () => ({ order: { ...order, customerAuthSource: 'wechat' as const } }))
    const requestPhoneNumber = vi.fn(async () => 'phone-code-should-not-be-used')
    const authService = {
      getCurrentSession: vi.fn(() => boundSession),
      login: vi.fn(),
      authorizePhoneNumber: vi.fn(),
      logout: vi.fn(),
    }

    const result = await submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      requestPhoneNumber,
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
        createCustomerOrder,
      }),
    })

    expect(result.status).toBe('created')
    expect(authService.login).not.toHaveBeenCalled()
    expect(requestPhoneNumber).not.toHaveBeenCalled()
    expect(authService.authorizePhoneNumber).not.toHaveBeenCalled()
    expect(createCustomerOrder).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      skuId: 'sku-1',
      session: boundSession,
    }))
  })

  it('returns a failed checkout result when WeChat identity login is rejected', async () => {
    const createCustomerOrder = vi.fn(async () => ({ order }))
    const authService = {
      getCurrentSession: () => null,
      login: vi.fn(async () => {
        throw new Error('UNAUTHORIZED: Verified WeChat identity is required')
      }),
      authorizePhoneNumber: vi.fn(),
      logout: vi.fn(),
    }

    await expect(submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      confirmLogin: async () => true,
      confirmPhoneAuthorization: async () => true,
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
        createCustomerOrder,
      }),
    })).resolves.toMatchObject({
      status: 'failed',
      order: null,
      message: '请重试验证微信身份',
    })
    expect(createCustomerOrder).not.toHaveBeenCalled()
  })

  it('returns a failed checkout result when WeChat phone binding is rejected', async () => {
    const session: CustomerSession = {
      customerId: 'customer-1',
      openid: 'openid-1',
      nickname: 'Wechat Customer',
      authSource: 'wechat',
      loggedInAt: '2026-05-09T00:00:00.000Z',
    }
    const createCustomerOrder = vi.fn(async () => ({ order }))
    const authService = {
      getCurrentSession: () => session,
      login: vi.fn(),
      authorizePhoneNumber: vi.fn(async () => {
        throw new Error('UNAUTHORIZED: Verified WeChat identity is required')
      }),
      logout: vi.fn(),
    }

    await expect(submitCloudBaseCustomerProductDetailOrder({
      productId: product.id,
      skuId: sku.id,
      quantity: 1,
      authService,
      confirmLogin: async () => true,
      confirmPhoneAuthorization: async () => true,
      requestPhoneNumber: async () => 'phone-code-1',
      client: createClient({
        getPublishedProductDetail: vi.fn(async () => ({ product, skus: [sku], serverTime: '2026-05-27T00:00:00.000Z' })),
        createCustomerOrder,
      }),
    })).resolves.toMatchObject({
      status: 'failed',
      order: null,
      message: '请重试验证微信身份',
    })
    expect(createCustomerOrder).not.toHaveBeenCalled()
  })

  it('keeps out-of-stock SKU selection visible while blocking checkout through mallApi', async () => {
    const soldOutSku = { ...sku, stock: 0 }
    const client = createClient({
      getPublishedProductDetail: vi.fn(async () => ({ product, skus: [soldOutSku], serverTime: '2026-05-27T00:00:00.000Z' })),
    })

    await expect(selectCloudBaseCustomerProductSku(product.id, soldOutSku.id, client)).resolves.toEqual({
      selectedSkuId: soldOutSku.id,
      message: '该规格暂无库存',
    })
    await expect(getCloudBaseCustomerProductDetailView(product.id, soldOutSku.id, client)).resolves.toMatchObject({
      skus: [{ id: soldOutSku.id, isDisabled: true, isSelected: true, stock: 0 }],
      canSubmitOrder: false,
    })
  })

  it('loads customer product detail from one aggregated mallApi action', async () => {
    const getPublishedProductDetail = vi.fn(async () => ({
      product,
      skus: [sku, { ...sku, id: 'sku-2', spec: 'White/L', stock: 0 }],
      serverTime: '2026-05-27T00:00:00.000Z',
    }))
    const listPublishedProducts = vi.fn(async () => ({ products: [product] }))
    const listSkus = vi.fn(async () => ({ skus: [sku] }))
    const client = createClient({ getPublishedProductDetail, listPublishedProducts, listSkus })

    await expect(getCloudBaseCustomerProductDetailView(product.id, sku.id, client)).resolves.toMatchObject({
      product: { id: product.id },
      skus: [
        { id: sku.id, isSelected: true, isDisabled: false },
        { id: 'sku-2', isSelected: false, isDisabled: true },
      ],
      canSubmitOrder: true,
    })
    expect(getPublishedProductDetail).toHaveBeenCalledWith(product.id)
    expect(listPublishedProducts).not.toHaveBeenCalled()
    expect(listSkus).not.toHaveBeenCalled()
  })

  it('selects customer product SKUs locally from the loaded detail ViewModel', async () => {
    const getPublishedProductDetail = vi.fn(async () => ({
      product,
      skus: [sku, { ...sku, id: 'sku-2', spec: 'White/L', stock: 0 }],
      serverTime: '2026-05-27T00:00:00.000Z',
    }))
    const client = createClient({ getPublishedProductDetail })
    const view = await getCloudBaseCustomerProductDetailView(product.id, '', client)

    const selectedSaleable = selectCloudBaseCustomerProductSkuInView(view, sku.id)
    const selectedSoldOut = selectCloudBaseCustomerProductSkuInView(view, 'sku-2')

    expect(selectedSaleable).toMatchObject({
      selectedSkuId: sku.id,
      message: '',
      view: {
        skus: [
          { id: sku.id, isSelected: true },
          { id: 'sku-2', isSelected: false },
        ],
        canSubmitOrder: true,
      },
    })
    expect(selectedSoldOut.selectedSkuId).toBe('sku-2')
    expect(selectedSoldOut.message).not.toBe('')
    expect(selectedSoldOut.view).toMatchObject({
      skus: [
        { id: sku.id, isSelected: false },
        { id: 'sku-2', isSelected: true, isDisabled: true },
      ],
      canSubmitOrder: false,
    })
    expect(getPublishedProductDetail).toHaveBeenCalledTimes(1)
  })
  it('surfaces CloudBase owner publish block reasons from the shared validation', async () => {
    const readyProduct = { ...product, status: 'ready_to_publish' as const }
    const client = createClient({
      listOwnerProductCards: vi.fn(async () => ({
        products: [{
          ...readyProduct,
          statusLabel: '可上架',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: ['全部规格暂无库存，请先补库存'],
        }],
        readyProductCount: 0,
        serverTime: '2026-05-27T00:00:00.000Z',
      })),
    })

    await expect(getCloudBaseOwnerProductsView('ready_to_publish', client)).resolves.toMatchObject({
      canBatchPublish: false,
      readyProductCount: 0,
      products: [
        {
          id: readyProduct.id,
          canPublish: false,
          publishBlockReasons: ['全部规格暂无库存，请先补库存'],
        },
      ],
    })
  })
})
