<template>
  <view class="page" :style="{ paddingTop: pageTopPadding }">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">ORDER ATELIER</text>
        <text class="title">订单确认</text>
      </view>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">MERCHANT REVIEW</text>
        <text class="hero-title">{{ pendingOrderCount }} 单待确认</text>
        <text class="hero-desc">确认与取消动作继续走现有订单 facade，库存扣减和审计规则保持不变。</text>
      </view>
      <button
        class="reminder-button"
        :class="{ busy: isUpdatingReminder }"
        :disabled="isUpdatingReminder || !notificationConfig.isConfigured || notificationConfig.subscribed"
        hover-class="press-feedback"
        @tap="enableOrderReminders"
      >
        {{ reminderButtonLabel }}
      </button>
    </view>

    <view v-if="viewModel.orders.length > 0" class="order-filters">
      <button
        class="filter-pill"
        :class="{ active: selectedOrderFilter === 'pending' }"
        hover-class="press-feedback"
        @tap="filterOrders('pending')"
      >
        待处理 <text>{{ pendingOrderCount }}</text>
      </button>
      <button
        class="filter-pill"
        :class="{ active: selectedOrderFilter === 'settled' }"
        hover-class="press-feedback"
        @tap="filterOrders('settled')"
      >
        已处理 <text>{{ settledOrderCount }}</text>
      </button>
      <button
        class="filter-pill"
        :class="{ active: selectedOrderFilter === 'all' }"
        hover-class="press-feedback"
        @tap="filterOrders('all')"
      >
        全部 <text>{{ viewModel.orders.length }}</text>
      </button>
    </view>

    <view v-if="viewModel.orders.length > 0 && filteredOrders.length > 0" class="order-list">
      <view
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="{ expanded: selectedOrderId === order.id }"
        hover-class="order-card-pressed"
        hover-stay-time="90"
        @tap="toggleOrderDetail(order.id)"
      >
        <view class="order-head">
          <view class="customer">
            <text class="order-id">ORDER {{ order.id }}</text>
            <text class="name">{{ order.customerName }}</text>
            <text class="phone">{{ order.customerPhone }}</text>
          </view>
          <view class="status-stack">
            <text class="status">{{ order.statusLabel }}</text>
            <button class="detail-toggle" hover-class="press-feedback" @tap.stop="toggleOrderDetail(order.id)">
              {{ selectedOrderId === order.id ? '收起详情' : '查看详情' }}
            </button>
          </view>
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
              @tap.stop="cancel(order.id)"
            >
              {{ processingOrderId === order.id && processingOrderAction === 'cancel' ? '取消中...' : '取消订单' }}
            </button>
            <button
              v-if="order.canConfirm"
              class="primary"
              :class="{ busy: processingOrderId === order.id && processingOrderAction === 'confirm' }"
              :disabled="Boolean(processingOrderId)"
              hover-class="press-feedback"
              @tap.stop="confirm(order.id)"
            >
              {{ processingOrderId === order.id && processingOrderAction === 'confirm' ? '确认中...' : '确认订单' }}
            </button>
          </view>
          <text v-else class="settled-mark">已处理</text>
        </view>

        <view v-if="selectedOrderId === order.id" class="order-detail-panel" @tap.stop>
          <view class="detail-grid">
            <view class="detail-cell">
              <text class="detail-label">订单编号</text>
              <text class="detail-value">{{ order.id }}</text>
            </view>
            <view class="detail-cell">
              <text class="detail-label">订单状态</text>
              <text class="detail-value">{{ order.statusLabel }}</text>
            </view>
            <view class="detail-cell">
              <text class="detail-label">下单时间</text>
              <text class="detail-value">{{ order.createdAt }}</text>
            </view>
            <view class="detail-cell">
              <text class="detail-label">更新时间</text>
              <text class="detail-value">{{ order.updatedAt }}</text>
            </view>
            <view class="detail-cell">
              <text class="detail-label">客户标识</text>
              <text class="detail-value">{{ order.customerId || '未绑定' }}</text>
            </view>
            <view class="detail-cell">
              <text class="detail-label">认证来源</text>
              <text class="detail-value">{{ order.customerAuthSource || '未记录' }}</text>
            </view>
          </view>

          <view class="detail-items">
            <text class="detail-section-title">商品明细</text>
            <view v-for="item in order.items" :key="`detail-${item.skuId}`" class="detail-item">
              <view class="detail-item-main">
                <text class="detail-item-name">{{ item.productName }}</text>
                <text class="detail-item-spec">{{ item.spec }} · {{ item.productCode }}</text>
              </view>
              <view class="detail-item-meta">
                <text>SKU {{ item.skuId }}</text>
                <text>x {{ item.quantity }} / ¥{{ item.salePrice }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">{{ displayedEmptyMessage }}</text>
      <text class="empty-copy">{{ displayedEmptyCopy }}</text>
      <button
        v-if="viewModel.orders.length > 0 && filteredOrders.length === 0"
        class="empty-action"
        hover-class="press-feedback"
        @tap="filterOrders('all')"
      >
        查看全部订单
      </button>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view class="admin-nav">
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerDashboard }"
        :disabled="navigatingRoute === routes.ownerDashboard"
        @tap="goAdminTab(routes.ownerDashboard)"
      >
        工作台
      </button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerProducts }"
        :disabled="navigatingRoute === routes.ownerProducts"
        @tap="goAdminTab(routes.ownerProducts)"
      >
        商品管理
      </button>
      <button class="nav-item active" @tap="stayOrders">订单确认</button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerMore }"
        :disabled="navigatingRoute === routes.ownerMore"
        @tap="goAdminTab(routes.ownerMore)"
      >
        更多
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import type { OwnerOrdersViewModel } from '../../../features/owner-orders/owner-orders'
import {
  cancelCloudBaseOwnerOrder,
  confirmCloudBaseOwnerOrder,
  getCloudBaseManagerOrderNotificationConfig,
  getCloudBaseOwnerOrdersView,
  subscribeCloudBaseManagerOrderNotifications,
} from '../../../features/cloudbase-mall/owner-orders'
import type { ManagerOrderNotificationConfig } from '../../../services/cloudbase/mall-api-client'

const message = ref('')
const DEFAULT_PAGE_TOP_PADDING = 'calc(env(safe-area-inset-top) + 12rpx)'
const TOP_CONTENT_GAP_RPX = 12

const pageTopPadding = ref(DEFAULT_PAGE_TOP_PADDING)
const navigatingRoute = ref<AppRoute | ''>('')
const processingOrderId = ref('')
const processingOrderAction = ref<'confirm' | 'cancel' | ''>('')
const isLoadingOrders = ref(false)
const isUpdatingReminder = ref(false)
const loadError = ref('')
const viewModel = ref<OwnerOrdersViewModel>({
  orders: [],
  emptyMessage: '暂无订单',
})
const notificationConfig = ref<ManagerOrderNotificationConfig>({
  isConfigured: false,
  templateId: '',
  subscribed: false,
})
let pendingRefresh: Promise<void> | null = null

type OrderFilter = 'pending' | 'settled' | 'all'
type OwnerOrderViewItem = OwnerOrdersViewModel['orders'][number]

const selectedOrderFilter = ref<OrderFilter>('pending')
const selectedOrderId = ref('')
const isPendingOrder = (order: OwnerOrderViewItem) => order.canConfirm || order.canCancel
const pendingOrderCount = computed(() => viewModel.value.orders.filter(isPendingOrder).length)
const settledOrderCount = computed(() => viewModel.value.orders.filter((order) => !isPendingOrder(order)).length)
const filteredOrders = computed(() => {
  if (selectedOrderFilter.value === 'pending') {
    return viewModel.value.orders.filter(isPendingOrder)
  }

  if (selectedOrderFilter.value === 'settled') {
    return viewModel.value.orders.filter((order) => !isPendingOrder(order))
  }

  return viewModel.value.orders
})
const displayedEmptyMessage = computed(() => {
  if (viewModel.value.orders.length === 0) {
    return viewModel.value.emptyMessage
  }

  if (selectedOrderFilter.value === 'pending') {
    return '暂无待处理订单'
  }

  if (selectedOrderFilter.value === 'settled') {
    return '暂无已处理订单'
  }

  return viewModel.value.emptyMessage
})
const displayedEmptyCopy = computed(() => {
  if (viewModel.value.orders.length === 0) {
    return '客户下单后会在这里进入商家确认流程。'
  }

  if (selectedOrderFilter.value === 'pending') {
    return '已确认或已取消的订单保留在已处理和全部视图，避免误认为还能继续处理。'
  }

  return '切回待处理可继续确认或取消仍在商家确认阶段的订单。'
})
const reminderButtonLabel = computed(() => {
  if (!notificationConfig.value.isConfigured) return '提醒未配置'
  if (notificationConfig.value.subscribed) return '提醒已开启'
  return isUpdatingReminder.value ? '开启中...' : '开启提醒'
})

type SubscribeMessageResult = Record<string, string | undefined> & {
  errMsg?: string
}

type SubscribeRequester = {
  requestSubscribeMessage?: (options: {
    tmplIds: string[]
    success?: (result: SubscribeMessageResult) => void
    fail?: (error: { errMsg?: string }) => void
  }) => void
}

const stayOrders = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 180 })
}

const syncPageTopPadding = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    const rpxToPx = systemInfo.windowWidth / 750
    const statusBarHeight = systemInfo.statusBarHeight

    if (typeof statusBarHeight === 'number' && Number.isFinite(statusBarHeight) && statusBarHeight > 0) {
      pageTopPadding.value = `${Math.ceil(statusBarHeight + TOP_CONTENT_GAP_RPX * rpxToPx)}px`
    }
  } catch {
    pageTopPadding.value = DEFAULT_PAGE_TOP_PADDING
  }
}

onMounted(syncPageTopPadding)

const goAdminTab = (route: AppRoute) => {
  if (navigatingRoute.value === route) {
    return
  }

  navigatingRoute.value = route
  redirectTo(route, {
    onComplete: () => {
      navigatingRoute.value = ''
    },
  })
}

const filterOrders = (filter: OrderFilter) => {
  selectedOrderFilter.value = filter
  selectedOrderId.value = ''
}

const toggleOrderDetail = (orderId: string) => {
  selectedOrderId.value = selectedOrderId.value === orderId ? '' : orderId
}

const getErrorMessage = (error: unknown) => (error instanceof Error && error.message.trim()
  ? error.message.trim()
  : '订单列表加载失败')

const refreshView = () => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  isLoadingOrders.value = true
  loadError.value = ''
  pendingRefresh = getCloudBaseOwnerOrdersView()
    .then((nextView) => {
      viewModel.value = nextView
      if (selectedOrderId.value && !nextView.orders.some((order) => order.id === selectedOrderId.value)) {
        selectedOrderId.value = ''
      }
    })
    .catch((error) => {
      loadError.value = getErrorMessage(error)
      message.value = loadError.value
    })
    .finally(() => {
      isLoadingOrders.value = false
      pendingRefresh = null
    })

  return pendingRefresh
}

const refreshNotificationConfig = async () => {
  notificationConfig.value = await getCloudBaseManagerOrderNotificationConfig()
}

const requestOrderReminderPermission = (templateId: string) => new Promise<boolean>((resolve) => {
  const requester = uni as unknown as SubscribeRequester
  if (!requester.requestSubscribeMessage) {
    resolve(false)
    return
  }

  requester.requestSubscribeMessage({
    tmplIds: [templateId],
    success: (result) => {
      resolve(result[templateId] === 'accept')
    },
    fail: () => {
      resolve(false)
    },
  })
})

onShow(() => {
  navigatingRoute.value = ''

  if (!ensureAdminWorkbenchSession('orderConfirmation')) {
    return
  }

  void refreshView()
  void refreshNotificationConfig().catch((error) => {
    message.value = getErrorMessage(error)
  })
})

const enableOrderReminders = async () => {
  if (isUpdatingReminder.value || !notificationConfig.value.isConfigured || notificationConfig.value.subscribed) {
    return
  }

  isUpdatingReminder.value = true
  try {
    const accepted = await requestOrderReminderPermission(notificationConfig.value.templateId)
    if (!accepted) {
      message.value = '未获得订阅授权'
      return
    }

    const result = await subscribeCloudBaseManagerOrderNotifications(notificationConfig.value.templateId)
    notificationConfig.value = result.notificationConfig
    message.value = result.message
  } finally {
    isUpdatingReminder.value = false
  }
}

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
  padding: calc(env(safe-area-inset-top) + 12rpx) 32rpx calc(188rpx + env(safe-area-inset-bottom));
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

.primary::after,
.secondary::after,
.filter-pill::after,
.detail-toggle::after,
.empty-action::after,
.reminder-button::after,
.nav-item::after {
  border: 0;
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
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

.reminder-button {
  flex: 0 0 auto;
  min-width: 156rpx;
  min-height: 62rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 62rpx;
  white-space: nowrap;
  transition: opacity 120ms ease, transform 120ms ease;
}

.reminder-button[disabled] {
  color: #9a9a9a;
  background: #eeeeee;
}

.order-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 22rpx;
  padding: 10rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 36rpx rgba(12, 12, 12, 0.05);
}

.filter-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 0;
  min-height: 64rpx;
  margin: 0;
  padding: 0 12rpx;
  border-radius: 22rpx;
  background: transparent;
  color: #707070;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.2;
  transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease, color 120ms ease;
}

.filter-pill text {
  color: inherit;
  font-size: 22rpx;
  font-variant-numeric: tabular-nums;
}

.filter-pill.active {
  background: #202020;
  color: #ffffff;
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
  transition: box-shadow 140ms ease, transform 140ms ease;
}

.order-card.expanded {
  box-shadow: 0 24rpx 58rpx rgba(12, 12, 12, 0.08);
}

.order-card-pressed {
  transform: scale(0.992);
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

.status-stack {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
  max-width: 190rpx;
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

.detail-toggle {
  min-width: 132rpx;
  min-height: 54rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #202020;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 54rpx;
  white-space: nowrap;
  transition: opacity 120ms ease, transform 120ms ease;
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

.order-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 26rpx;
  border-radius: 26rpx;
  background: #f7f7f7;
  box-shadow: inset 0 0 0 1rpx #ececec;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.detail-label,
.detail-section-title,
.detail-item-meta {
  color: #8e8e8e;
  font-size: 22rpx;
  line-height: 1.3;
}

.detail-value {
  overflow: hidden;
  color: #202020;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.detail-section-title {
  font-weight: 600;
}

.detail-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 178rpx;
  gap: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e8e8e8;
}

.detail-item-main,
.detail-item-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.detail-item-name {
  overflow: hidden;
  color: #202020;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-item-spec {
  overflow: hidden;
  color: #8e8e8e;
  font-size: 22rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-item-meta {
  align-items: flex-end;
  text-align: right;
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

.empty-action {
  align-self: flex-start;
  min-width: 176rpx;
  min-height: 64rpx;
  margin: 8rpx 0 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 64rpx;
  transition: opacity 120ms ease, transform 120ms ease;
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
  z-index: 8;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  box-sizing: border-box;
  min-height: 124rpx;
  padding: 12rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22rpx 52rpx rgba(12, 12, 12, 0.12);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 92rpx;
  min-height: 92rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 0 10rpx;
  border-radius: 30rpx;
  background: transparent;
  color: #7a7a7a;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  transition: opacity 120ms ease, transform 120ms ease;
}

.nav-item.active {
  background: #202020;
  color: #ffffff;
}

.admin-nav .busy {
  transform: none;
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
