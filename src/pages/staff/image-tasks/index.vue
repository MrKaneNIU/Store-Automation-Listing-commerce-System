<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">IMAGE TASKS</text>
        <text class="title">店员补图</text>
      </view>
      <text class="count">{{ viewModel.products.length }} 件待处理</text>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">STAFF WORKFLOW</text>
        <text class="hero-title">补齐商品主图与详情图</text>
        <text class="hero-desc">店员只处理已创建商品的补图任务，不进入 OCR 草稿确认，也不新增商品编辑或发布能力。</text>
      </view>
      <view class="hero-meter">
        <text class="meter-number">{{ viewModel.batchOptions.length }}</text>
        <text class="meter-label">batches</text>
      </view>
    </view>

    <view class="filters">
      <label class="filter-card">
        <text class="filter-label">货号搜索</text>
        <input class="input" v-model="keyword" placeholder="按商品货号搜索" />
      </label>
      <view class="filter-card">
        <text class="filter-label">批次筛选</text>
        <picker :range="viewModel.batchOptions" range-key="label" @change="selectBatch">
          <view class="picker">{{ viewModel.selectedBatchLabel }}</view>
        </picker>
      </view>
    </view>

    <view v-if="isLoading" class="task-loading">
      <view class="loading-card shimmer">
        <text />
        <text />
        <text />
      </view>
      <view class="loading-card shimmer compact">
        <text />
        <text />
      </view>
    </view>

    <view v-else-if="viewModel.products.length > 0" class="task-list">
      <view v-for="product in viewModel.products" :key="product.id" class="task-card">
        <view class="media">
          <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
          <view v-else class="thumb placeholder">
            <text>待补图</text>
          </view>
        </view>

        <view class="task-body">
          <view class="task-head">
            <view class="task-copy">
              <text class="code">{{ product.productCode }}</text>
              <text class="name">{{ product.productName }}</text>
            </view>
            <text class="status">{{ product.statusLabel }}</text>
          </view>

          <view class="task-meta">
            <text class="meta-item">来源批次：{{ product.createdFromBatchId || '未标记' }}</text>
            <text class="meta-item">补图范围：主图 / 详情图</text>
          </view>

          <button
            class="primary"
            :class="{ busy: supplementingProductId === product.id }"
            :disabled="Boolean(supplementingProductId)"
            hover-class="press-feedback"
            @tap="supplement(product.id)"
          >
            {{ supplementingProductId === product.id ? '上传中...' : '上传主图和详情图' }}
          </button>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">暂无补图任务</text>
      <text class="empty-copy">{{ viewModel.emptyMessage }}</text>
    </view>

    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { StaffImageTasksViewModel } from '../../../features/staff-image-tasks/staff-image-tasks'
import {
  getCloudBaseStaffImageTasksView,
  supplementCloudBaseStaffProductImages,
} from '../../../features/cloudbase-mall/staff-image-tasks'

const keyword = ref('')
const selectedBatchId = ref('')
const message = ref('')
const isLoading = ref(false)
const supplementingProductId = ref('')
let pendingRefresh: Promise<void> | null = null
const viewModel = ref<StaffImageTasksViewModel>({
  batchOptions: [],
  selectedBatchLabel: '全部批次',
  products: [],
  emptyMessage: '暂无待补图商品',
})

type RefreshOptions = {
  showLoading: boolean
}

const refreshView = (options: RefreshOptions = { showLoading: true }) => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  if (options.showLoading) {
    isLoading.value = true
  }

  pendingRefresh = getCloudBaseStaffImageTasksView({
    keyword: keyword.value,
    selectedBatchId: selectedBatchId.value,
  })
    .then((view) => {
      viewModel.value = view
    })
    .finally(() => {
      if (options.showLoading) {
        isLoading.value = false
      }

      pendingRefresh = null
    })

  return pendingRefresh
}

onShow(() => {
  void refreshView()
})

watch([keyword, selectedBatchId], () => {
  void refreshView({ showLoading: false })
})

const selectBatch = (event: Event) => {
  const detail = (event as Event & { detail?: { value?: number } }).detail
  selectedBatchId.value = viewModel.value.batchOptions[Number(detail?.value ?? 0)]?.value ?? ''
}

const supplement = async (productId: string) => {
  if (supplementingProductId.value) {
    return
  }

  supplementingProductId.value = productId

  try {
    const result = await supplementCloudBaseStaffProductImages(productId)
    message.value = result.message
    await refreshView({ showLoading: false })
  } finally {
    supplementingProductId.value = ''
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 32rpx calc(64rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #222222;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 34rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.kicker,
.hero-label {
  color: #9a9a9a;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0;
}

.title {
  display: block;
  color: #222222;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.count {
  flex: 0 0 auto;
  padding: 16rpx 24rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 999rpx;
  background: #ffffff;
  color: #686868;
  font-size: 23rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 34rpx;
  border-radius: 30rpx;
  background: #050505;
  box-shadow: 0 22rpx 48rpx rgba(0, 0, 0, 0.08);
}

.hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14rpx;
  min-width: 0;
}

.hero-title {
  display: block;
  color: #ffffff;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.16;
}

.hero-desc {
  display: block;
  max-width: 480rpx;
  color: rgba(255, 255, 255, 0.66);
  font-size: 25rpx;
  line-height: 1.55;
}

.hero-meter {
  display: flex;
  flex: 0 0 138rpx;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
  min-height: 138rpx;
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.08);
  text-align: center;
}

.meter-number {
  color: #ffffff;
  font-size: 42rpx;
  font-weight: 650;
  line-height: 1.1;
}

.meter-label {
  color: rgba(255, 255, 255, 0.62);
  font-size: 22rpx;
  line-height: 1.2;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-bottom: 32rpx;
}

.filter-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid #eeeeee;
  border-radius: 24rpx;
  background: #ffffff;
}

.filter-label {
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.2;
}

.input,
.picker {
  box-sizing: border-box;
  min-height: 58rpx;
  padding: 0;
  overflow: hidden;
  color: #222222;
  font-size: 28rpx;
  line-height: 58rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.task-loading {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.loading-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  box-sizing: border-box;
  min-height: 190rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.04);
}

.loading-card.compact {
  min-height: 122rpx;
}

.loading-card text {
  display: block;
  height: 22rpx;
  border-radius: 999rpx;
  background: #eeeeee;
}

.loading-card text:first-child {
  width: 44%;
}

.loading-card text:nth-child(2) {
  width: 82%;
}

.loading-card text:nth-child(3) {
  width: 58%;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -45%;
  width: 45%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.62), transparent);
  content: "";
  transform: translateX(0);
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}

.task-card,
.result {
  display: flex;
  gap: 24rpx;
  padding: 26rpx;
  border: 1rpx solid #eeeeee;
  background: #ffffff;
  border-radius: 28rpx;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.04);
}

.media {
  flex: 0 0 188rpx;
  min-width: 0;
}

.thumb {
  width: 188rpx;
  height: 188rpx;
  border-radius: 24rpx;
  background: #f0f0f0;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a9a9a;
  font-size: 24rpx;
}

.task-body {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 18rpx;
}

.task-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.task-copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.code {
  color: #686868;
  font-size: 23rpx;
  font-weight: 600;
  line-height: 1.2;
}

.name {
  display: block;
  overflow: hidden;
  color: #222222;
  font-size: 31rpx;
  font-weight: 600;
  line-height: 1.28;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  flex: 0 0 auto;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(47, 168, 92, 0.12);
  color: #2fa85c;
  font-size: 22rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  display: block;
  overflow: hidden;
  color: #8a8a8a;
  font-size: 24rpx;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary {
  min-height: 76rpx;
  margin: 0;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 76rpx;
  color: #ffffff;
  background: #050505;
  transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease;
}

.primary[disabled] {
  background: #d8d8d8;
  color: #ffffff;
}

.busy {
  opacity: 0.66;
  transform: scale(0.98);
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 44rpx 34rpx;
  border: 1rpx dashed #d8d8d8;
  border-radius: 30rpx;
  background: #ffffff;
}

.empty-title {
  color: #222222;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.2;
}

.empty-copy {
  color: #8a8a8a;
  font-size: 26rpx;
  line-height: 1.5;
}

.result {
  margin-top: 22rpx;
  color: #686868;
  font-size: 26rpx;
  line-height: 1.5;
}

@media (max-width: 390px) {
  .hero,
  .task-card {
    flex-direction: column;
  }

  .hero-meter {
    flex-basis: auto;
    min-height: 110rpx;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .media,
  .thumb {
    width: 100%;
    flex-basis: auto;
  }

  .thumb {
    height: 300rpx;
  }
}
</style>
