import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { createMallApiHandler, createMemoryDocumentStore } = require('./mall-api-core')

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
