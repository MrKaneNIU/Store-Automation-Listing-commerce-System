<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">MERCHANDISE ROOM</text>
        <text class="title">商品管理</text>
      </view>
      <button class="shop-link" @tap="relaunchTo(routes.customerProductList)">商城</button>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">PUBLISH QUEUE</text>
        <text class="hero-title">{{ viewModel.readyProductCount }} 件待上架</text>
        <text class="hero-desc">状态筛选、单品上架和批量上架均沿用现有商品发布链路。</text>
      </view>
      <view class="hero-meter">
        <text class="meter-number">{{ viewModel.products.length }}</text>
        <text class="meter-label">{{ selectedStatusLabel }}</text>
      </view>
    </view>

    <view class="filter-panel">
      <view class="filter-head">
        <text class="section-title">状态筛选</text>
        <text class="section-meta">{{ viewModel.products.length }} 件</text>
      </view>
      <view class="tabs">
        <button
          v-for="option in viewModel.statusOptions"
          :key="option.value"
          class="filter-pill"
          :class="{ 'filter-pill-active': selectedStatus === option.value }"
          @tap="selectedStatus = option.value"
        >
          {{ option.label }}
        </button>
      </view>
    </view>

    <view class="publish-strip">
      <view class="publish-copy">
        <text class="publish-title">批量上架可上架商品</text>
        <text class="publish-meta">当前可上架 {{ viewModel.readyProductCount }} 件</text>
      </view>
      <button
        class="primary"
        :disabled="!viewModel.canBatchPublish"
        @tap="publishReadyProducts"
      >
        批量上架
      </button>
    </view>

    <view v-if="viewModel.products.length > 0" class="product-list">
      <view v-for="product in viewModel.products" :key="product.id" class="product-card">
        <view class="image-shell">
          <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
          <view v-else class="image-placeholder">
            <text class="placeholder-text">NO IMAGE</text>
          </view>
          <text class="status-badge">{{ product.statusLabel }}</text>
        </view>

        <view class="product-copy">
          <text class="code">货号 {{ product.productCode }}</text>
          <text class="name">{{ product.productName }}</text>
          <view class="product-foot">
            <text class="sku-count">SKU {{ product.skuCount }} 个</text>
            <button v-if="product.canPublish" class="publish-button" @tap="publish(product.id)">上架</button>
            <text v-else class="published-mark">已处理</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">切换状态筛选后，可继续查看其它商品队列。</text>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view class="admin-nav">
      <button class="nav-item" @tap="redirectTo(routes.ownerDashboard)">工作台</button>
      <button class="nav-item active" @tap="stayProducts">商品管理</button>
      <button class="nav-item" @tap="redirectTo(routes.ownerOrders)">订单确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo, relaunchTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
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

const selectedStatusLabel = computed(() => {
  return viewModel.value.statusOptions.find((option) => option.value === selectedStatus.value)?.label ?? '全部'
})

const stayProducts = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 180 })
}

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
  box-sizing: border-box;
  padding: 32rpx 32rpx calc(188rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
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

.kicker {
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.2;
}

.title {
  color: #202020;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.shop-link {
  flex: 0 0 auto;
  min-width: 112rpx;
  min-height: 60rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
  box-shadow: 0 12rpx 30rpx rgba(12, 12, 12, 0.06);
}

.shop-link::after,
.filter-pill::after,
.primary::after,
.publish-button::after,
.nav-item::after {
  border: 0;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168rpx;
  gap: 24rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
  padding: 34rpx;
  border-radius: 34rpx;
  background: #202020;
  color: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(10, 10, 10, 0.12);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-label {
  margin-bottom: 18rpx;
  color: #b8b8b8;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-title {
  margin-bottom: 18rpx;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-desc {
  max-width: 430rpx;
  color: #d7d7d7;
  font-size: 24rpx;
  line-height: 1.55;
}

.hero-meter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 0;
}

.meter-number {
  font-size: 60rpx;
  font-weight: 600;
  line-height: 1;
}

.meter-label {
  color: #b8b8b8;
  font-size: 20rpx;
  line-height: 1.2;
  text-align: right;
}

.filter-panel,
.publish-strip,
.empty-state,
.result {
  box-sizing: border-box;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.filter-panel {
  margin-bottom: 20rpx;
  padding: 28rpx;
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.section-title {
  color: #202020;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
}

.section-meta {
  flex: 0 0 auto;
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.3;
}

.tabs {
  display: flex;
  gap: 14rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-pill {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 60rpx;
  margin: 0;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #707070;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
}

.filter-pill-active {
  background: #202020;
  color: #ffffff;
}

.publish-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 26rpx;
  padding: 28rpx 28rpx 28rpx 32rpx;
}

.publish-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.publish-title {
  overflow: hidden;
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publish-meta {
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.35;
}

.primary {
  flex: 0 0 auto;
  min-width: 144rpx;
  min-height: 68rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 68rpx;
}

.primary[disabled] {
  background: #e8e8e8;
  color: #9a9a9a;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.product-card {
  display: grid;
  grid-template-columns: 188rpx minmax(0, 1fr);
  gap: 24rpx;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.image-shell {
  position: relative;
  width: 188rpx;
  height: 236rpx;
  overflow: hidden;
  border-radius: 26rpx;
  background: #f0f0f0;
}

.thumb {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 22rpx 12rpx;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.26), rgba(5, 5, 5, 0.08)),
    #f0f0f0;
}

.placeholder-text {
  color: #9a9a9a;
  font-size: 18rpx;
  font-weight: 500;
  line-height: 1;
}

.status-badge {
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  max-width: 132rpx;
  box-sizing: border-box;
  padding: 9rpx 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #202020;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8rpx 8rpx 8rpx 0;
}

.code {
  margin-bottom: 12rpx;
  overflow: hidden;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  display: -webkit-box;
  min-height: 84rpx;
  overflow: hidden;
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: auto;
}

.sku-count {
  min-width: 0;
  color: #707070;
  font-size: 24rpx;
  line-height: 1.35;
}

.publish-button {
  flex: 0 0 auto;
  min-width: 104rpx;
  min-height: 60rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
}

.published-mark {
  flex: 0 0 auto;
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.35;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-height: 360rpx;
  padding: 48rpx 40rpx;
}

.empty-title {
  color: #202020;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-copy {
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.5;
}

.result {
  display: block;
  margin-top: 22rpx;
  padding: 24rpx 28rpx;
  color: #202020;
  font-size: 26rpx;
  line-height: 1.45;
}

.admin-nav {
  position: fixed;
  right: 24rpx;
  bottom: calc(20rpx + env(safe-area-inset-bottom));
  left: 24rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  box-sizing: border-box;
  min-height: 124rpx;
  padding: 12rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 22rpx 52rpx rgba(12, 12, 12, 0.12);
}

.nav-item {
  min-width: 0;
  min-height: 92rpx;
  margin: 0;
  padding: 0 10rpx;
  border-radius: 30rpx;
  background: transparent;
  color: #7a7a7a;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 92rpx;
  text-align: center;
}

.nav-item.active {
  background: #202020;
  color: #ffffff;
}
</style>
