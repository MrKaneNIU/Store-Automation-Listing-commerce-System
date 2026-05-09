<template>
  <view class="page">
    <text class="title">商品管理</text>

    <view class="tabs">
      <button
        v-for="option in viewModel.statusOptions"
        :key="option.value"
        size="mini"
        :class="{ active: selectedStatus === option.value }"
        @tap="selectedStatus = option.value"
      >
        {{ option.label }}
      </button>
    </view>

    <button class="primary" :disabled="!viewModel.canBatchPublish" @tap="publishReadyProducts">批量上架可上架商品</button>

    <view v-for="product in viewModel.products" :key="product.id" class="card">
      <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
      <text class="name">{{ product.productCode }} {{ product.productName }}</text>
      <text>状态：{{ product.statusLabel }}</text>
      <text>SKU：{{ product.skuCount }} 个</text>
      <button v-if="product.canPublish" @tap="publish(product.id)">上架</button>
    </view>

    <text v-if="viewModel.products.length === 0" class="empty">{{ viewModel.emptyMessage }}</text>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getOwnerProductsView,
  publishOwnerProduct,
  publishReadyOwnerProducts,
  type OwnerProductStatusFilter,
} from '../../../features/owner-products/owner-products'

const version = ref(0)
const selectedStatus = ref<OwnerProductStatusFilter>('all')
const message = ref('')

onShow(() => {
  version.value += 1
})

const viewModel = computed(() => {
  version.value
  return getOwnerProductsView(selectedStatus.value)
})

const refreshView = () => {
  version.value += 1
}

const publish = (productId: string) => {
  const result = publishOwnerProduct(productId)
  message.value = result.message
  refreshView()
}

const publishReadyProducts = () => {
  const result = publishReadyOwnerProducts()
  message.value = result.message
  refreshView()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f6f7f9;
}

.title {
  display: block;
  margin-bottom: 24rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.active {
  color: #ffffff;
  background: #0f62fe;
}

.primary {
  margin-bottom: 24rpx;
  color: #ffffff;
  background: #0f62fe;
}

.card,
.result {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.thumb {
  width: 100%;
  height: 260rpx;
  border-radius: 8rpx;
  background: #eef0f3;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
}

.empty {
  color: #576071;
}
</style>
