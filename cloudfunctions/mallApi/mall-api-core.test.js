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
    allowMockCustomerOrder: true,
    exchangePhoneCode: async (phoneCode) => {
      if (phoneCode !== 'phone-code-ok') throw new Error('Invalid phone code')
      return '13800000000'
    },
    ...options,
  })

const createStore = () => createMemoryDocumentStore()

const createStoreWithMissingCollection = (collectionName) => {
  const store = createStore()
  return {
    ...store,
    async list(name, query) {
      if (name === collectionName) {
        const error = new Error(
          'DATABASE_COLLECTION_NOT_EXIST: Db or Table not exist. See https://cloud.tencent.com/document/api/876/34822',
        )
        error.code = 'DATABASE_COLLECTION_NOT_EXIST'
        throw error
      }
      return store.list(name, query)
    },
  }
}

const createTracedStore = () => {
  const store = createStore()
  const listCalls = []
  const insertCalls = []
  const replaceCalls = []
  const upsertCalls = []
  return {
    store: {
      ...store,
      async insert(name, document) {
        insertCalls.push({ name, document })
        return store.insert(name, document)
      },
      async replace(name, document) {
        replaceCalls.push({ name, document })
        return store.replace(name, document)
      },
      async upsert(name, document) {
        upsertCalls.push({ name, document })
        return store.upsert(name, document)
      },
      async list(name, query) {
        listCalls.push({ name, query })
        return store.list(name, query)
      },
    },
    listCalls,
    insertCalls,
    replaceCalls,
    upsertCalls,
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
    allowMockCustomerOrder: true,
    exchangePhoneCode: async (phoneCode) => {
      if (phoneCode !== 'phone-code-ok') throw new Error('Invalid phone code')
      return '13800000000'
    },
  })

const createProductionRoleHandler = (store = createStore(), options = {}) =>
  createMallApiHandler(store, {
    createId: (() => {
      let index = 0
      return (prefix) => `${prefix}-${++index}`
    })(),
    now: () => '2026-05-11T00:00:00.000Z',
    ...options,
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

const otherCustomerIdentity = {
  openid: 'other-customer-openid',
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

  it('reuses the same customer document for repeated verified WeChat identity resolution', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)

    const first = await handler({
      action: 'getCurrentCustomer',
      identity: customerIdentity,
    })
    const second = await handler({
      action: 'getCurrentCustomer',
      identity: {
        ...customerIdentity,
        unionid: 'updated-unionid',
      },
    })

    expect(first.success).toBe(true)
    expect(second).toMatchObject({
      success: true,
      data: {
        customer: {
          id: first.data.customer.id,
          openid: customerIdentity.openid,
          unionid: 'updated-unionid',
        },
      },
    })
    expect(tracedStore.insertCalls.filter((call) => call.name === 'customers')).toHaveLength(1)
    expect(tracedStore.replaceCalls.filter((call) => call.name === 'customers')).toHaveLength(1)
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

  it('binds the WeChat phone code to the existing customer document', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const current = await handler({
      action: 'getCurrentCustomer',
      identity: customerIdentity,
    })

    const bound = await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })

    expect(bound).toMatchObject({
      success: true,
      data: {
        customer: {
          id: current.data.customer.id,
          openid: customerIdentity.openid,
          phoneNumber: '13800000000',
        },
      },
    })
    expect(tracedStore.insertCalls.filter((call) => call.name === 'customers')).toHaveLength(1)
    expect(tracedStore.replaceCalls.filter((call) => call.name === 'customers')).toHaveLength(2)
  })

  it('rejects WeChat order creation without a bound backend phone before stock reservation', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const { product, sku } = await createProductFixture(handler)
    const detailBefore = await handler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })
    tracedStore.insertCalls.length = 0
    tracedStore.replaceCalls.length = 0
    tracedStore.upsertCalls.length = 0

    const result = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-forged-customer',
          phoneNumber: '13999999999',
          authSource: 'wechat',
        },
      },
    })
    const detailAfter = await handler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })
    const orders = await handler({
      action: 'listMerchantOrders',
      identity: ownerIdentity,
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
    expect(detailAfter.data.skus[0].stock).toBe(detailBefore.data.skus[0].stock)
    expect(orders.data.orders).toEqual([])
    expect(tracedStore.replaceCalls.filter((call) => call.name === 'skus')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'orders' || call.name === 'inventory_ledger')).toEqual([])
  })

  it('rejects mock customer order sessions in the default production handler', async () => {
    const store = createStore()
    const setupHandler = createMallApiHandler(store, {
      createId: (() => {
        let index = 0
        return (prefix) => `${prefix}-${++index}`
      })(),
      now: () => '2026-05-11T00:00:00.000Z',
      allowTestIdentityRoles: true,
    })
    const { product, sku } = await createProductFixture(setupHandler)
    const detailBefore = await setupHandler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })
    const handler = createProductionRoleHandler(store)

    const result = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'client-forged-customer',
          phoneNumber: '13999999999',
          authSource: 'mock_wechat',
        },
      },
    })
    const [orders, ledger, detailAfter] = await Promise.all([
      store.list('orders'),
      store.list('inventory_ledger'),
      handler({
        action: 'getPublishedProductDetail',
        identity: customerIdentity,
        params: { productId: product.id },
      }),
    ])

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
    expect(orders).toEqual([])
    expect(ledger).toEqual([])
    expect(detailAfter.data.skus.find((item) => item.id === sku.id)?.stock).toBe(
      detailBefore.data.skus.find((item) => item.id === sku.id)?.stock,
    )
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

  it('rejects direct mallApi overselling before creating an order or ledger entry', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    const detailBefore = await handler({
      action: 'getPublishedProductDetail',
      params: { productId: product.id },
    })

    const result = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: sku.stock + 1,
        session: {
          authSource: 'wechat',
        },
      },
    })
    const [orders, ledger, detailAfter] = await Promise.all([
      traced.store.list('orders'),
      traced.store.list('inventory_ledger'),
      handler({
        action: 'getPublishedProductDetail',
        params: { productId: product.id },
      }),
    ])

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
      },
    })
    expect(orders).toEqual([])
    expect(ledger).toEqual([])
    expect(detailAfter.data.skus.find((item) => item.id === sku.id)?.stock).toBe(
      detailBefore.data.skus.find((item) => item.id === sku.id)?.stock,
    )
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

  it('releases reserved SKU stock and writes a release ledger entry when canceling a pending order', async () => {
    const traced = createTracedStore()
    const handler = createTracedHandler(traced)
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    const detailBefore = await handler({
      action: 'getPublishedProductDetail',
      params: { productId: product.id },
    })
    const created = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          authSource: 'wechat',
        },
      },
    })

    const canceled = await handler({
      action: 'cancelMerchantOrder',
      identity: ownerIdentity,
      params: { orderId: created.data.order.id },
    })
    const [ledger, detailAfter] = await Promise.all([
      traced.store.list('inventory_ledger'),
      handler({
        action: 'getPublishedProductDetail',
        params: { productId: product.id },
      }),
    ])

    expect(canceled).toMatchObject({
      success: true,
      data: {
        order: { id: created.data.order.id, status: 'canceled' },
      },
    })
    expect(ledger.map((entry) => entry.action)).toEqual(['reserve', 'release'])
    expect(detailAfter.data.skus.find((item) => item.id === sku.id)?.stock).toBe(
      detailBefore.data.skus.find((item) => item.id === sku.id)?.stock,
    )
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

  it('allows anonymous clients to browse published product summaries and detail', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)

    const summaries = await handler({
      action: 'listPublishedProductSummaries',
    })
    const detail = await handler({
      action: 'getPublishedProductDetail',
      params: { productId: product.id },
    })

    expect(summaries).toMatchObject({
      success: true,
      data: {
        products: [
          {
            id: product.id,
            productCode: product.productCode,
            status: 'published',
          },
        ],
      },
    })
    expect(detail).toMatchObject({
      success: true,
      data: {
        product: {
          id: product.id,
          status: 'published',
        },
        skus: [{ id: sku.id, productId: product.id }],
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

  it('removes confirmed drafts from the latest draft review snapshot after confirmation', async () => {
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

    await handler({
      action: 'confirmBatch',
      identity: ownerIdentity,
      params: { batchId: created.data.batch.id },
    })
    const snapshot = await handler({
      action: 'getLatestDraftReviewSnapshot',
      identity: ownerIdentity,
    })

    expect(snapshot).toMatchObject({
      success: true,
      data: {
        batch: { id: created.data.batch.id },
        drafts: [],
      },
    })
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
    const handler = createProductionRoleHandler(store, {
      exchangePhoneCode: async (phoneCode) => {
        if (phoneCode !== 'phone-code-ok') throw new Error('Invalid phone code')
        return '13800000000'
      },
    })
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    const created = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          authSource: 'wechat',
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

  it('updates product basics without mutating core productCode or SKU productCode', async () => {
    const store = createStore()
    const handler = createMallApiHandler(store, {
      now: () => '2026-05-11T00:00:00.000Z',
      allowTestIdentityRoles: true,
    })
    const { product, sku } = await createProductFixture(handler)

    const updated = await handler({
      action: 'updateProductBasics',
      identity: ownerIdentity,
      params: { productId: product.id },
      payload: {
        productName: 'Updated Cotton Shirt',
        productCode: 'SHOULD-NOT-CHANGE',
        description: '进口羊毛混纺，适合通勤叠穿。',
      },
    })
    const skus = await handler({
      action: 'listSkus',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const detail = await handler({
      action: 'getPublishedProductDetail',
      params: { productId: product.id },
    })

    expect(updated).toMatchObject({
      success: true,
      data: {
        product: {
          id: product.id,
          productCode: product.productCode,
          productName: 'Updated Cotton Shirt',
          description: '进口羊毛混纺，适合通勤叠穿。',
        },
      },
    })
    expect(skus.data.skus[0]).toMatchObject({
      id: sku.id,
      productCode: sku.productCode,
    })
    expect(detail.data.product).toMatchObject({
      id: product.id,
      productName: 'Updated Cotton Shirt',
      description: '进口羊毛混纺，适合通勤叠穿。',
    })
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

describe('mallApi customer mine actions', () => {
  it('advertises the mine snapshot action through listContracts', async () => {
    const handler = createHandler()

    const result = await handler({ action: 'listContracts' })

    expect(result.data.actions).toEqual(expect.arrayContaining([
      'getCustomerMineSnapshot',
    ]))
  })

  it('returns a customer-scoped mine snapshot with identity, phone, orders, utilities, and meta key', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)

    const bound = await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    await handler({
      action: 'addCustomerShoppingBagItem',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 2,
      },
    })
    await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })
    const ownOrder = await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'forged-customer',
          openid: 'forged-openid',
          authSource: 'wechat',
        },
      },
    })
    await handler({
      action: 'bindCustomerPhone',
      identity: otherCustomerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    const otherOrder = await handler({
      action: 'createCustomerOrder',
      identity: otherCustomerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'other-forged-customer',
          openid: 'other-forged-openid',
          authSource: 'wechat',
        },
      },
    })

    const result = await handler({
      action: 'getCustomerMineSnapshot',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      meta: {
        snapshotKey: `customer-mine:${bound.data.customer.id}:v1`,
      },
      data: {
        customerId: bound.data.customer.id,
        identity: {
          isSignedIn: true,
          displayName: '138****0000',
          authSource: 'wechat',
          openidMasked: 'cust...enid',
        },
        phone: {
          isBound: true,
          maskedPhoneNumber: '138****0000',
          statusLabel: 'Phone bound',
        },
        recentOrderTotalCount: 1,
        utilities: [
          {
            key: 'favorites',
            route: '/pages/customer/favorites/index',
            count: 1,
            isEnabled: true,
          },
          {
            key: 'shoppingBag',
            route: '/pages/customer/shopping-bag/index',
            count: 2,
            isEnabled: true,
          },
        ],
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(result.data.recentOrders).toEqual([
      {
        orderId: ownOrder.data.order.id,
        status: 'pending_merchant_confirm',
        statusLabel: 'Pending merchant confirmation',
        totalAmount: sku.salePrice,
        itemCount: 1,
        primaryProductName: product.productName,
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      },
    ])
    expect(result.data.recentOrders.map((order) => order.orderId)).not.toContain(otherOrder.data.order.id)
  })

  it('does not leak another customer order or private utility data', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'bindCustomerPhone',
      identity: otherCustomerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    const otherOrder = await handler({
      action: 'createCustomerOrder',
      identity: otherCustomerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'other-forged-customer',
          openid: 'other-forged-openid',
          authSource: 'wechat',
        },
      },
    })
    await handler({
      action: 'addCustomerShoppingBagItem',
      identity: otherCustomerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      },
    })
    await handler({
      action: 'favoriteCustomerProduct',
      identity: otherCustomerIdentity,
      payload: { productId: product.id },
    })

    const result = await handler({
      action: 'getCustomerMineSnapshot',
      identity: customerIdentity,
    })

    expect(result.success).toBe(true)
    expect(result.data.recentOrders).toEqual([])
    expect(result.data.recentOrderTotalCount).toBe(0)
    expect(result.data.utilities).toEqual([
      expect.objectContaining({ key: 'favorites', count: 0 }),
      expect.objectContaining({ key: 'shoppingBag', count: 0 }),
    ])
    expect(result.data.recentOrders.map((order) => order.orderId)).not.toContain(otherOrder.data.order.id)
  })

  it('rejects missing identity and ignores raw phone number payloads', async () => {
    const handler = createHandler()

    const unauthenticated = await handler({ action: 'getCustomerMineSnapshot' })
    const forgedPhone = await handler({
      action: 'getCustomerMineSnapshot',
      identity: customerIdentity,
      payload: {
        phoneNumber: '13999999999',
      },
    })

    expect(unauthenticated).toMatchObject({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
    expect(forgedPhone).toMatchObject({
      success: true,
      data: {
        phone: {
          isBound: false,
          maskedPhoneNumber: '',
          statusLabel: 'Phone not bound',
        },
      },
    })
  })

  it('does not modify order status or inventory while reading the mine snapshot', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'bindCustomerPhone',
      identity: customerIdentity,
      payload: { phoneCode: 'phone-code-ok' },
    })
    await handler({
      action: 'createCustomerOrder',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
        session: {
          customerId: 'forged-customer',
          openid: 'forged-openid',
          authSource: 'wechat',
        },
      },
    })
    const ordersBefore = await handler({
      action: 'listMerchantOrders',
      identity: ownerIdentity,
    })
    const detailBefore = await handler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })
    tracedStore.insertCalls.length = 0
    tracedStore.replaceCalls.length = 0
    tracedStore.upsertCalls.length = 0

    const snapshot = await handler({
      action: 'getCustomerMineSnapshot',
      identity: customerIdentity,
    })
    const ordersAfter = await handler({
      action: 'listMerchantOrders',
      identity: ownerIdentity,
    })
    const detailAfter = await handler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })

    expect(snapshot.success).toBe(true)
    expect(ordersAfter.data.orders).toEqual(ordersBefore.data.orders)
    expect(detailAfter.data.skus[0].stock).toBe(detailBefore.data.skus[0].stock)
    expect(tracedStore.replaceCalls.filter((call) => call.name === 'orders' || call.name === 'skus')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'inventory_ledger')).toEqual([])
  })

  it('keeps mine identity and zero utility counts when non-critical utility queries fail', async () => {
    const handler = createMallApiHandler(createStoreWithMissingCollection('shopping_bag_items'), {
      createId: (() => {
        let index = 0
        return (prefix) => `${prefix}-${++index}`
      })(),
      now: () => '2026-05-11T00:00:00.000Z',
      allowTestIdentityRoles: true,
    })

    const result = await handler({
      action: 'getCustomerMineSnapshot',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        identity: {
          isSignedIn: true,
          openidMasked: 'cust...enid',
        },
        phone: {
          isBound: false,
        },
        recentOrders: [],
        recentOrderTotalCount: 0,
        utilities: [
          expect.objectContaining({ key: 'favorites', count: 0 }),
          expect.objectContaining({ key: 'shoppingBag', count: 0 }),
        ],
      },
    })
  })
})

describe('mallApi customer shopping bag actions', () => {
  it.each([
    ['getCustomerShoppingBagSnapshot', 'shopping_bag_items'],
    ['getCustomerFavoriteProductsSnapshot', 'customer_favorites'],
  ])('maps missing CloudBase collection for %s to a safe infrastructure error', async (action, collectionName) => {
    const handler = createMallApiHandler(createStoreWithMissingCollection(collectionName), {
      createId: (() => {
        let index = 0
        return (prefix) => `${prefix}-${++index}`
      })(),
      now: () => '2026-05-11T00:00:00.000Z',
      allowTestIdentityRoles: true,
    })

    const result = await handler({
      action,
      identity: customerIdentity,
    })
    const serialized = JSON.stringify(result)

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'INFRA_SCHEMA_MISSING',
        message: 'Customer data storage is not ready',
      },
    })
    expect(serialized).not.toContain('DATABASE_COLLECTION_NOT_EXIST')
    expect(serialized).not.toContain('Db or Table not exist')
    expect(serialized).not.toContain('cloud.tencent.com/document')
  })

  it('returns an empty customer-scoped snapshot without phone authorization', async () => {
    const handler = createHandler()

    const result = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        items: [],
        totalQuantity: 0,
        selectedQuantity: 0,
        selectedSubtotal: 0,
        unavailableCount: 0,
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(result.data.customerId).toMatch(/^customer-/)
  })

  it('keeps shopping-bag items scoped to the verified customer identity', async () => {
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

    await handler({
      action: 'addCustomerShoppingBagItem',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      },
    })
    const firstCustomer = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: customerIdentity,
    })
    const secondCustomer = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: {
        openid: 'other-customer-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['customer'],
      },
    })

    expect(firstCustomer.data.items).toHaveLength(1)
    expect(firstCustomer.data.items[0]).toMatchObject({
      productId: product.id,
      skuId: sku.id,
      productName: product.productName,
      skuSpec: sku.spec,
      quantity: 1,
      unitPrice: sku.salePrice,
      lineTotal: sku.salePrice,
      availability: 'available',
      availabilityLabel: 'Available',
      isAvailableForCheckout: true,
      isSelected: true,
    })
    expect(secondCustomer.data.items).toEqual([])
  })

  it('marks unpublished or out-of-stock shopping-bag items without deleting them', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'addCustomerShoppingBagItem',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 2,
      },
    })

    await handler({
      action: 'updateSku',
      identity: ownerIdentity,
      params: { productId: product.id, skuId: sku.id },
      payload: {
        spec: sku.spec,
        salePrice: sku.salePrice,
        stock: 0,
        reason: 'stock audit',
      },
    })
    const outOfStock = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: customerIdentity,
    })
    await handler({
      action: 'unpublishProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const unpublished = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: customerIdentity,
    })

    expect(outOfStock.data.items).toHaveLength(1)
    expect(outOfStock.data.items[0]).toMatchObject({
      availability: 'outOfStock',
      availabilityLabel: 'Out of stock',
      isAvailableForCheckout: false,
    })
    expect(unpublished.data.items).toHaveLength(1)
    expect(unpublished.data.items[0]).toMatchObject({
      availability: 'unpublished',
      availabilityLabel: 'Unavailable',
      isAvailableForCheckout: false,
    })
  })

  it('updates and removes shopping-bag items without reserving stock', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const { product, sku } = await createProductFixture(handler)

    const added = await handler({
      action: 'addCustomerShoppingBagItem',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      },
    })
    const updated = await handler({
      action: 'updateCustomerShoppingBagItemQuantity',
      identity: customerIdentity,
      params: { itemId: added.data.item.id },
      payload: { quantity: 2 },
    })
    const detailAfterUpdate = await handler({
      action: 'getPublishedProductDetail',
      identity: customerIdentity,
      params: { productId: product.id },
    })
    const unselected = await handler({
      action: 'selectCustomerShoppingBagItem',
      identity: customerIdentity,
      params: { itemId: added.data.item.id },
      payload: { isSelected: false },
    })
    const removed = await handler({
      action: 'removeCustomerShoppingBagItem',
      identity: customerIdentity,
      params: { itemId: added.data.item.id },
    })
    const finalSnapshot = await handler({
      action: 'getCustomerShoppingBagSnapshot',
      identity: customerIdentity,
    })

    expect(updated.data.snapshot.items[0]).toMatchObject({
      id: added.data.item.id,
      quantity: 2,
      lineTotal: sku.salePrice * 2,
    })
    expect(unselected.data.snapshot).toMatchObject({
      selectedQuantity: 0,
      selectedSubtotal: 0,
    })
    expect(unselected.data.snapshot.items[0]).toMatchObject({
      isSelected: false,
    })
    expect(detailAfterUpdate.data.skus[0].stock).toBe(sku.stock)
    expect(tracedStore.insertCalls.filter((call) => call.name === 'inventory_ledger')).toEqual([])
    expect(removed.data.item).toMatchObject({ id: added.data.item.id })
    expect(finalSnapshot.data.items).toEqual([])
  })

  it('clears only unavailable shopping-bag items for the current customer', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)
    await handler({
      action: 'addCustomerShoppingBagItem',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      },
    })
    await handler({
      action: 'updateSku',
      identity: ownerIdentity,
      params: { productId: product.id, skuId: sku.id },
      payload: {
        spec: sku.spec,
        salePrice: sku.salePrice,
        stock: 0,
        reason: 'stock audit',
      },
    })

    const cleared = await handler({
      action: 'clearUnavailableCustomerShoppingBagItems',
      identity: customerIdentity,
    })

    expect(cleared.data.removedItemIds).toHaveLength(1)
    expect(cleared.data.snapshot.items).toEqual([])
  })
})

describe('mallApi customer favorites actions', () => {
  it('advertises favorites actions through listContracts', async () => {
    const handler = createHandler()

    const result = await handler({ action: 'listContracts' })

    expect(result.data.actions).toEqual(expect.arrayContaining([
      'getCustomerFavoriteProductsSnapshot',
      'favoriteCustomerProduct',
      'unfavoriteCustomerProduct',
      'removeCustomerFavoriteProduct',
    ]))
  })

  it('returns an empty customer-scoped favorites snapshot without phone authorization', async () => {
    const handler = createHandler()

    const result = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        items: [],
        totalCount: 0,
        availableCount: 0,
        unavailableCount: 0,
        serverTime: '2026-05-11T00:00:00.000Z',
      },
    })
    expect(result.data.customerId).toMatch(/^customer-/)
  })

  it('creates product-level favorites idempotently and keeps them scoped to the verified customer', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const { product } = await createProductFixture(handler)
    tracedStore.insertCalls.length = 0

    const first = await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })
    const duplicate = await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })
    const firstCustomer = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })
    const secondCustomer = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: {
        openid: 'other-customer-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['customer'],
      },
    })

    expect(first).toMatchObject({
      success: true,
      data: {
        favorite: {
          productId: product.id,
        },
        invalidatedSnapshotKeys: [
          expect.stringMatching(/^customer-favorites:customer-\d+:v1$/),
          `customer-product-detail:${product.id}:v1`,
        ],
      },
    })
    expect(duplicate.data.favorite.id).toBe(first.data.favorite.id)
    expect(firstCustomer.data.items).toHaveLength(1)
    expect(firstCustomer.data.items[0]).toMatchObject({
      favoriteId: first.data.favorite.id,
      productId: product.id,
      productCode: product.productCode,
      productName: product.productName,
      mainImageUrl: product.mainImageUrl,
      minPrice: 129,
      availability: 'available',
      availabilityLabel: 'Available',
      canOpenDetail: true,
      favoritedAt: '2026-05-11T00:00:00.000Z',
    })
    expect(secondCustomer.data.items).toEqual([])
    expect(tracedStore.upsertCalls.filter((call) => call.name === 'customer_favorites')).toHaveLength(1)
    expect(tracedStore.insertCalls.filter((call) => call.name === 'customer_favorites')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'shopping_bag_items')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'orders')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'inventory_ledger')).toEqual([])
  })

  it('keeps concurrent duplicate favorites to one deterministic customer-product document', async () => {
    const tracedStore = createTracedStore()
    const handler = createTracedHandler(tracedStore)
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })
    tracedStore.insertCalls.length = 0
    tracedStore.upsertCalls.length = 0

    const [first, second] = await Promise.all([
      handler({
        action: 'favoriteCustomerProduct',
        identity: customerIdentity,
        payload: { productId: product.id },
      }),
      handler({
        action: 'favoriteCustomerProduct',
        identity: customerIdentity,
        payload: { productId: product.id },
      }),
    ])
    const customerId = first.data.favorite.customerId
    const storedFavorites = await tracedStore.store.list('customer_favorites', {
      customer_id: customerId,
      product_id: product.id,
    })

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    expect(second.data.favorite.id).toBe(first.data.favorite.id)
    expect(storedFavorites).toHaveLength(1)
    expect(storedFavorites[0]).toMatchObject({
      _id: first.data.favorite.id,
      customer_id: customerId,
      product_id: product.id,
    })
    expect(tracedStore.upsertCalls.filter((call) => call.name === 'customer_favorites')).toHaveLength(2)
    expect(tracedStore.insertCalls.filter((call) => call.name === 'customer_favorites')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'orders')).toEqual([])
    expect(tracedStore.insertCalls.filter((call) => call.name === 'inventory_ledger')).toEqual([])
  })

  it('keeps unavailable and deleted products in the favorites snapshot without changing product rules', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })

    await handler({
      action: 'unpublishProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const unpublished = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })
    await handler({
      action: 'deleteProduct',
      identity: ownerIdentity,
      params: { productId: product.id },
    })
    const deleted = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })

    expect(unpublished.data.items).toHaveLength(1)
    expect(unpublished.data.items[0]).toMatchObject({
      productId: product.id,
      productName: product.productName,
      availability: 'unpublished',
      availabilityLabel: 'Unavailable',
      canOpenDetail: false,
    })
    expect(deleted.data.items).toHaveLength(1)
    expect(deleted.data.items[0]).toMatchObject({
      productId: product.id,
      productCode: '',
      productName: 'Unavailable product',
      mainImageUrl: '',
      minPrice: '-',
      availability: 'deleted',
      availabilityLabel: 'Deleted',
      canOpenDetail: false,
    })
  })

  it('rejects SKU-level favorite payloads', async () => {
    const handler = createHandler()
    const { product, sku } = await createProductFixture(handler)

    const result = await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: {
        productId: product.id,
        skuId: sku.id,
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    })
  })

  it('does not leak favorite state through public product summaries', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })

    const summaries = await handler({
      action: 'listPublishedProductSummaries',
      identity: customerIdentity,
    })

    expect(summaries.data.products).toHaveLength(1)
    expect(summaries.data.products[0]).toMatchObject({
      id: product.id,
      productName: product.productName,
    })
    expect(summaries.data.products[0]).not.toHaveProperty('isFavorited')
    expect(summaries.data.products[0]).not.toHaveProperty('favoriteId')
    expect(summaries.data.products[0]).not.toHaveProperty('customerId')
  })

  it('unfavorites with product-detail and favorites invalidation', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })

    const removed = await handler({
      action: 'unfavoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })

    expect(removed).toMatchObject({
      success: true,
      data: {
        removedFavorite: {
          productId: product.id,
        },
        invalidatedSnapshotKeys: [
          expect.stringMatching(/^customer-favorites:customer-\d+:v1$/),
          `customer-product-detail:${product.id}:v1`,
        ],
      },
    })
  })

  it('removes favorites with favorites-only invalidation', async () => {
    const handler = createHandler()
    const { product } = await createProductFixture(handler)
    await handler({
      action: 'favoriteCustomerProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })

    const removed = await handler({
      action: 'removeCustomerFavoriteProduct',
      identity: customerIdentity,
      payload: { productId: product.id },
    })
    const snapshot = await handler({
      action: 'getCustomerFavoriteProductsSnapshot',
      identity: customerIdentity,
    })

    expect(removed).toMatchObject({
      success: true,
      data: {
        removedFavorite: {
          productId: product.id,
        },
        invalidatedSnapshotKeys: [expect.stringMatching(/^customer-favorites:customer-\d+:v1$/)],
      },
    })
    expect(removed.data.invalidatedSnapshotKeys).not.toContain(`customer-product-detail:${product.id}:v1`)
    expect(snapshot.data.items).toEqual([])
  })
})

describe('mallApi publish validation contract', () => {
  it.each(productPublishValidationCases)('matches the shared publish validation contract: $name', (contractCase) => {
    expect(validateProductForPublish(contractCase.product, contractCase.skus)).toEqual(contractCase.expectedMessages)
  })
})
