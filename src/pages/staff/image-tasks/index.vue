<template>
  <view class="page">
    <text class="title">待补图商品</text>
    <text class="hint">店员只处理已创建商品的补图任务，不进入 OCR 草稿确认流程。</text>

    <view class="filters">
      <input class="input" v-model="keyword" placeholder="按商品货号搜索" />
      <picker :range="viewModel.batchOptions" range-key="label" @change="selectBatch">
        <view class="picker">{{ viewModel.selectedBatchLabel }}</view>
      </picker>
    </view>

    <view v-for="product in viewModel.products" :key="product.id" class="card">
      <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
      <text class="name">{{ product.productCode }} {{ product.productName }}</text>
      <text>来源批次：{{ product.createdFromBatchId }}</text>
      <text>状态：{{ product.statusLabel }}</text>
      <button class="primary" @tap="supplement(product.id)">上传主图和详情图</button>
    </view>

    <text v-if="viewModel.products.length === 0" class="empty">{{ viewModel.emptyMessage }}</text>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStaffImageTasksView, supplementStaffProductImages } from '../../../features/staff-image-tasks/staff-image-tasks'

const version = ref(0)
const keyword = ref('')
const selectedBatchId = ref('')
const message = ref('')

onShow(() => {
  version.value += 1
})

const viewModel = computed(() => {
  version.value
  return getStaffImageTasksView({ keyword: keyword.value, selectedBatchId: selectedBatchId.value })
})

const refreshView = () => {
  version.value += 1
}

const selectBatch = (event: Event) => {
  const detail = (event as Event & { detail?: { value?: number } }).detail
  selectedBatchId.value = viewModel.value.batchOptions[Number(detail?.value ?? 0)]?.value ?? ''
}

const supplement = async (productId: string) => {
  const result = await supplementStaffProductImages(productId)
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
  margin-bottom: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.hint,
.empty {
  display: block;
  margin-bottom: 24rpx;
  color: #576071;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.input,
.picker {
  min-height: 72rpx;
  box-sizing: border-box;
  padding: 16rpx;
  background: #ffffff;
  border-radius: 8rpx;
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
  font-weight: 600;
}

.primary {
  color: #ffffff;
  background: #0f62fe;
}
</style>
