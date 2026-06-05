<template>
  <view class="page">
    <view class="orders-header">
      <text class="eyebrow">customer-scoped</text>
      <text class="title">我的订单</text>
      <text class="count">{{ viewModel.totalCountLabel }}</text>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
    </view>

    <view v-else-if="viewModel.loadingState === 'failed' && viewModel.items.length === 0" class="empty-state failure">
      <text class="empty-title">{{ viewModel.failureMessage }}</text>
      <text class="empty-copy">订单暂时无法同步，重试不会影响购物袋、库存或订单状态。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="reload">重试</button>
    </view>

    <view v-else-if="viewModel.items.length === 0" class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">完成商品下单后，当前账号的订单会显示在这里。</text>
    </view>

    <view v-else class="orders-list">
      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步最新订单</text>
      </view>

      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view v-for="order in viewModel.items" :key="order.id" class="order-item">
        <view class="order-top">
          <text class="order-id">{{ order.id }}</text>
          <text class="status">{{ order.statusLabel }}</text>
        </view>
        <text class="product-name">{{ order.primaryProductName }}</text>
        <view class="order-bottom">
          <text>{{ order.itemCountLabel }}</text>
          <text class="amount">{{ order.totalAmountText }}</text>
        </view>
      </view>
    </view>

    <view v-if="message" class="orders-message">
      <text>{{ message }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { createCustomerOrdersPageState } from './useCustomerOrdersPageState'

const ordersState = createCustomerOrdersPageState()
const viewModel = ordersState.viewModel
const message = ordersState.message

onShow(() => {
  void ordersState.handlePageShow()
})

const reload = () => {
  void ordersState.reload()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 64rpx 32rpx;
  background: #f8f8f8;
  color: #222222;
}

.orders-header,
.empty-state,
.order-item,
.inline-status,
.inline-error,
.orders-message {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.orders-header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 42rpx 34rpx;
}

.eyebrow,
.count,
.order-id,
.order-bottom,
.empty-copy {
  color: #777777;
  font-size: 24rpx;
  line-height: 1.35;
}

.title {
  color: #111111;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.25;
}

.feedback,
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 28rpx;
}

.skeleton-card,
.skeleton-row {
  border-radius: 30rpx;
  background: #ffffff;
}

.skeleton-card {
  height: 220rpx;
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

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  min-height: 320rpx;
  margin-top: 28rpx;
  padding: 42rpx 34rpx;
}

.empty-state.failure {
  background: #fff3f1;
}

.empty-title {
  color: #222222;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-action,
.inline-error button {
  align-self: flex-start;
  min-height: 72rpx;
  margin: 0;
  padding: 0 32rpx;
  border: 0;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 72rpx;
}

.empty-action::after,
.inline-error button::after {
  border: 0;
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.inline-status,
.inline-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 82rpx;
  padding: 0 24rpx;
  color: #666666;
  font-size: 26rpx;
}

.inline-error {
  background: #fff3f1;
  color: #9f2b1f;
}

.inline-error button {
  min-height: 58rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  line-height: 58rpx;
}

.order-item {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 30rpx;
}

.order-top,
.order-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.status {
  flex: 0 0 auto;
  color: #555555;
  font-size: 24rpx;
  line-height: 1.3;
}

.product-name {
  color: #111111;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.amount {
  color: #050505;
  font-size: 34rpx;
  font-weight: 700;
}

.orders-message {
  margin-top: 22rpx;
  padding: 20rpx 24rpx;
  color: #666666;
  font-size: 26rpx;
  line-height: 1.4;
}
</style>
