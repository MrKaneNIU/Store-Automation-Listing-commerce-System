<template>
  <view class="page">
    <view class="mine-header" :style="{ paddingTop: headerTopPadding }">
      <view class="mine-nav">
        <view class="nav-spacer" />
        <view class="title-cluster">
          <text class="nav-title">我的</text>
        </view>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="mine-feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
      <view class="skeleton-row narrow shimmer" />
    </view>

    <view v-else class="mine-content">
      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="retry">重试</button>
      </view>

      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步我的数据</text>
      </view>

      <view class="identity-panel">
        <view class="identity-avatar" aria-label="客户头像">
          <image v-if="viewModel.hasAvatar" class="identity-avatar-image" :src="viewModel.avatarUrl" mode="aspectFill" />
          <text v-else class="identity-avatar-placeholder">{{ viewModel.avatarPlaceholderText }}</text>
        </view>
        <view class="identity-copy">
          <text class="identity-name">{{ viewModel.identityDisplayName }}</text>
          <text v-if="viewModel.customerId" class="identity-meta">客户ID {{ viewModel.customerId }}</text>
        </view>
        <view class="phone-pill">
          <text>{{ viewModel.phoneLabel }}</text>
          <text>{{ viewModel.phoneDisplayText }}</text>
        </view>
      </view>

      <view class="utility-grid" aria-label="我的功能">
        <button
          v-for="entry in visibleUtilities"
          :key="entry.key"
          class="utility-entry"
          :disabled="!entry.isEnabled || Boolean(navigatingRoute)"
          hover-class="press-feedback"
          @tap="navigateUtility(entry.route)"
        >
          <text class="utility-label">{{ entry.label }}</text>
        </button>
      </view>

      <view class="section-heading">
        <text>近期订单</text>
        <text>共 {{ viewModel.recentOrderTotalCount }} 笔</text>
      </view>

      <view v-if="viewModel.recentOrders.length === 0" class="empty-state">
        <text class="empty-title">{{ viewModel.recentOrdersEmptyMessage }}</text>
        <text class="empty-copy">当前账号下单后，订单摘要会显示在这里。</text>
        <button class="empty-action" hover-class="press-feedback" @tap="goCatalog">去逛商品</button>
      </view>

      <view v-else class="order-list">
        <view v-for="order in viewModel.recentOrders" :key="order.orderId" class="order-card">
          <view class="order-topline">
            <text class="order-name">{{ order.primaryProductName }}</text>
            <text class="order-status">{{ order.statusLabel }}</text>
          </view>
          <view class="order-meta">
            <text>{{ order.itemCountLabel }}</text>
            <text>{{ order.totalAmountText }}</text>
          </view>
          <text class="order-time">{{ order.createdAt }}</text>
        </view>
      </view>
    </view>

    <view class="customer-nav">
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.home }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goHome"
      >
        <text class="tab-icon">⌂</text>
        <text>首页</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.catalog }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goCatalog"
      >
        <text class="tab-icon">◇</text>
        <text>商品</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.shoppingBag }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goShoppingBag"
      >
        <text class="tab-icon">▢</text>
        <text>购物袋</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.favorites }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goFavorites"
      >
        <text class="tab-icon">♡</text>
        <text>收藏</text>
      </button>
      <button class="tab active" :disabled="Boolean(navigatingRoute)" hover-class="tab-pressed" @tap="goMine">
        <text class="tab-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { customerBottomNavRoutes, shouldIgnoreCustomerBottomNavTap } from '../customer-bottom-nav'
import { useCustomerMinePageState } from './useCustomerMinePageState'

const mineState = useCustomerMinePageState()
const viewModel = mineState.viewModel
const visibleUtilities = computed(() =>
  viewModel.value.utilities.filter((entry) => entry.key !== 'favorites' && entry.key !== 'shoppingBag'),
)
const navigatingRoute = ref<AppRoute | ''>('')
const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
let navigationFallbackTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigationLock = () => {
  navigatingRoute.value = ''

  if (navigationFallbackTimer) {
    clearTimeout(navigationFallbackTimer)
    navigationFallbackTimer = null
  }
}

const scheduleNavigationFallback = () => {
  navigationFallbackTimer = setTimeout(clearNavigationLock, 900)
}

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

const loadMineSnapshot = () => {
  void mineState.loadSnapshot({ showLoading: viewModel.value.customerId === '' })
}

const retry = () => {
  void mineState.retry()
}

onShow(() => {
  clearNavigationLock()
  loadMineSnapshot()
})

const goCustomerBottomNav = (targetRoute: AppRoute) => {
  if (
    shouldIgnoreCustomerBottomNavTap({
      pendingRoute: navigatingRoute.value,
      targetRoute,
      currentRoute: customerBottomNavRoutes.mine,
    })
  ) {
    return
  }

  navigatingRoute.value = targetRoute
  scheduleNavigationFallback()
  redirectTo(targetRoute, {
    onComplete: clearNavigationLock,
  })
}

const navigateUtility = (route: string) => {
  const targetRoute = route as AppRoute
  navigatingRoute.value = targetRoute
  scheduleNavigationFallback()
  redirectTo(targetRoute, {
    onComplete: clearNavigationLock,
  })
}

const goHome = () => {
  goCustomerBottomNav(customerBottomNavRoutes.home)
}

const goCatalog = () => {
  goCustomerBottomNav(customerBottomNavRoutes.catalog)
}

const goFavorites = () => {
  goCustomerBottomNav(customerBottomNavRoutes.favorites)
}

const goShoppingBag = () => {
  goCustomerBottomNav(customerBottomNavRoutes.shoppingBag)
}

const goMine = () => {
  goCustomerBottomNav(customerBottomNavRoutes.mine)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(190rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f8f8f8;
  color: #222222;
}

.mine-header {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
  background: #f8f8f8;
}

.mine-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 92rpx;
}

.nav-spacer {
  width: 76rpx;
  min-width: 76rpx;
  height: 76rpx;
}

.title-cluster {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.nav-title {
  color: #222222;
  font-size: 42rpx;
  font-weight: 600;
  line-height: 1.15;
}

.utility-entry,
.empty-action,
.inline-error button,
.tab {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.utility-entry::after,
.empty-action::after,
.inline-error button::after,
.tab::after {
  border: 0;
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.busy {
  opacity: 0.58;
}

.mine-feedback,
.mine-content {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin: 38rpx 32rpx 0;
}

.skeleton-card,
.skeleton-row {
  border-radius: 32rpx;
  background: #ffffff;
}

.skeleton-card {
  height: 280rpx;
}

.skeleton-row {
  height: 34rpx;
}

.skeleton-row.narrow {
  width: 62%;
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
  transform: translateX(0);
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}

.inline-status,
.inline-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 82rpx;
  box-sizing: border-box;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #666666;
  font-size: 26rpx;
}

.inline-error {
  background: #fff3f1;
  color: #9f2b1f;
}

.inline-error button {
  flex: 0 0 auto;
  min-height: 58rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 58rpx;
}

.identity-panel,
.empty-state,
.order-card {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.identity-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 22rpx 26rpx;
  padding: 34rpx;
}

.identity-avatar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 118rpx;
  height: 118rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ece8dd;
  color: #4b4336;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1;
}

.identity-avatar-image {
  width: 100%;
  height: 100%;
}

.identity-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  gap: 10rpx;
  padding-top: 10rpx;
}

.identity-meta,
.phone-pill text:first-child,
.section-heading text:last-child,
.order-meta,
.order-time {
  color: #777777;
  font-size: 24rpx;
  line-height: 1.35;
}

.identity-name {
  color: #111111;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.22;
  overflow-wrap: anywhere;
}

.phone-pill {
  display: flex;
  flex: 0 0 100%;
  box-sizing: border-box;
  flex-direction: column;
  gap: 6rpx;
  padding: 16rpx 20rpx;
  border-radius: 24rpx;
  background: #f4f4f4;
  text-align: left;
}

.phone-pill text:last-child {
  color: #222222;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.utility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.utility-entry {
  display: flex;
  min-height: 156rpx;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10rpx;
  padding: 0 28rpx;
  border-radius: 30rpx;
  background: #ffffff;
  color: #222222;
  text-align: left;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.utility-entry[disabled] {
  opacity: 0.56;
}

.utility-label {
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 8rpx;
}

.section-heading text:first-child {
  color: #111111;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  min-height: 320rpx;
  padding: 44rpx 36rpx;
}

.empty-title {
  color: #222222;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-copy {
  color: #666666;
  font-size: 28rpx;
  line-height: 1.5;
}

.empty-action {
  align-self: flex-start;
  min-height: 76rpx;
  margin-top: 10rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 28rpx;
  line-height: 76rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 28rpx;
}

.order-topline,
.order-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.order-name {
  min-width: 0;
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.order-status {
  flex: 0 0 auto;
  max-width: 240rpx;
  color: #050505;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.35;
  text-align: right;
  overflow-wrap: anywhere;
}

.customer-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  display: flex;
  justify-content: space-around;
  box-sizing: border-box;
  min-height: 152rpx;
  padding: 18rpx 18rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top-left-radius: 38rpx;
  border-top-right-radius: 38rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -12rpx 32rpx rgba(0, 0, 0, 0.06);
}

.tab {
  display: flex;
  min-width: 0;
  min-height: 104rpx;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0;
  border-radius: 28rpx;
  background: transparent;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.2;
}

.tab.active {
  color: #050505;
}

.tab-pressed {
  opacity: 0.7;
  transform: scale(0.96);
}

.tab-icon {
  font-size: 30rpx;
  line-height: 1;
}

@media (max-width: 390px) {
  .phone-pill {
    padding-right: 18rpx;
    padding-left: 18rpx;
  }
}
</style>
