import { describe, expect, it } from 'vitest'
import { mallWorkflow } from '../mall-workflow/mall-workflow'
import { mallRepository } from '../../services/repositories/mall-repository'
import { resetMockDb } from '../../services/repositories/mock-db'
import { cancelOwnerOrder, confirmOwnerOrder, getOwnerOrdersView } from './owner-orders'

const prepareOrder = async () => {
  resetMockDb()
  const { batch } = await mallWorkflow.createMockImportBatch([{ id: 'image-1', url: '/tmp/page-1.png', name: '商品页' }])
  mallRepository.replaceDrafts(
    batch.id,
    mallRepository.listDrafts(batch.id).map((draft) => ({ ...draft, status: 'confirmed' as const })),
  )
  const result = mallWorkflow.confirmBatch(batch.id)
  const ready = await mallWorkflow.supplementProductImages(result.products[0])
  const published = mallWorkflow.publishProduct(ready)
  const sku = mallRepository.listSkus(published.id)[0]
  const order = mallWorkflow.createOrder(published, sku.id, {
    customerName: '测试客户',
    customerPhone: '13800000000',
    quantity: 1,
  })

  return { order, sku, productId: published.id }
}

describe('owner orders facade', () => {
  it('builds order display models with action availability', async () => {
    const { order } = await prepareOrder()

    const view = getOwnerOrdersView()

    expect(view.orders).toHaveLength(1)
    expect(view.orders[0]).toMatchObject({
      id: order.id,
      statusLabel: '待商家确认',
      canConfirm: true,
      canCancel: true,
    })
  })

  it('confirms pending orders and disables later actions in the display model', async () => {
    const { order } = await prepareOrder()

    const result = confirmOwnerOrder(order.id)
    const view = getOwnerOrdersView()

    expect(result.message).toBe(`订单已确认：${order.id}`)
    expect(view.orders[0]).toMatchObject({ statusLabel: '已确认', canConfirm: false, canCancel: false })
  })

  it('cancels pending orders and restores reserved stock', async () => {
    const { order, sku, productId } = await prepareOrder()

    const result = cancelOwnerOrder(order.id)

    expect(result.message).toBe(`订单已取消：${order.id}`)
    expect(getOwnerOrdersView().orders[0]).toMatchObject({ statusLabel: '已取消', canConfirm: false, canCancel: false })
    expect(mallRepository.listSkus(productId)[0].stock).toBe(sku.stock)
  })

  it('keeps non-pending order protection in the command result', async () => {
    const { order } = await prepareOrder()
    confirmOwnerOrder(order.id)

    const result = cancelOwnerOrder(order.id)

    expect(result.message).toContain('只有待商家确认订单可以取消')
  })
})
