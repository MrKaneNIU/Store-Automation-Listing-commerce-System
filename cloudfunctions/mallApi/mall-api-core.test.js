import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  createMallApiHandler,
  createMemoryDocumentStore,
  createHttpOcrProviderFromEnv,
  validateProductForPublish,
} = require('./mall-api-core')
const { productPublishValidationCases } = require('../../tests/contracts/product-publish-validation-cases.cjs')

const createHandler = (options = {}) =>
  createMallApiHandler(createMemoryDocumentStore(), {
    createId: (() => {
      let index = 0
      return (prefix) => `${prefix}-${++index}`
    })(),
    now: () => '2026-05-11T00:00:00.000Z',
    allowTestIdentityRoles: true,
    exchangePhoneCode: async (phoneCode) => {
      if (phoneCode !== 'phone-code-ok') throw new Error('Invalid phone code')
      return '13800000000'
    },
    ...options,
  })

const createStore = () => createMemoryDocumentStore()

const createTracedStore = () => {
  const store = createStore()
  const listCalls = []
  return {
    store: {
      ...store,
      async list(name, query) {
        listCalls.push({ name, query })
        return store.list(name, query)
      },
    },
    listCalls,
  }
}

const createTracedHandler = (tracedStore) =>
  createMallApiHandler(tracedStore.store, {
    createId: (() => {
      let index = 0
      return (prefix) => `${prefix}-${++index}`
    })(),
    now: () => '2026-05-11T00:00:00.000Z',
    allowTestIdentityRoles: true,
  })

const createProductionRoleHandler = (store = createStore()) =>
  createMallApiHandler(store, {
    createId: (() => {
      let index = 0
      return (prefix) => `${prefix}-${++index}`
    })(),
    now: () => '2026-05-11T00:00:00.000Z',
  })

const ownerIdentity = {
  openid: 'owner-openid',
  appid: 'wxa63c53796488d4d4',
  roles: ['owner'],
}

const staffIdentity = {
  openid: 'staff-openid',
  appid: 'wxa63c53796488d4d4',
  roles: ['staff'],
}

const customerIdentity = {
  openid: 'customer-openid',
  appid: 'wxa63c53796488d4d4',
  roles: ['customer'],
}

const adminProductSession = {
  account: 'admin',
  role: 'creator',
  permissions: ['workbenchAccess', 'productManagement'],
}

const staffProductSession = {
  account: 'staff-product',
  role: 'staff',
  permissions: ['workbenchAccess', 'productManagement'],
}

const staffOrderSession = {
  account: 'staff-order',
  role: 'staff',
  permissions: ['workbenchAccess', 'orderConfirmation'],
}

const createProductFixture = async (handler) => {
  const created = await handler({
    action: 'createOcrBatch',
    identity: ownerIdentity,
    payload: {
      imageUrls: ['cloud://page-1.png'],
      drafts: [
        {
          productCode: 'A1023',
          productName: 'Cotton Shirt',
          salePrice: 129,
          spec: 'Black/M',
          stock: 2,
          confidence: 0.96,
          sourceImageUrl: 'cloud://page-1.png',
        },
      ],
    },
  })
  const confirmed = await handler({
    action: 'confirmBatch',
    identity: ownerIdentity,
    params: { batchId: created.data.batch.id },
  })
  const product = confirmed.data.products[0]
  await handler({
    action: 'supplementProductImages',
    identity: staffIdentity,
    params: { productId: product.id },
    payload: {
      mainImageUrl: 'cloud://main.jpg',
      imageUrls: ['cloud://main.jpg'],
    },
  })
  const published = await handler({
    action: 'publishProduct',
    identity: ownerIdentity,
    params: { productId: product.id },
  })
  return {
    product: published.data.product,
    sku: confirmed.data.skus[0],
  }
}

describe('mallApi Phase 4 auth and role permissions', () => {
  it('ignores forged request roles unless the local test-role switch is enabled', async () => {
    const handler = createProductionRoleHandler()

    const result = await handler({
      action: 'listMerchantOrders',
      identity: {
        openid: 'forged-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['owner'],
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('resolves owner role from role_assignments instead of request roles', async () => {
    const store = createStore()
    await store.insert('role_assignments', {
      _id: 'role-1',
      openid: 'owner-openid',
      role: 'owner',
      status: 'active',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: '2026-05-11T00:00:00.000Z',
    })
    const handler = createProductionRoleHandler(store)

    const result = await handler({
      action: 'listMerchantOrders',
      identity: {
        openid: 'owner-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['customer'],
      },
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        orders: [],
      },
    })
  })

  it('lets an owner bind a staff openid through role_assignments', async () => {
    const store = createStore()
    await store.insert('role_assignments', {
      _id: 'role-owner',
      openid: 'owner-openid',
      role: 'owner',
      status: 'active',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: '2026-05-11T00:00:00.000Z',
    })
    const handler = createProductionRoleHandler(store)

    const result = await handler({
      action: 'bindStaff',
      identity: {
        openid: 'owner-openid',
        appid: 'wxa63c53796488d4d4',
      },
      payload: {
        openid: 'staff-openid',
        reason: 'new staff',
      },
    })
    const staffOrders = await handler({
      action: 'listPendingImageTasks',
      identity: {
        openid: 'staff-openid',
        appid: 'wxa63c53796488d4d4',
      },
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        roleAssignment: {
          openid: 'staff-openid',
          role: 'staff',
          status: 'active',
        },
      },
    })
    expect(staffOrders.success).toBe(true)
  })

  it('denies staff binding when caller is not an owner', async () => {
    const handler = createProductionRoleHandler()

    const result = await handler({
      action: 'bindStaff',
      identity: customerIdentity,
      payload: {
        openid: 'staff-openid',
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('upserts the current customer from verified CloudBase identity', async () => {
    const handler = createHandler()

    const result = await handler({
      action: 'getCurrentCustomer',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        customer: {
          id: 'customer-1',
          openid: 'customer-openid',
          appid: 'wxa63c53796488d4d4',
          authSource: 'wechat',
        },
      },
    })
  })

  it('rejects customer identity actions without verified runtime identity', async () => {
    const handler = createHandler()

    const result = await handler({ action: 'getCurrentCustomer' })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
  })

  it('does not trust client supplied customer identity for real WeChat orders', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    const bound = await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })

    const result = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-forged-customer',
          openid: 'client-forged-openid',
          phoneNumber: '13999999999',
          authSource: 'wechat',
        },
      },
    })

    expect(result.success).toBe(true)
    expect(result.data.order).toMatchObject({
      customerId: bound.data.customer.id,
      customerPhone: '13800000000',
      customerAuthSource: 'wechat',
    })
  })

  it('writes inventory ledger entries and returns the same order for repeated idempotent requests', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    const first = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        idempotencyKey: 'checkout-1',
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })
    const second = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        idempotencyKey: 'checkout-1',
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })

    expect(first.success).toBe(true)
    expect(second).toMatchObject({
      success: true,
      data: {
        order: first.data.order,
      },
    })
    expect(await handler({
      action: 'listMerchantOrders',
      identity: ownerIdentity,
    })).toMatchObject({
      success: true,
      data: {
        orders: [first.data.order],
      },
    })
  })

  it('rejects direct client phone binding without a WeChat phone code', async () => {
    const handler = createHandler()

    const result = await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneNumber: '13800000000' },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    })
  })

  it('returns a safe error when WeChat phone code exchange fails', async () => {
    const handler = createHandler({
      exchangePhoneCode: async () => {
        throw new Error('upstream secret detail')
      },
    })

    const result = await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'bad-code' },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'Wechat phone code exchange failed',
      },
    })
  })

  it('denies customer access to merchant APIs', async () => {
    const handler = createHandler()

    const result = await handler({
      action: 'listMerchantOrders',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('returns published product summaries with min prices in one customer list call', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)

    const result = await handler({
      action: 'listPublishedProductSummaries',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        products: [
          {
            id: product.id,
            productCode: product.productCode,
            minPrice: 129,
            status: 'published',
          },
        ],
      },
    })
  })

  it('blocks publishing and customer summaries when a product has no saleable SKU', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'clearSkuStock',
      identity: ownerIdentity,
      params: { productId: product.id },
      payload: { reason: '盘点清零' },
    })

    const blocked = await handler({
      action: 'publishProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const summaries = await handler({
      action: 'listPublishedProductSummaries',
      identity: customerIdentity,
    })

    expect(blocked).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
        message: '全部规格暂无库存，请先补库存',
      },
    })
    expect(summaries.data.products).toEqual([])
  })

  it('unpublishes and deletes owner products through mallApi lifecycle actions', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)

    const unpublished = await handler({
      action: 'unpublishProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const summariesAfterUnpublish = await handler({
      action: 'listPublishedProductSummaries',
      identity: customerIdentity,
    })
    const deleted = await handler({
      action: 'deleteProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const productsAfterDelete = await handler({ action: 'listProducts', identity: ownerIdentity })
    const skusAfterDelete = await handler({ action: 'listSkus', identity: ownerIdentity, params: { productId: product.id } })

    expect(unpublished).toMatchObject({
      success: true,
      data: { product: { id: product.id, status: 'ready_to_publish' } },
    })
    expect(summariesAfterUnpublish.data.products).toEqual([])
    expect(deleted).toMatchObject({
      success: true,
      data: { product: { id: product.id }, deletedSkuCount: 1 },
    })
    expect(productsAfterDelete.data.products).toEqual([])
    expect(skusAfterDelete).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it('lists owner product cards with one products read and one sku read', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
          {
            productCode: 'A1024',
            productName: 'Linen Shirt',
            salePrice: 159,
            spec: 'White/L',
            stock: 0,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    const confirmed = await handler({
      action: 'confirmBatch',
      identity: ownerIdentity,
      params: { batchId: created.data.batch.id },
    })
    await handler({
      action: 'supplementProductImages',
      identity: staffIdentity,
      params: { productId: confirmed.data.products[0].id },
      payload: {
        mainImageUrl: 'cloud://main.jpg',
        imageUrls: ['cloud://main.jpg', 'cloud://detail.jpg'],
      },
    })
    traced.listCalls.length = 0

    const result = await handler({
      action: 'listOwnerProductCards',
      identity: ownerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        readyProductCount: 1,
        serverTime: '2026-05-11T00:00:00.000Z',
        products: [
          {
            productCode: 'A1023',
            statusLabel: '可上架',
            skuCount: 1,
            canPublish: true,
            publishBlockReasons: [],
          },
          {
            productCode: 'A1024',
            statusLabel: '待补图',
            skuCount: 1,
            canPublish: false,
          },
        ],
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'products')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'skus')).toHaveLength(1)
  })

  it('requires product-management permission for owner product cards', async () => {
    const handler = createHandler()

    await expect(handler({
      action: 'listOwnerProductCards',
      adminSession: staffOrderSession,
    })).resolves.toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('returns one published product detail snapshot with one products read and one sku read', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const { product, sku } = await createProductFixture(handler)
    traced.listCalls.length = 0

    const result = await handler({
      action: 'getPublishedProductDetail',
      params: { productId: product.id },
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        product: { id: product.id, status: 'published' },
        skus: [{ id: sku.id, productId: product.id }],
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'products')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'skus')).toHaveLength(1)
  })

  it('returns an empty published product detail snapshot for unpublished products', async () => {
    const handler = createHandler()
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    const confirmed = await handler({
      action: 'confirmBatch',
      identity: ownerIdentity,
      params: { batchId: created.data.batch.id },
    })

    await expect(handler({
      action: 'getPublishedProductDetail',
      params: { productId: confirmed.data.products[0].id },
    })).resolves.toMatchObject({
      success: true,
      data: {
        product: null,
        skus: [],
      },
    })
  })

  it('returns one staff image task snapshot with one batches read and one products read', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    await handler({
      action: 'confirmBatch',
      identity: ownerIdentity,
      params: { batchId: created.data.batch.id },
    })
    traced.listCalls.length = 0

    const result = await handler({
      action: 'getStaffImageTaskSnapshot',
      identity: staffIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        batches: [{ id: created.data.batch.id }],
        products: [{ productCode: 'A1023', status: 'pending_images' }],
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'ocr_batches')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'products')).toHaveLength(1)
  })

  it('returns one latest draft review snapshot with one batches read and one drafts read', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.72,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    traced.listCalls.length = 0

    const result = await handler({
      action: 'getLatestDraftReviewSnapshot',
      identity: ownerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        batch: { id: created.data.batch.id },
        drafts: [{ productCode: 'A1023', confidence: 0.72 }],
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'ocr_batches')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'product_drafts')).toHaveLength(1)
  })

  it('returns one owner order snapshot with one orders read', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const { product, sku } = await createProductFixture(handler)
    const created = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })
    traced.listCalls.length = 0

    const result = await handler({
      action: 'getOwnerOrderSnapshot',
      identity: ownerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        orders: [{ id: created.data.order.id, status: 'pending_merchant_confirm' }],
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'orders')).toHaveLength(1)
  })

  it('allows order-confirmation admin sessions to review and handle merchant orders without WeChat identity', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    const firstOrder = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })
    const secondOrder = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-customer-2',
          openid: 'client-openid-2',
          phoneNumber: '13900000000',
          authSource: 'mock_wechat',
        },
      },
    })

    const snapshot = await handler({
      action: 'getOwnerOrderSnapshot',
      adminSession: staffOrderSession,
    })
    const listed = await handler({
      action: 'listMerchantOrders',
      adminSession: staffOrderSession,
    })
    const confirmed = await handler({
      action: 'confirmMerchantOrder',
      adminSession: staffOrderSession,
      params: { orderId: firstOrder.data.order.id },
    })
    const canceled = await handler({
      action: 'cancelMerchantOrder',
      adminSession: staffOrderSession,
      params: { orderId: secondOrder.data.order.id },
    })

    expect(snapshot).toMatchObject({
      success: true,
      data: {
        orders: [
          { id: firstOrder.data.order.id, status: 'pending_merchant_confirm' },
          { id: secondOrder.data.order.id, status: 'pending_merchant_confirm' },
        ],
      },
    })
    expect(listed).toMatchObject({
      success: true,
      data: {
        orders: [
          { id: firstOrder.data.order.id },
          { id: secondOrder.data.order.id },
        ],
      },
    })
    expect(confirmed).toMatchObject({
      success: true,
      data: {
        order: { id: firstOrder.data.order.id, status: 'confirmed' },
      },
    })
    expect(canceled).toMatchObject({
      success: true,
      data: {
        order: { id: secondOrder.data.order.id, status: 'canceled' },
      },
    })
  })

  it('requires order-confirmation permission for admin merchant order review', async () => {
    const handler = createHandler()

    await expect(handler({
      action: 'getOwnerOrderSnapshot',
      adminSession: staffProductSession,
    })).resolves.toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('returns one owner dashboard snapshot with bounded aggregate reads', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const { product, sku } = await createProductFixture(handler)
    const draftBatch = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-2.png'],
        drafts: [
          {
            productCode: 'B2088',
            productName: 'Wool Coat',
            salePrice: 299,
            spec: 'Ivory/S',
            stock: 1,
            confidence: 0.88,
            sourceImageUrl: 'cloud://page-2.png',
          },
        ],
      },
    })
    await handler({
      action: 'confirmBatch',
      identity: ownerIdentity,
      params: { batchId: draftBatch.data.batch.id },
    })
    await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-3.png'],
        drafts: [
          {
            productCode: 'C3099',
            productName: 'Silk Scarf',
            salePrice: 99,
            spec: 'Blue',
            stock: 3,
            confidence: 0.9,
            sourceImageUrl: 'cloud://page-3.png',
          },
        ],
      },
    })
    await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })
    traced.listCalls.length = 0

    const result = await handler({
      action: 'getOwnerDashboardSnapshot',
      adminSession: adminProductSession,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        pendingDraftCount: 1,
        pendingImageTaskCount: 1,
        pendingOrderCount: 1,
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(traced.listCalls.filter((call) => call.name === 'ocr_batches')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'product_drafts')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'products')).toHaveLength(1)
    expect(traced.listCalls.filter((call) => call.name === 'orders')).toHaveLength(1)
  })

  it('requires product-management permission for staff image task snapshots', async () => {
    const handler = createHandler()

    await expect(handler({
      action: 'getStaffImageTaskSnapshot',
      adminSession: staffOrderSession,
    })).resolves.toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('creates OCR jobs and rejects retry unless the job has failed', async () => {
    const handler = createHandler()
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    const listed = await handler({
      action: 'listOcrJobs',
      identity: ownerIdentity,
      params: { batchId: created.data.batch.id },
    })
    const retryBlocked = await handler({
      action: 'retryOcrJob',
      identity: ownerIdentity,
      params: { jobId: created.data.job.id },
    })
    const latestDrafts = await handler({
      action: 'getLatestDrafts',
      identity: ownerIdentity,
    })

    expect(created.data.job).toMatchObject({
      batchId: created.data.batch.id,
      status: 'queued',
      retryCount: 0,
    })
    expect(listed.data.jobs).toEqual([created.data.job])
    expect(retryBlocked).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Only failed OCR jobs can be retried',
      },
    })
    expect(latestDrafts.data.drafts).toHaveLength(1)
  })

  it('creates OCR jobs from the admin workbench session without requiring WeChat identity', async () => {
    const handler = createHandler()
    const created = await handler({
      action: 'createOcrBatch',
      adminSession: staffProductSession,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [],
      },
    })
    const listed = await handler({
      action: 'listOcrJobs',
      adminSession: staffProductSession,
      params: { batchId: created.data.batch.id },
    })

    expect(created).toMatchObject({
      success: true,
      data: {
        batch: { status: 'uploaded' },
        job: { status: 'queued' },
      },
    })
    expect(listed.data.jobs).toEqual([created.data.job])
  })

  it('continues from admin OCR drafts to pending image tasks without requiring WeChat identity', async () => {
    const handler = createHandler()
    const created = await handler({
      action: 'createOcrBatch',
      adminSession: staffProductSession,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      },
    })
    const confirmed = await handler({
      action: 'confirmBatch',
      adminSession: staffProductSession,
      params: { batchId: created.data.batch.id },
    })
    const pending = await handler({
      action: 'listPendingImageTasks',
      adminSession: staffProductSession,
    })
    const supplemented = await handler({
      action: 'supplementProductImages',
      adminSession: staffProductSession,
      params: { productId: confirmed.data.products[0]?.id },
      payload: {
        mainImageUrl: 'cloud://main.jpg',
        imageUrls: ['cloud://main.jpg'],
      },
    })

    expect(confirmed).toMatchObject({
      success: true,
      data: {
        products: [{ status: 'pending_images' }],
        skus: [{ productCode: 'A1023' }],
      },
    })
    expect(pending).toMatchObject({
      success: true,
      data: {
        products: [{ productCode: 'A1023', status: 'pending_images' }],
      },
    })
    expect(supplemented).toMatchObject({
      success: true,
      data: {
        product: { productCode: 'A1023', status: 'ready_to_publish' },
      },
    })
  })

  it('rejects OCR jobs when the admin workbench session lacks product permission', async () => {
    const handler = createHandler()
    const result = await handler({
      action: 'createOcrBatch',
      adminSession: staffOrderSession,
      payload: {
        imageUrls: ['cloud://page-1.png'],
        drafts: [],
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })

  it('processes queued OCR jobs through the injected provider without duplicating drafts on retry', async () => {
    let providerImages = []
    const handler = createHandler({
      ocrProvider: {
        recognizeBatch: async ({ batchId, images }) => {
          providerImages = images
          return {
            ok: true,
            drafts: [{
              id: 'draft-provider-1',
              batchId,
              productCode: 'A1023',
              productName: 'Cotton Shirt',
              salePrice: 129,
              spec: 'Black/M',
              stock: 1,
              confidence: 0.92,
              sourceImageUrl: 'https://temp.example/page-1.png',
              status: 'pending',
            }],
          }
        },
      },
    })
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: { imageUrls: ['https://stale.example/page-1.png'], imageAssetIds: ['cloud://asset-1'], drafts: [] },
    })
    const processed = await handler({
      action: 'processOcrJob',
      identity: ownerIdentity,
      params: { jobId: created.data.job.id },
    })
    const retryBlocked = await handler({
      action: 'retryOcrJob',
      identity: ownerIdentity,
      params: { jobId: created.data.job.id },
    })

    expect(processed).toMatchObject({
      success: true,
      data: {
        job: { status: 'succeeded' },
        drafts: [{ id: 'draft-provider-1', productCode: 'A1023' }],
      },
    })
    expect(providerImages).toEqual([
      { id: 'image-1', url: 'https://stale.example/page-1.png', name: 'image-1', assetId: 'cloud://asset-1' },
    ])
    expect(retryBlocked.error.code).toBe('CONFLICT')
  })

  it('records recoverable provider failures on the OCR job without creating products', async () => {
    const handler = createHandler({
      ocrProvider: {
        recognizeBatch: async () => ({
          ok: false,
          error: { code: 'timeout', message: 'OCR provider request timed out', recoverable: true },
        }),
      },
    })
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: { imageUrls: ['cloud://page-1.png'], drafts: [] },
    })
    const processed = await handler({
      action: 'processOcrJob',
      identity: ownerIdentity,
      params: { jobId: created.data.job.id },
    })
    const products = await handler({ action: 'listProducts', identity: ownerIdentity })

    expect(processed).toMatchObject({
      success: true,
      data: {
        job: {
          status: 'failed',
          failureReason: 'timeout: OCR provider request timed out',
        },
        drafts: [],
      },
    })
    expect(products.data.products).toEqual([])
  })

  it('uses Tencent Cloud GeneralBasicOCR provider when configured by environment variables', async () => {
    const provider = createHttpOcrProviderFromEnv({
      OCR_PROVIDER: 'tencentcloud-general-basic',
      OCR_TENCENT_SECRET_ID: 'AKIDEXAMPLE',
      OCR_TENCENT_SECRET_KEY: 'SECRETEXAMPLE',
      OCR_TENCENT_REGION: 'ap-guangzhou',
      OCR_PROVIDER_TIMEOUT_MS: '10000',
    })
    provider.recognizeBatch = async () => ({
      ok: true,
      drafts: [{
        id: 'draft-1',
        batchId: 'batch-1',
        productCode: 'A1023',
        productName: '圆领针织衫',
        salePrice: 129,
        spec: '黑色/M',
        stock: 0,
        confidence: 0.95,
        sourceImageUrl: 'https://example.test/page-1.png',
        fieldConfidence: {
          productCode: 0.99,
          productName: 0.98,
          salePrice: 0.96,
          spec: 0.95,
        },
        fieldSources: {
          productCode: 'ocr',
          productName: 'ocr',
          salePrice: 'ocr',
          spec: 'ocr',
        },
        correctionState: 'ocr_raw',
        status: 'pending',
      }],
    })
    const handler = createHandler({ ocrProvider: provider })
    const created = await handler({
      action: 'createOcrBatch',
      identity: ownerIdentity,
      payload: { imageUrls: ['https://example.test/page-1.png'], drafts: [] },
    })
    const processed = await handler({
      action: 'processOcrJob',
      identity: ownerIdentity,
      params: { jobId: created.data.job.id },
    })
    const products = await handler({ action: 'listProducts', identity: ownerIdentity })

    expect(processed).toMatchObject({
      success: true,
      data: {
        job: { status: 'succeeded' },
        drafts: [{
          productCode: 'A1023',
          productName: '圆领针织衫',
          salePrice: 129,
          spec: '黑色/M',
        }],
      },
    })
    expect(products.data.products).toEqual([])
  })

  it('records ledger entries when merchant confirms or cancels orders', async () => {
    const store = createStore()
    await store.insert('role_assignments', {
      _id: 'role-owner',
      openid: 'owner-openid',
      role: 'owner',
      status: 'active',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: '2026-05-11T00:00:00.000Z',
    })
    await store.insert('role_assignments', {
      _id: 'role-staff',
      openid: 'staff-openid',
      role: 'staff',
      status: 'active',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: '2026-05-11T00:00:00.000Z',
    })
    const handler = createProductionRoleHandler(store)
    const { product, sku } = await createProductFixture(handler)
    const created = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-customer',
          openid: 'client-openid',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      },
    })
    await handler({
      action: 'confirmMerchantOrder',
      identity: ownerIdentity,
      params: { orderId: created.data.order.id },
    })
    const canceled = await handler({
      action: 'cancelMerchantOrder',
      identity: ownerIdentity,
      params: { orderId: created.data.order.id },
    })
    const ledger = await store.list('inventory_ledger')

    expect(canceled).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
      },
    })
    expect(ledger.map((entry) => entry.action)).toEqual(['reserve', 'confirm'])
  })

  it('updates SKU inventory operations and writes manual ledger entries', async () => {
    const store = createStore()
    const handler = createMallApiHandler(store, {
      createId: (() => {
        let index = 0
        return (prefix) => `${prefix}-${++index}`
      })(),
      now: () => '2026-05-11T00:00:00.000Z',
      allowTestIdentityRoles: true,
    })
    const { product, sku } = await createProductFixture(handler)

    const updated = await handler({
      action: 'updateSku',
      identity: ownerIdentity,
      params: { productId: product.id, skuId: sku.id },
      payload: {
        spec: 'Black/XL',
        salePrice: 139,
        stock: 5,
        reason: '补货入库',
      },
    })
    const restocked = await handler({
      action: 'restockSkus',
      identity: ownerIdentity,
      params: { productId: product.id },
      payload: { quantity: 4, reason: '补货入库' },
    })
    const cleared = await handler({
      action: 'clearSkuStock',
      identity: ownerIdentity,
      params: { productId: product.id },
      payload: { reason: '盘点清零' },
    })
    const ledger = await store.list('inventory_ledger')

    expect(updated).toMatchObject({
      success: true,
      data: {
        sku: { id: sku.id, spec: 'Black/XL', salePrice: 139, stock: 5 },
      },
    })
    expect(restocked.data.skus[0].stock).toBe(9)
    expect(cleared.data.skus[0].stock).toBe(0)
    expect(ledger.map((entry) => ({
      action: entry.action,
      quantityDelta: entry.quantity_delta,
      sourceType: entry.source_type,
    }))).toEqual([
      { action: 'adjust', quantityDelta: 3, sourceType: 'manual' },
      { action: 'adjust', quantityDelta: 4, sourceType: 'manual' },
      { action: 'adjust', quantityDelta: -9, sourceType: 'manual' },
    ])
  })

  it('allows staff image supplementation but denies staff publishing', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)

    const supplement = await handler({
      action: 'supplementProductImages',
      identity: staffIdentity,
      params: { productId: product.id },
      payload: {
        mainImageUrl: 'cloud://main.jpg',
        imageUrls: ['cloud://main.jpg'],
      },
    })
    const publish = await handler({
      action: 'publishProduct',
      identity: staffIdentity,
      params: { productId: product.id },
    })

    expect(supplement.success).toBe(true)
    expect(publish).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    })
  })
})

describe('mallApi publish validation contract', () => {
  it.each(productPublishValidationCases)('matches the shared publish validation contract: $name', (contractCase) => {
    expect(validateProductForPublish(contractCase.product, contractCase.skus)).toEqual(contractCase.expectedMessages)
  })
})
