<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">ORDER ATELIER</text>
        <text class="title">订单确认</text>
      </view>
      <button
        class="shop-link"
        :class="{ busy: navigatingRoute === routes.customerProductList }"
        :disabled="Boolean(navigatingRoute)"
        @tap="goShop"
      >
        商城
      </button>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">MERCHANT REVIEW</text>
        <text class="hero-title">{{ pendingOrderCount }} 单待确认</text>
        <text class="hero-desc">确认与取消动作继续走现有订单 facade，库存扣减和审计规则保持不变。</text>
      </view>
      <view class="hero-meter">
        <text class="meter-number">{{ viewModel.orders.length }}</text>
        <text class="meter-label">orders</text>
      </view>
    </view>

    <view v-if="viewModel.orders.length > 0" class="order-list">
      <view v-for="order in viewModel.orders" :key="order.id" class="order-card">
        <view class="order-head">
          <view class="customer">
            <text class="order-id">ORDER {{ order.id }}</text>
            <text class="name">{{ order.customerName }}</text>
            <text class="phone">{{ order.customerPhone }}</text>
          </view>
          <text class="status">{{ order.statusLabel }}</text>
        </view>

        <view class="items-panel">
          <view v-for="item in order.items" :key="item.skuId" class="item">
            <view class="item-copy">
              <text class="item-name">{{ item.productName }}</text>
              <text class="item-spec">{{ item.spec }} · {{ item.productCode }}</text>
            </view>
            <view class="item-meta">
              <text class="item-quantity">x {{ item.quantity }}</text>
              <text class="item-price">¥{{ item.salePrice }}</text>
            </view>
          </view>
        </view>

        <view class="order-foot">
          <view class="amount-block">
            <text class="amount-label">合计</text>
            <text class="amount">¥{{ order.totalAmount }}</text>
          </view>
          <view v-if="order.canConfirm || order.canCancel" class="actions">
            <button
              v-if="order.canCancel"
              class="secondary"
              :class="{ busy: processingOrderId === order.id && processingOrderAction === 'cancel' }"
              :disabled="Boolean(processingOrderId)"
              hover-class="press-feedback"
              @tap="cancel(order.id)"
            >
              {{ processingOrderId === order.id && processingOrderAction === 'cancel' ? '取消中...' : '取消订单' }}
            </button>
            <button
              v-if="order.canConfirm"
              class="primary"
              :class="{ busy: processingOrderId === order.id && processingOrderAction === 'confirm' }"
              :disabled="Boolean(processingOrderId)"
              hover-class="press-feedback"
              @tap="confirm(order.id)"
            >
              {{ processingOrderId === order.id && processingOrderAction === 'confirm' ? '确认中...' : '确认订单' }}
            </button>
          </view>
          <text v-else class="settled-mark">已处理</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">客户下单后会在这里进入商家确认流程。</text>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view class="admin-nav">
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerDashboard }"
        :disabled="Boolean(navigatingRoute)"
        @tap="goAdminTab(routes.ownerDashboard)"
      >
        工作台
      </button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerProducts }"
        :disabled="Boolean(navigatingRoute)"
        @tap="goAdminTab(routes.ownerProducts)"
      >
        商品管理
      </button>
      <button class="nav-item active" @tap="stayOrders">订单确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo, relaunchTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { routes } from '../../../app/routes'
import type { OwnerOrdersViewModel } from '../../../features/owner-orders/owner-orders'
import {
  cancelCloudBaseOwnerOrder,
  confirmCloudBaseOwnerOrder,
  getCloudBaseOwnerOrdersView,
} from '../../../features/cloudbase-mall/owner-orders'

const message = ref('')
const navigatingRoute = ref<AppRoute | ''>('')
const processingOrderId = ref('')
const processingOrderAction = ref<'confirm' | 'cancel' | ''>('')
const viewModel = ref<OwnerOrdersViewModel>({
  orders: [],
  emptyMessage: '暂无订单',
})

const pendingOrderCount = computed(() => viewModel.value.orders.filter((order) => order.canConfirm).length)

const stayOrders = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 180 })
}

const goAdminTab = (route: AppRoute) => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = route
  redirectTo(route)
}

const goShop = () => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = routes.customerProductList
  relaunchTo(routes.customerProductList)
}

const refreshView = async () => {
  viewModel.value = await getCloudBaseOwnerOrdersView()
}

onShow(() => {
  void refreshView()
})

const confirm = async (orderId: string) => {
  if (processingOrderId.value) {
    return
  }

  processingOrderId.value = orderId
  processingOrderAction.value = 'confirm'

  try {
    const result = await confirmCloudBaseOwnerOrder(orderId)
    message.value = result.message
    await refreshView()
  } finally {
    processingOrderId.value = ''
    processingOrderAction.value = ''
  }
}

const cancel = async (orderId: string) => {
  if (processingOrderId.value) {
    return
  }

  processingOrderId.value = orderId
  processingOrderAction.value = 'cancel'

  try {
    const result = await cancelCloudBaseOwnerOrder(orderId)
    message.value = result.message
    await refreshView()
  } finally {
    processingOrderId.value = ''
    processingOrderAction.value = ''
  }
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
  transition: opacity 120ms ease, transform 120ms ease;
}

.shop-link::after,
.primary::after,
.secondary::after,
.nav-item::after {
  border: 0;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168rpx;
  gap: 24rpx;
  box-sizing: border-box;
  margin-bottom: 26rpx;
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.order-card,
.empty-state,
.result {
  box-sizing: border-box;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 28rpx;
}

.order-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.customer {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.order-id {
  margin-bottom: 10rpx;
  overflow: hidden;
  color: #9a9a9a;
  font-size: 20rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  overflow: hidden;
  color: #202020;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone {
  margin-top: 8rpx;
  color: #707070;
  font-size: 24rpx;
  line-height: 1.35;
}

.status {
  flex: 0 0 auto;
  max-width: 170rpx;
  box-sizing: border-box;
  padding: 12rpx 18rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #202020;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.items-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24rpx;
  background: #f7f7f7;
}

.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 122rpx;
  gap: 18rpx;
  padding: 22rpx 24rpx;
}

.item + .item {
  border-top: 1rpx solid #ececec;
}

.item-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  display: -webkit-box;
  overflow: hidden;
  color: #202020;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-spec {
  margin-top: 8rpx;
  overflow: hidden;
  color: #8e8e8e;
  font-size: 22rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 0;
}

.item-quantity {
  color: #8e8e8e;
  font-size: 22rpx;
  line-height: 1.2;
}

.item-price {
  color: #202020;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.2;
}

.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
}

.amount-block {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.amount-label {
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.2;
}

.amount {
  color: #202020;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 1.15;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 14rpx;
  flex: 1;
  min-width: 0;
}

.primary,
.secondary {
  flex: 0 0 auto;
  min-width: 132rpx;
  min-height: 62rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 62rpx;
  transition: opacity 120ms ease, transform 120ms ease;
}

.primary {
  color: #ffffff;
  background: #202020;
}

.secondary {
  color: #707070;
  background: #f4f4f4;
}

.settled-mark {
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
  transition: opacity 120ms ease, transform 120ms ease;
}

.nav-item.active {
  background: #202020;
  color: #ffffff;
}

.busy {
  opacity: 0.66;
  transform: scale(0.98);
}

.press-feedback {
  opacity: 0.72;
  transform: scale(0.98);
}
</style>
