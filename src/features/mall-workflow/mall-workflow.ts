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
    const drafts = await mockOcrProvider.recognizeBatch(batch.id, uploadedImages)
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
      quantity: number
    },
  ) {
    const sku = mallRepository.listSkus(product.id).find((item) => item.id === skuId)
    if (!sku) {
      throw new Error('SKU 不存在')
    }
    if (!canCreateOrder(product, sku, params.quantity)) {
      throw new Error('商品未上架或库存不足')
    }
    const order = createPendingOrder({ product, sku, ...params })
    mallRepository.updateSku({ ...sku, stock: sku.stock - params.quantity })
    return mallRepository.saveOrder(order)
  },
  createAuthorizedOrder(
    product: Product,
    skuId: string,
    params: {
      session: CustomerSession | null
      quantity: number
    },
  ) {
    if (!params.session?.phoneNumber) {
      throw new Error('请先完成微信手机号授权')
    }

    return mallWorkflow.createOrder(product, skuId, {
      customerName: params.session.nickname ?? '微信用户',
      customerPhone: params.session.phoneNumber,
      customerId: params.session.customerId,
      customerAuthSource: params.session.authSource,
      quantity: params.quantity,
    })
  },
  confirmOrder(orderId: string) {
    const order = mallRepository.listOrders().find((item) => item.id === orderId)
    if (!order) {
      throw new Error('订单不存在')
    }
    if (order.status !== 'pending_merchant_confirm') {
      throw new Error('只有待商家确认订单可以确认')
    }
    return mallRepository.updateOrder(confirmOrder(order))
  },
  cancelOrder(orderId: string) {
    const order = mallRepository.listOrders().find((item) => item.id === orderId)
    if (!order) {
      throw new Error('订单不存在')
    }
    if (order.status !== 'pending_merchant_confirm') {
      throw new Error('只有待商家确认订单可以取消')
    }
    order.items.forEach((item) => {
      const sku = mallRepository.listSkus().find((currentSku) => currentSku.id === item.skuId)
      if (sku) {
        mallRepository.updateSku({ ...sku, stock: sku.stock + item.quantity })
      }
    })
    return mallRepository.updateOrder(cancelOrder(order))
  },
}
