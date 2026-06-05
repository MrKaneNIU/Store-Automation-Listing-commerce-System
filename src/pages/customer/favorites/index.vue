<template>
  <view class="page">
    <view class="favorites-header" :style="{ paddingTop: headerTopPadding }">
      <view class="favorites-nav">
        <button
          class="icon-button plain"
          :class="{ busy: navigatingRoute === customerBottomNavRoutes.catalog }"
          :disabled="Boolean(navigatingRoute)"
          aria-label="返回商品目录"
          hover-class="press-feedback"
          @tap="goCatalog"
        >
          <text class="chevron">‹</text>
        </button>
        <view class="title-cluster">
          <text class="nav-title">我的收藏</text>
          <text class="favorites-count">{{ viewModel.totalCount }} 件已保存</text>
        </view>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="favorites-feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-card short shimmer" />
      <view class="skeleton-row shimmer" />
    </view>

    <view v-else-if="viewModel.loadingState === 'failed' && viewModel.items.length === 0" class="empty-state failure">
      <text class="empty-title">{{ viewModel.failureMessage }}</text>
      <text class="empty-copy">收藏列表暂时无法同步，重试不会影响购物袋、库存或订单。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="reload">重试</button>
    </view>

    <view v-else-if="viewModel.items.length === 0" class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">从商品详情保存喜欢的单品后，会在这里快速回到商品。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="goCatalog">去逛商品</button>
    </view>

    <view v-else class="favorites-list">
      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步最新收藏</text>
      </view>

      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view v-if="viewModel.unavailableCount > 0" class="inline-error subtle">
        <text>{{ viewModel.unavailableCount }} 件收藏暂不可购买</text>
      </view>

      <view
        v-for="item in viewModel.items"
        :key="item.favoriteId"
        class="favorite-item"
        :class="{ unavailable: item.isUnavailable, removing: removingProductIds.includes(item.productId) }"
      >
        <button
          class="item-media"
          :aria-label="item.canOpenDetail ? '打开商品详情' : item.availabilityLabel"
          hover-class="press-feedback"
          @tap="openDetail(item)"
        >
          <image
            v-if="item.mainImageUrl && !failedImageIds.includes(item.productId)"
            class="image"
            :src="item.mainImageUrl"
            mode="aspectFill"
            @error="markImageFailed(item.productId)"
          />
          <view v-else class="image-fallback" />
          <text v-if="item.isUnavailable" class="availability-badge">{{ item.availabilityLabel }}</text>
        </button>

        <view class="item-body">
          <view class="item-title-row">
            <view class="item-title-stack">
              <text class="product-code">{{ item.productCode }}</text>
              <text class="item-title">{{ item.productName }}</text>
            </view>
            <button
              class="remove-button"
              :disabled="removingProductIds.includes(item.productId)"
              aria-label="移除收藏"
              hover-class="press-feedback"
              @tap="removeFavorite(item.productId)"
            >
              <text>×</text>
            </button>
          </view>

          <text class="availability" :class="{ danger: item.isUnavailable }">{{ item.availabilityLabel }}</text>

          <view class="item-bottom">
            <text class="price">{{ item.priceText }}</text>
            <button
              class="detail-link"
              :disabled="!item.canOpenDetail"
              :class="{ disabled: !item.canOpenDetail }"
              hover-class="press-feedback"
              @tap="openDetail(item)"
            >
              {{ item.canOpenDetail ? '查看详情' : '暂不可打开' }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="message" class="favorites-message">
      <text>{{ message }}</text>
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
        <text class="tab-icon">●</text>
        <text>商品</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.shoppingBag }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goShoppingBag"
      >
        <text class="tab-icon">■</text>
        <text>购物袋</text>
      </button>
      <button class="tab active" :disabled="Boolean(navigatingRoute)">
        <text class="tab-icon">♡</text>
        <text>收藏</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.mine }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goMine"
      >
        <text class="tab-icon">●</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../../app/navigation'
import { routes, type AppRoute } from '../../../app/routes'
import { type CustomerFavoriteProductViewItem } from '../../../features/customer-favorites/customer-favorites'
import { customerBottomNavRoutes, shouldIgnoreCustomerBottomNavTap } from '../customer-bottom-nav'
import { createCustomerFavoritesPageState } from './useCustomerFavoritesPageState'

const favoritesState = createCustomerFavoritesPageState()
const viewModel = favoritesState.viewModel
const removingProductIds = favoritesState.removingProductIds
const message = favoritesState.message
const failedImageIds = ref<string[]>([])
const navigatingRoute = ref<AppRoute | ''>('')
const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
let navigationFallbackTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigationLocks = () => {
  navigatingRoute.value = ''

  if (navigationFallbackTimer) {
    clearTimeout(navigationFallbackTimer)
    navigationFallbackTimer = null
  }
}

const scheduleNavigationFallback = () => {
  navigationFallbackTimer = setTimeout(clearNavigationLocks, 900)
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

onShow(() => {
  clearNavigationLocks()
  void favoritesState.loadSnapshot({ showLoading: viewModel.value.items.length === 0, source: 'onShow' })
})

const reload = () => {
  void favoritesState.reload()
}

const removeFavorite = (productId: string) => {
  void favoritesState.removeFavorite(productId)
}

const openDetail = (item: CustomerFavoriteProductViewItem) => {
  if (!item.canOpenDetail) {
    message.value = item.availabilityLabel
    return
  }

  navigateTo(`${routes.customerProductDetail}?id=${item.productId}`)
}

const markImageFailed = (productId: string) => {
  if (failedImageIds.value.includes(productId)) {
    return
  }

  failedImageIds.value = [...failedImageIds.value, productId]
}

const goHome = () => {
  goCustomerBottomNav(customerBottomNavRoutes.home)
}

const goCustomerBottomNav = (targetRoute: AppRoute) => {
  if (
    shouldIgnoreCustomerBottomNavTap({
      pendingRoute: navigatingRoute.value,
      targetRoute,
      currentRoute: customerBottomNavRoutes.favorites,
    })
  ) {
    return
  }

  navigatingRoute.value = targetRoute
  scheduleNavigationFallback()
  redirectTo(targetRoute, {
    onComplete: clearNavigationLocks,
  })
}

const goCatalog = () => {
  goCustomerBottomNav(customerBottomNavRoutes.catalog)
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

.favorites-header {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
  background: #f8f8f8;
}

.favorites-nav {
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
  min-width: 0;
  flex: 1 1 auto;
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

.favorites-count {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.2;
}

.icon-button,
.item-media,
.remove-button,
.detail-link,
.empty-action,
.inline-error button,
.tab {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.item-media::after,
.remove-button::after,
.detail-link::after,
.empty-action::after,
.inline-error button::after,
.tab::after {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  min-width: 76rpx;
  height: 76rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.chevron {
  display: block;
  font-size: 44rpx;
  font-weight: 300;
  line-height: 1;
  transform: translateY(-1rpx);
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.busy,
.disabled,
.removing {
  opacity: 0.58;
}

.favorites-feedback {
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
  height: 236rpx;
}

.skeleton-card.short {
  height: 168rpx;
}

.skeleton-row {
  width: 62%;
  height: 34rpx;
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

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  box-sizing: border-box;
  min-height: 420rpx;
  margin: 42rpx 32rpx 0;
  padding: 48rpx 40rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(5, 5, 5, 0.05);
}

.empty-state.failure {
  background: #fff3f1;
}

.empty-title {
  color: #222222;
  font-size: 36rpx;
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
  margin-top: 12rpx;
  padding: 0 34rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 28rpx;
  line-height: 76rpx;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin: 38rpx 32rpx 0;
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

.inline-error.subtle {
  background: #f4f4f4;
  color: #666666;
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

.favorite-item {
  display: grid;
  grid-template-columns: 190rpx minmax(0, 1fr);
  gap: 22rpx;
  box-sizing: border-box;
  padding: 24rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.favorite-item.unavailable {
  opacity: 0.78;
}

.item-media {
  position: relative;
  display: block;
  width: 190rpx;
  height: 238rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #eeeeee;
  padding: 0;
}

.image,
.image-fallback {
  width: 100%;
  height: 100%;
}

.image-fallback {
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.9) 0 14%, transparent 14.5%),
    linear-gradient(112deg, transparent 0 35%, rgba(5, 5, 5, 0.82) 35.5% 52%, transparent 52.5%),
    linear-gradient(145deg, #dddddd, #ffffff 48%, #b8b8b8);
}

.availability-badge {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  left: 12rpx;
  min-height: 44rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #9f2b1f;
  font-size: 22rpx;
  line-height: 44rpx;
  text-align: center;
}

.item-body {
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.item-title-stack {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.product-code {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title {
  color: #222222;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.28;
  overflow-wrap: anywhere;
}

.remove-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  min-width: 56rpx;
  height: 56rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #666666;
}

.remove-button text {
  font-size: 34rpx;
  line-height: 1;
}

.availability {
  display: block;
  margin-top: 14rpx;
  color: #666666;
  font-size: 25rpx;
  line-height: 1.35;
}

.availability.danger {
  color: #9f2b1f;
}

.item-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 28rpx;
}

.price {
  color: #050505;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.detail-link {
  flex: 0 0 auto;
  min-height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 64rpx;
}

.detail-link.disabled {
  background: #9a9a9a;
}

.favorites-message {
  box-sizing: border-box;
  margin: 22rpx 32rpx 0;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #666666;
  font-size: 26rpx;
  line-height: 1.4;
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

.tab-pressed {
  opacity: 0.7;
  transform: scale(0.96);
}

.tab-icon {
  font-size: 30rpx;
  line-height: 1;
}

.tab.active {
  color: #050505;
}

@media (max-width: 390px) {
  .favorite-item {
    grid-template-columns: 168rpx minmax(0, 1fr);
    gap: 18rpx;
  }

  .item-media {
    width: 168rpx;
    height: 218rpx;
  }

  .item-bottom {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
