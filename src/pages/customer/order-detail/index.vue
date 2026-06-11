<template>
  <view class="page">
    <view class="detail-header" :style="{ paddingTop: headerTopPadding }">
      <view class="detail-nav">
        <button class="icon-button plain" aria-label="返回订单列表" hover-class="press-feedback" @tap="goOrders">
          <text class="chevron">‹</text>
        </button>
        <text class="nav-title">订单详情</text>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
    </view>

    <view v-else-if="viewModel.loadingState === 'failed' && !viewModel.order" class="empty-state failure">
      <text class="empty-title">{{ viewModel.failureMessage }}</text>
      <text class="empty-copy">订单详情暂时无法加载，重试不会改变订单状态。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="reload">重试</button>
    </view>

    <view v-else-if="viewModel.order" class="detail-content">
      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步订单详情</text>
      </view>

      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view class="summary-card">
        <view class="summary-row">
          <text class="order-id">ORDER {{ viewModel.order.id }}</text>
          <text class="status">{{ viewModel.order.statusLabel }}</text>
        </view>
        <text class="primary-product">{{ viewModel.order.primaryProductName }}</text>
        <view class="amount-row">
          <text>{{ viewModel.order.itemCountLabel }}</text>
          <text class="amount">{{ viewModel.order.totalAmountText }}</text>
        </view>
      </view>

      <view class="info-card">
        <text class="section-title">收货地址</text>
        <template v-if="viewModel.order.hasShippingAddress">
          <text class="shipping-contact">{{ viewModel.order.shippingContactLine }}</text>
          <text class="shipping-address">{{ viewModel.order.shippingAddressLine }}</text>
        </template>
        <text v-else class="shipping-address">未记录收货地址</text>
      </view>

      <view class="info-card">
        <text class="section-title">订单信息</text>
        <view class="info-row">
          <text>创建时间</text>
          <text>{{ viewModel.order.createdAtLabel }}</text>
        </view>
        <view class="info-row">
          <text>更新时间</text>
          <text>{{ viewModel.order.updatedAtLabel }}</text>
        </view>
      </view>

      <view class="items-card">
        <text class="section-title">商品明细</text>
        <view v-for="item in viewModel.order.detailItems" :key="item.skuId" class="item-row">
          <view class="item-main">
            <text class="item-name">{{ item.productName }}</text>
            <text class="item-spec">{{ item.spec }} · {{ item.productCode }}</text>
          </view>
          <view class="item-meta">
            <text>{{ item.quantityLabel }}</text>
            <text>{{ item.lineTotalText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { createCustomerOrderDetailPageState } from './useCustomerOrderDetailPageState'

type OrderDetailPageQuery = {
  orderId?: string
}

const detailState = createCustomerOrderDetailPageState()
const viewModel = detailState.viewModel
const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)

const syncHeaderTopPadding = () => {
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect?.()
    const windowInfo = uni.getWindowInfo()
    const rpxToPx = windowInfo.windowWidth / 750

    if (menuButton && Number.isFinite(menuButton.top) && menuButton.top > 0) {
      headerTopPadding.value = `${Math.ceil(menuButton.top + HEADER_TOP_OFFSET_RPX * rpxToPx)}px`

      return
    }

    const statusBarHeight = windowInfo.statusBarHeight

    if (typeof statusBarHeight === 'number' && Number.isFinite(statusBarHeight) && statusBarHeight > 0) {
      headerTopPadding.value = `${Math.ceil(statusBarHeight + STATUS_BAR_FALLBACK_GAP_RPX * rpxToPx)}px`
    }
  } catch {
    headerTopPadding.value = DEFAULT_HEADER_TOP_PADDING
  }
}

onMounted(syncHeaderTopPadding)

onLoad((query: OrderDetailPageQuery = {}) => {
  const orderId = query?.orderId ?? ''

  void detailState.loadOrder(orderId, { showLoading: true })
})

const reload = () => {
  void detailState.reload()
}

const goOrders = () => {
  redirectTo(routes.customerOrders)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 64rpx;
  overflow-x: hidden;
  background: #f8f8f8;
  color: #222222;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 3;
  margin: 0 -32rpx;
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
  background: #f8f8f8;
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 92rpx;
}

.nav-spacer,
.icon-button {
  width: 76rpx;
  min-width: 76rpx;
  height: 76rpx;
}

.nav-title {
  color: #111111;
  font-size: 34rpx;
  font-weight: 700;
}

.icon-button,
.empty-action,
.inline-error button {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.empty-action::after,
.inline-error button::after {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.chevron {
  font-size: 44rpx;
  font-weight: 300;
  line-height: 1;
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.feedback,
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 28rpx;
}

.summary-card,
.info-card,
.items-card,
.empty-state,
.inline-status,
.inline-error,
.skeleton-card,
.skeleton-row {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.summary-card,
.info-card,
.items-card,
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 30rpx;
}

.empty-state.failure,
.inline-error {
  background: #fff3f1;
}

.summary-row,
.amount-row,
.info-row,
.item-row,
.inline-status,
.inline-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.order-id,
.amount-row,
.info-row,
.item-spec,
.item-meta,
.empty-copy,
.shipping-address {
  color: #666666;
  font-size: 25rpx;
  line-height: 1.45;
}

.status {
  flex: 0 0 auto;
  color: #555555;
  font-size: 24rpx;
}

.primary-product,
.empty-title {
  color: #111111;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.3;
}

.amount {
  color: #050505;
  font-size: 38rpx;
  font-weight: 800;
}

.section-title,
.shipping-contact,
.item-name {
  color: #111111;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.35;
}

.item-main,
.item-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.item-meta {
  align-items: flex-end;
  flex: 0 0 auto;
}

.inline-status,
.inline-error {
  min-height: 82rpx;
  padding: 0 24rpx;
  color: #666666;
  font-size: 26rpx;
}

.inline-error {
  color: #9f2b1f;
}

.empty-action,
.inline-error button {
  align-self: flex-start;
  min-height: 72rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 72rpx;
}

.inline-error button {
  min-height: 58rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  line-height: 58rpx;
}

.skeleton-card {
  height: 260rpx;
}

.skeleton-row {
  height: 36rpx;
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  content: "";
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}
</style>
