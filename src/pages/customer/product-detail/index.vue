<template>
  <view class="page">
    <view v-if="viewModel.product && viewModel.isPublished" class="card">
      <image v-if="viewModel.product.mainImageUrl" class="image" :src="viewModel.product.mainImageUrl" mode="aspectFill" />
      <text class="title">{{ viewModel.product.productName }}</text>
      <text class="code">货号：{{ viewModel.product.productCode }}</text>

      <text class="section-title">选择规格</text>
      <view
        v-for="sku in viewModel.skus"
        :key="sku.id"
        class="sku"
        :class="{ selected: sku.isSelected, disabled: sku.isDisabled }"
        @tap="selectSku(sku.id)"
      >
        <text>{{ sku.spec }}</text>
        <text>¥{{ sku.salePrice }} 库存 {{ sku.stock }}</text>
      </view>

      <button class="primary" @tap="submitOrder">微信手机号下单</button>
      <text v-if="message" class="message">{{ message }}</text>
    </view>
    <text v-else class="empty">{{ viewModel.emptyMessage }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getCustomerProductDetailView,
  selectCustomerProductSku,
  submitCustomerProductDetailOrder,
} from '../../../features/customer-product-detail/customer-product-detail'

const productId = ref('')
const selectedSkuId = ref('')
const message = ref('')

onLoad((query) => {
  productId.value = String(query?.id ?? '')
})

const viewModel = computed(() => getCustomerProductDetailView(productId.value, selectedSkuId.value))

const selectSku = (skuId: string) => {
  const result = selectCustomerProductSku(productId.value, skuId)
  selectedSkuId.value = result.selectedSkuId
  message.value = result.message
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
  if (!viewModel.value.canSubmitOrder) {
    message.value = '请选择有库存的规格'
    return
  }

  const result = await submitCustomerProductDetailOrder({
    productId: productId.value,
    skuId: selectedSkuId.value,
    quantity: 1,
    confirmLogin: () => confirmModal('需要先完成微信快捷登录后才能提交订单。'),
    confirmPhoneAuthorization: () => confirmModal('需要授权微信绑定手机号，用于商家确认订单。'),
  })
  message.value = result.message
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
