import type { Product, Sku } from '../../domain/catalog/types'
import type { Order } from '../../domain/order/types'
import { mockWechatAuthService } from '../../services/auth/mock-wechat-auth-service'
import type { WechatAuthService } from '../../services/auth/wechat-auth-service'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import type {
  CustomerProductDetailSkuView,
  CustomerProductDetailViewModel,
  SelectCustomerProductSkuResult,
  SubmitCustomerProductDetailOrderResult,
} from '../customer-product-detail/customer-product-detail'
import { productDescriptionFallbackText } from '../customer-product-detail/customer-product-detail'

const productUnavailableMessage = '商品不存在或未上架'
const selectAvailableSkuMessage = '请选择有库存的规格'
const outOfStockMessage = '该规格暂无库存'
const canceledAuthMessage = '已取消授权，未创建订单'

const toSkuView = (sku: Sku, selectedSkuId: string): CustomerProductDetailSkuView => ({
  id: sku.id,
  spec: sku.spec,
  salePrice: sku.salePrice,
  stock: sku.stock,
  isSelected: selectedSkuId === sku.id,
  isDisabled: sku.stock <= 0,
})

const findPublishedProduct = async (productId: string, client: CloudBaseMallApiClient): Promise<Product | null> => {
  const { products } = await client.listPublishedProducts()
  return products.find((product) => product.id === productId) ?? null
}

export const getCloudBaseCustomerProductDetailView = async (
  productId: string,
  selectedSkuId = '',
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<CustomerProductDetailViewModel> => {
  const product = await findPublishedProduct(productId, client)
  const skus = product ? (await client.listSkus(product.id)).skus.map((sku) => toSkuView(sku, selectedSkuId)) : []
  const selectedSku = skus.find((sku) => sku.id === selectedSkuId)

  return {
    product,
    descriptionText: product?.description.trim() ? product.description : productDescriptionFallbackText,
    skus,
    isPublished: Boolean(product),
    canSubmitOrder: Boolean(product && selectedSku && !selectedSku.isDisabled),
    emptyMessage: productUnavailableMessage,
  }
}

export const selectCloudBaseCustomerProductSku = async (
  productId: string,
  skuId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<SelectCustomerProductSkuResult> => {
  const view = await getCloudBaseCustomerProductDetailView(productId, skuId, client)
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

export const submitCloudBaseCustomerProductDetailOrder = async (params: {
  productId: string
  skuId: string
  quantity?: number
  authService?: WechatAuthService
  confirmLogin: () => Promise<boolean>
  confirmPhoneAuthorization: () => Promise<boolean>
  requestPhoneNumber?: () => Promise<string | null>
  client?: CloudBaseMallApiClient
}): Promise<SubmitCustomerProductDetailOrderResult> => {
  const client = params.client ?? getRuntimeCloudBaseMallApiClient()
  const view = await getCloudBaseCustomerProductDetailView(params.productId, params.skuId, client)
  const sku = view.skus.find((item) => item.id === params.skuId)

  if (!view.product || !view.isPublished) {
    return { status: 'blocked', order: null, message: productUnavailableMessage }
  }
  if (!sku || sku.isDisabled) {
    return { status: 'blocked', order: null, message: selectAvailableSkuMessage }
  }

  const authService = params.authService ?? mockWechatAuthService
  let session = authService.getCurrentSession()
  if (!session) {
    const shouldLogin = await params.confirmLogin()
    if (!shouldLogin) {
      return { status: 'canceled', order: null, message: canceledAuthMessage }
    }
    session = await authService.login()
  }

  if (!session.phoneNumber) {
    const shouldAuthorizePhone = await params.confirmPhoneAuthorization()
    if (!shouldAuthorizePhone) {
      return { status: 'canceled', order: null, message: canceledAuthMessage }
    }
    const phoneNumber = params.requestPhoneNumber ? await params.requestPhoneNumber() : undefined
    const authorizedSession = await authService.authorizePhoneNumber(phoneNumber ?? undefined)
    if (!authorizedSession) {
      return { status: 'canceled', order: null, message: canceledAuthMessage }
    }
    session = authorizedSession
  }

  if (!session?.phoneNumber) {
    return { status: 'canceled', order: null, message: canceledAuthMessage }
  }

  try {
    const { order } = await client.createCustomerOrder({
      productId: view.product.id,
      skuId: sku.id,
      quantity: params.quantity ?? 1,
      session,
    })

    return {
      status: 'created',
      order: order as Order,
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
