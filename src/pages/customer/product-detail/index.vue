<template>
  <view class="page">
    <view v-if="product && product.status === 'published'" class="card">
      <image v-if="product.mainImageUrl" class="image" :src="product.mainImageUrl" mode="aspectFill" />
      <text class="title">{{ product.productName }}</text>
      <text class="code">货号：{{ product.productCode }}</text>

      <text class="section-title">选择规格</text>
      <view
        v-for="sku in skus"
        :key="sku.id"
        class="sku"
        :class="{ selected: selectedSkuId === sku.id, disabled: sku.stock <= 0 }"
        @tap="selectSku(sku.id, sku.stock)"
      >
        <text>{{ sku.spec }}</text>
        <text>￥{{ sku.salePrice }} 库存 {{ sku.stock }}</text>
      </view>

      <button class="primary" @tap="submitOrder">微信手机号下单</button>
      <text v-if="message" class="message">{{ message }}</text>
    </view>
    <text v-else class="empty">商品不存在或未上架</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { submitCustomerWechatOrder } from '../../../features/customer-order/customer-order'
import { mockWechatAuthService } from '../../../services/auth/mock-wechat-auth-service'
import { mallRepository } from '../../../services/repositories/mall-repository'

const productId = ref('')
const selectedSkuId = ref('')
const message = ref('')

onLoad((query) => {
  productId.value = String(query?.id ?? '')
})

const product = computed(() => mallRepository.listProducts().find((item) => item.id === productId.value))
const skus = computed(() => mallRepository.listSkus(productId.value))

const selectSku = (skuId: string, stock: number) => {
  if (stock <= 0) {
    message.value = '该规格暂无库存'
    return
  }
  selectedSkuId.value = skuId
  message.value = ''
}

const confirmModal = (content: string) =>
  new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '微信授权',
      content,
      confirmText: '继续',
      cancelText: '取消',
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })

const submitOrder = async () => {
  if (!product.value || !selectedSkuId.value) {
    message.value = '请选择有库存的规格'
    return
  }

  try {
    const order = await submitCustomerWechatOrder({
      product: product.value,
      skuId: selectedSkuId.value,
      quantity: 1,
      authService: mockWechatAuthService,
      confirmLogin: () => confirmModal('需要先完成微信快捷登录后才能提交订单。'),
      confirmPhoneAuthorization: () => confirmModal('需要授权微信绑定手机号，用于商家确认订单。'),
    })
    if (!order) {
      message.value = '已取消授权，未创建订单'
      return
    }
    message.value = `订单已提交，等待商家确认：${order.id}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : '订单提交失败'
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f6f7f9;
}

.card {
  padding: 24rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.image {
  width: 100%;
  height: 420rpx;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
  background: #eef0f3;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.section-title {
  display: block;
  margin-top: 24rpx;
  font-weight: 600;
}

.code,
.empty,
.message {
  display: block;
  margin-top: 12rpx;
  color: #576071;
}

.sku {
  display: flex;
  justify-content: space-between;
  margin-top: 18rpx;
  padding: 18rpx;
  background: #f6f7f9;
  border-radius: 8rpx;
}

.selected {
  color: #0f62fe;
  background: #e8f0ff;
}

.disabled {
  color: #9aa3b2;
}

.primary {
  margin-top: 28rpx;
  color: #ffffff;
  background: #0f62fe;
}
</style>
