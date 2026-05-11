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
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  type OwnerProductStatusFilter,
  type OwnerProductsViewModel,
} from '../../../features/owner-products/owner-products'
import {
  getCloudBaseOwnerProductsView,
  publishCloudBaseOwnerProduct,
  publishReadyCloudBaseOwnerProducts,
} from '../../../features/cloudbase-mall/owner-products'

const selectedStatus = ref<OwnerProductStatusFilter>('all')
const message = ref('')
const viewModel = ref<OwnerProductsViewModel>({
  statusOptions: [],
  products: [],
  canBatchPublish: false,
  readyProductCount: 0,
  emptyMessage: '当前筛选下暂无商品',
})

const refreshView = async () => {
  viewModel.value = await getCloudBaseOwnerProductsView(selectedStatus.value)
}

onShow(() => {
  void refreshView()
})

watch(selectedStatus, () => {
  void refreshView()
})

const publish = async (productId: string) => {
  const result = await publishCloudBaseOwnerProduct(productId)
  message.value = result.message
  await refreshView()
}

const publishReadyProducts = async () => {
  const result = await publishReadyCloudBaseOwnerProducts()
  message.value = result.message
  await refreshView()
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
