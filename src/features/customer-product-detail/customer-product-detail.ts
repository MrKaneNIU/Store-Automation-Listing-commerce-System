import type { Product, Sku } from '../../domain/catalog/types'
import type { Order } from '../../domain/order/types'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import type { WechatAuthService } from '../../services/auth/wechat-auth-service'
import { createStaticProductImageView, type ProductImageViewModel } from '../../services/storage/product-image-url'
import { submitCustomerWechatOrder } from '../customer-order/customer-order'
import { mallAccess } from '../mall-workflow/mall-access'

export type CustomerProductDetailSkuView = {
  id: string
  spec: string
  salePrice: number
  stock: number
  isSelected: boolean
  isDisabled: boolean
}

export type CustomerProductDetailViewModel = {
  product: (Product & ProductImageViewModel) | null
  descriptionText: string
  skus: CustomerProductDetailSkuView[]
  isPublished: boolean
  canSubmitOrder: boolean
  emptyMessage: string
}

export type SelectCustomerProductSkuResult = {
  selectedSkuId: string
  message: string
}

export type SubmitCustomerProductDetailOrderResult =
  | {
      status: 'created'
      order: Order
      message: string
    }
  | {
      status: 'canceled' | 'blocked' | 'failed'
      order: null
      message: string
    }

const productUnavailableMessage = '商品不存在或未上架'
export const productDescriptionFallbackText = '暂无商品简介，商家正在完善中。'
const selectAvailableSkuMessage = '请选择有库存的规格'
const outOfStockMessage = '该规格暂无库存'
const canceledAuthMessage = '请先登录后下单'

const toSkuView = (sku: Sku, selectedSkuId: string): CustomerProductDetailSkuView => ({
  id: sku.id,
  spec: sku.spec,
  salePrice: sku.salePrice,
  stock: sku.stock,
  isSelected: selectedSkuId === sku.id,
  isDisabled: sku.stock <= 0,
})

export const getCustomerProductDetailView = (
  productId: string,
  selectedSkuId = '',
): CustomerProductDetailViewModel => {
  const product = mallAccess.getProduct(productId) ?? null
  const isPublished = product?.status === 'published'
  const skus = isPublished ? mallAccess.listSkus(product.id).map((sku) => toSkuView(sku, selectedSkuId)) : []
  const selectedSku = skus.find((sku) => sku.id === selectedSkuId)

  return {
    product: product ? { ...product, ...createStaticProductImageView(product) } : null,
    descriptionText: product?.description.trim() ? product.description : productDescriptionFallbackText,
    skus,
    isPublished,
    canSubmitOrder: Boolean(isPublished && selectedSku && !selectedSku.isDisabled),
    emptyMessage: productUnavailableMessage,
  }
}

export const selectCustomerProductSku = (productId: string, skuId: string): SelectCustomerProductSkuResult => {
  const view = getCustomerProductDetailView(productId, skuId)
  const sku = view.skus.find((item) => item.id === skuId)

  if (!view.product || !view.isPublished) {
    return { selectedSkuId: '', message: productUnavailableMessage }
  }
  if (!sku) {
    return { selectedSkuId: '', message: outOfStockMessage }
  }
  if (sku.isDisabled) {
    return { selectedSkuId: sku.id, message: outOfStockMessage }
  }

  return { selectedSkuId: sku.id, message: '' }
}

export const submitCustomerProductDetailOrder = async (params: {
  productId: string
  skuId: string
  quantity?: number
  authService?: WechatAuthService
  confirmLogin: () => Promise<boolean>
}): Promise<SubmitCustomerProductDetailOrderResult> => {
  const view = getCustomerProductDetailView(params.productId, params.skuId)
  const sku = view.skus.find((item) => item.id === params.skuId)

  if (!view.product || !view.isPublished) {
    return { status: 'blocked', order: null, message: productUnavailableMessage }
  }
  if (!sku || sku.isDisabled) {
    return { status: 'blocked', order: null, message: selectAvailableSkuMessage }
  }

  try {
    const order = await submitCustomerWechatOrder({
      product: view.product,
      skuId: sku.id,
      quantity: params.quantity ?? 1,
      authService: params.authService ?? mockWechatAuthService,
      confirmLogin: params.confirmLogin,
    })

    if (!order) {
      return { status: 'canceled', order: null, message: canceledAuthMessage }
    }

    return {
      status: 'created',
      order,
      message: `订单已提交，等待商家确认：${order.id}`,
    }
  } catch (error) {
    return {
      status: 'failed',
      order: null,
      message: error instanceof Error ? error.message : '订单提交失败',
    }
  }
}
