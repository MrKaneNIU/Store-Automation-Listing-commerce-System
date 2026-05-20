import type { UploadedImage } from '../../domain/batch/types'
import { createProductsFromDrafts, canPublishProduct } from '../../domain/catalog/rules'
import type { Product } from '../../domain/catalog/types'
import { confirmDrafts } from '../../domain/draft/rules'
import { canCreateOrder, cancelOrder, createPendingOrder, confirmOrder } from '../../domain/order/rules'
import { createId, nowIso } from '../../domain/shared/ids'
import type { CustomerSession } from '../../services/auth/customer-session'
import { mockOcrProvider } from '../../services/ocr/mock-ocr-provider'
import { mallRepository } from '../../services/repositories/mall-repository'
import { uploadService } from '../../services/storage/runtime-upload-service'

const saveInventoryLedgerEntry = (entry: {
  skuId: string
  orderId?: string
  action: 'reserve' | 'release' | 'confirm' | 'adjust'
  quantityDelta: number
  sourceType: 'order' | 'manual'
  sourceId: string
  note: string
}) => {
  mallRepository.saveInventoryLedgerEntry({
    id: createId('ledger'),
    createdAt: nowIso(),
    ...entry,
  })
}

export const mallWorkflow = {
  async createMockImportBatch(images?: UploadedImage[]) {
    const uploadedImages = images ?? (await uploadService.chooseImages({ businessType: 'ocr_screenshot', sourceRole: 'owner', entityType: 'ocr_batch' }))
    const timestamp = nowIso()
    const batch = mallRepository.saveBatch({
      id: createId('batch'),
      status: 'uploaded',
      imageUrls: uploadedImages.map((image) => image.url),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    const recognized = await mockOcrProvider.recognizeBatch({
      batchId: batch.id,
      images: uploadedImages,
      context: {
        jobId: `job-${batch.id}`,
        requestedAt: timestamp,
      },
    })
    if (!recognized.ok) {
      return { batch, drafts: [] }
    }
    const { drafts } = recognized
    mallRepository.saveDrafts(drafts)
    const recognizedBatch = mallRepository.updateBatch({ ...batch, status: 'recognized', updatedAt: nowIso() })

    return { batch: recognizedBatch, drafts }
  },
  confirmBatch(batchId: string) {
    const batch = mallRepository.listBatches().find((item) => item.id === batchId)
    if (batch?.status === 'confirmed') {
      return { issues: [], products: [], skus: [], warnings: [] }
    }

    const currentDrafts = mallRepository.listDrafts(batchId)
    const { drafts, issues } = confirmDrafts(currentDrafts)
    mallRepository.replaceDrafts(batchId, drafts)
    if (issues.length > 0) {
      return { issues, products: [], skus: [], warnings: [] }
    }

    const result = createProductsFromDrafts(drafts)
    mallRepository.saveProducts(result.products, result.skus)
    if (batch) {
      mallRepository.updateBatch({ ...batch, status: 'confirmed', updatedAt: nowIso() })
    }
    return { issues, ...result }
  },
  async supplementProductImages(product: Product) {
    const uploaded = await uploadService.uploadProductImages(product.id)
    const nextProduct: Product = {
      ...product,
      mainImageUrl: uploaded.mainImageUrl,
      imageUrls: uploaded.imageUrls,
      status: 'ready_to_publish',
      updatedAt: nowIso(),
    }
    return mallRepository.updateProduct(nextProduct)
  },
  publishProduct(product: Product) {
    const skus = mallRepository.listSkus(product.id)
    if (!canPublishProduct(product, skus)) {
      return product
    }
    return mallRepository.updateProduct({ ...product, status: 'published', updatedAt: nowIso() })
  },
  createOrder(
    product: Product,
    skuId: string,
    params: {
      customerName: string
      customerPhone: string
      customerId?: string
      customerAuthSource?: 'mock_wechat' | 'wechat'
      idempotencyKey?: string
      quantity: number
    },
  ) {
    const sku = mallRepository.listSkus(product.id).find((item) => item.id === skuId)
    if (!sku) {
      throw new Error('SKU 涓嶅瓨鍦?')
    }
    if (!canCreateOrder(product, sku, params.quantity)) {
      throw new Error('鍟嗗搧鏈笂鏋舵垨搴撳瓨涓嶈冻')
    }

    const normalizedKey = params.idempotencyKey?.trim()
    if (normalizedKey) {
      const existingOrder = mallRepository.listOrders().find((order) => order.idempotencyKey === normalizedKey)
      if (existingOrder) {
        return existingOrder
      }
    }

    const order = createPendingOrder({ product, sku, ...params })
    mallRepository.updateSku({ ...sku, stock: sku.stock - params.quantity })
    saveInventoryLedgerEntry({
      skuId: sku.id,
      orderId: order.id,
      action: 'reserve',
      quantityDelta: -params.quantity,
      sourceType: 'order',
      sourceId: order.id,
      note: `reserve stock for order ${order.id}`,
    })
    return mallRepository.saveOrder(order)
  },
  createAuthorizedOrder(
    product: Product,
    skuId: string,
    params: {
      session: CustomerSession | null
      idempotencyKey?: string
      quantity: number
    },
  ) {
    if (!params.session?.phoneNumber) {
      throw new Error('璇峰厛瀹屾垚寰俊鎵嬫満鍙锋巿鏉?')
    }

    return mallWorkflow.createOrder(product, skuId, {
      customerName: params.session.nickname ?? '寰俊鐢ㄦ埛',
      customerPhone: params.session.phoneNumber,
      customerId: params.session.customerId,
      customerAuthSource: params.session.authSource,
      idempotencyKey: params.idempotencyKey,
      quantity: params.quantity,
    })
  },
  confirmOrder(orderId: string) {
    const order = mallRepository.listOrders().find((item) => item.id === orderId)
    if (!order) {
      throw new Error('璁㈠崟涓嶅瓨鍦?')
    }
    if (order.status !== 'pending_merchant_confirm') {
      throw new Error('鍙湁寰呭晢瀹剁‘璁よ鍗曞彲浠ョ‘璁?')
    }
    const confirmed = mallRepository.updateOrder(confirmOrder(order))
    saveInventoryLedgerEntry({
      skuId: order.items[0].skuId,
      orderId: order.id,
      action: 'confirm',
      quantityDelta: 0,
      sourceType: 'order',
      sourceId: order.id,
      note: `confirm order ${order.id}`,
    })
    return confirmed
  },
  cancelOrder(orderId: string) {
    const order = mallRepository.listOrders().find((item) => item.id === orderId)
    if (!order) {
      throw new Error('璁㈠崟涓嶅瓨鍦?')
    }
    if (order.status !== 'pending_merchant_confirm') {
      throw new Error('鍙湁寰呭晢瀹剁‘璁よ鍗曞彲浠ュ彇娑?')
    }
    order.items.forEach((item) => {
      const sku = mallRepository.listSkus().find((currentSku) => currentSku.id === item.skuId)
      if (sku) {
        mallRepository.updateSku({ ...sku, stock: sku.stock + item.quantity })
        saveInventoryLedgerEntry({
          skuId: sku.id,
          orderId: order.id,
          action: 'release',
          quantityDelta: item.quantity,
          sourceType: 'order',
          sourceId: order.id,
          note: `release stock for order ${order.id}`,
        })
      }
    })
    return mallRepository.updateOrder(cancelOrder(order))
  },
}
