import type { Order } from '../../domain/order/types'
import type { Product } from '../../domain/catalog/types'
import type { WechatAuthService } from '../../services/auth/wechat-auth-service'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export const submitCustomerWechatOrder = async (params: {
  product: Product
  skuId: string
  quantity: number
  authService: WechatAuthService
  confirmLogin: () => Promise<boolean>
  requestPhoneNumber?: () => Promise<string | null>
}): Promise<Order | null> => {
  let session = params.authService.getCurrentSession()

  if (!session) {
    const shouldLogin = await params.confirmLogin()
    if (!shouldLogin) {
      return null
    }
    session = await params.authService.login()
  }

  return mallWorkflow.createAuthorizedOrder(params.product, params.skuId, {
    session,
    quantity: params.quantity,
  })
}
