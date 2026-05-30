<template>
  <view class="page">
    <view class="bag-header">
      <view class="bag-nav">
        <button
          class="icon-button plain"
          :class="{ busy: isCatalogNavigating }"
          :disabled="isCatalogNavigating"
          aria-label="返回商品列表"
          hover-class="press-feedback"
          @tap="goCatalog"
        >
          <text class="chevron">‹</text>
        </button>
        <view class="title-cluster">
          <text class="nav-title">购物袋</text>
          <text class="bag-count">{{ viewModel.totalQuantityLabel }}</text>
        </view>
        <button class="icon-button plain" aria-label="重新加载购物袋" hover-class="press-feedback" @tap="reload">
          <text class="refresh-mark" />
        </button>
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="bag-feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
      <view class="skeleton-row narrow shimmer" />
    </view>

    <view v-else-if="viewModel.items.length === 0" class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">从商品详情加入购物袋后，会在这里继续调整规格和数量。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="goCatalog">去逛商品</button>
    </view>

    <view v-else class="bag-list">
      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步最新购物袋</text>
      </view>

      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view v-if="viewModel.unavailableCount > 0" class="inline-error subtle">
        <text>{{ viewModel.unavailableCount }} 件商品暂不可结算</text>
        <button hover-class="press-feedback" @tap="clearUnavailableItems">清理失效</button>
      </view>

      <view
        v-for="item in viewModel.items"
        :key="item.id"
        class="bag-item"
        :class="{ unavailable: item.isUnavailable }"
      >
        <button
          class="select-control"
          :class="{ checked: item.isSelected }"
          :aria-label="item.isSelected ? '取消选择商品' : '选择商品'"
          hover-class="press-feedback"
          @tap="toggleItem(item.id, !item.isSelected)"
        >
          <text />
        </button>

        <view class="item-media">
          <image
            v-if="item.mainImageUrl && !failedImageIds.includes(item.id)"
            class="image"
            :src="item.mainImageUrl"
            mode="aspectFill"
            @error="markImageFailed(item.id)"
          />
          <view v-else class="image-fallback" />
        </view>

        <view class="item-body">
          <view class="item-title-row">
            <text class="item-title">{{ item.productName }}</text>
            <button class="remove-button" aria-label="移除商品" hover-class="press-feedback" @tap="removeBagItem(item.id)">
              <text>×</text>
            </button>
          </view>
          <text class="item-spec">{{ item.skuSpec }}</text>
          <text class="availability" :class="{ danger: item.isUnavailable }">{{ item.availabilityLabel }}</text>

          <view class="item-bottom">
            <view class="price-stack">
              <text class="unit-price">{{ item.unitPriceText }}</text>
              <text class="line-total">{{ item.lineTotalText }}</text>
            </view>
            <view class="quantity-stepper">
              <button
                :disabled="item.quantity <= 1"
                :class="{ disabled: item.quantity <= 1 }"
                aria-label="减少数量"
                hover-class="press-feedback"
                @tap="decreaseQuantity(item.id, item.quantity)"
              >
                <text>-</text>
              </button>
              <text>{{ item.quantityLabel }}</text>
              <button aria-label="增加数量" hover-class="press-feedback" @tap="increaseQuantity(item.id, item.quantity)">
                <text>+</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="message" class="bag-message">
      <text>{{ message }}</text>
    </view>

    <view class="checkout-bar">
      <view class="checkout-summary">
        <text>已选 {{ viewModel.selectedQuantity }} 件</text>
        <text>{{ viewModel.selectedSubtotalText }}</text>
      </view>
      <button
        class="primary-button"
        :class="{ disabledButton: !viewModel.canCheckoutSelectedItems }"
        :disabled="!viewModel.canCheckoutSelectedItems"
        hover-class="press-feedback"
        @tap="submitCheckout"
      >
        <text>去结算</text>
      </button>
    </view>

    <view class="customer-nav">
      <button
        class="tab"
        :class="{ busy: isHomeNavigating }"
        :disabled="isHomeNavigating"
        hover-class="tab-pressed"
        @tap="goHome"
      >
        <text class="tab-icon">⌂</text>
        <text>首页</text>
      </button>
      <button
        class="tab"
        :class="{ busy: isCatalogNavigating }"
        :disabled="isCatalogNavigating"
        hover-class="tab-pressed"
        @tap="goCatalog"
      >
        <text class="tab-icon">●</text>
        <text>商品</text>
      </button>
      <button class="tab active">
        <text class="tab-icon">▢</text>
        <text>购物袋</text>
      </button>
      <button
        class="tab"
        :class="{ busy: isFavoritesNavigating }"
        :disabled="isFavoritesNavigating"
        hover-class="tab-pressed"
        @tap="goFavorites"
      >
        <text class="tab-icon">♡</text>
        <text>收藏</text>
      </button>
      <button class="tab" hover-class="tab-pressed" @tap="showToast(CUSTOMER_MINE_PLACEHOLDER)">
        <text class="tab-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { CUSTOMER_MINE_PLACEHOLDER, customerBottomNavRoutes } from '../customer-bottom-nav'
import { createCustomerShoppingBagPageState } from './useCustomerShoppingBagPageState'

const shoppingBagState = createCustomerShoppingBagPageState()
const viewModel = shoppingBagState.viewModel
const message = shoppingBagState.message
const failedImageIds = ref<string[]>([])
const isHomeNavigating = ref(false)
const isCatalogNavigating = ref(false)
const isFavoritesNavigating = ref(false)
let navigationFallbackTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigationLocks = () => {
  isHomeNavigating.value = false
  isCatalogNavigating.value = false
  isFavoritesNavigating.value = false

  if (navigationFallbackTimer) {
    clearTimeout(navigationFallbackTimer)
    navigationFallbackTimer = null
  }
}

const scheduleNavigationFallback = () => {
  navigationFallbackTimer = setTimeout(clearNavigationLocks, 900)
}

onShow(() => {
  clearNavigationLocks()
  void shoppingBagState.handlePageShow()
})

const reload = () => {
  void shoppingBagState.loadSnapshot({ showLoading: true })
}

const increaseQuantity = (itemId: string, quantity: number) => {
  void shoppingBagState.updateQuantity(itemId, quantity + 1)
}

const decreaseQuantity = (itemId: string, quantity: number) => {
  if (quantity <= 1) {
    return
  }

  void shoppingBagState.updateQuantity(itemId, quantity - 1)
}

const toggleItem = (itemId: string, isSelected: boolean) => {
  void shoppingBagState.selectItem(itemId, isSelected)
}

const removeBagItem = (itemId: string) => {
  void shoppingBagState.removeItem(itemId)
}

const clearUnavailableItems = () => {
  void shoppingBagState.clearUnavailable()
}

const submitCheckout = () => {
  const result = shoppingBagState.submitSelectedItems()

  if (result.status === 'blocked') {
    return
  }

  const firstItem = result.checkoutItems[0]
  if (!firstItem) {
    return
  }

  navigateTo(`${routes.customerProductDetail}?id=${firstItem.productId}`)
}

const markImageFailed = (itemId: string) => {
  if (failedImageIds.value.includes(itemId)) {
    return
  }

  failedImageIds.value = [...failedImageIds.value, itemId]
}

const goCatalog = () => {
  if (isCatalogNavigating.value) {
    return
  }

  isCatalogNavigating.value = true
  scheduleNavigationFallback()
  redirectTo(customerBottomNavRoutes.catalog, {
    onComplete: clearNavigationLocks,
  })
}

const goHome = () => {
  if (isHomeNavigating.value) {
    return
  }

  isHomeNavigating.value = true
  scheduleNavigationFallback()
  redirectTo(customerBottomNavRoutes.home, {
    onComplete: clearNavigationLocks,
  })
}

const goFavorites = () => {
  if (isFavoritesNavigating.value) {
    return
  }

  isFavoritesNavigating.value = true
  scheduleNavigationFallback()
  redirectTo(customerBottomNavRoutes.favorites, {
    onComplete: clearNavigationLocks,
  })
}

const showToast = (title: string) => {
  uni.showToast({
    title,
    icon: 'none',
    duration: 1600,
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: calc(330rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f8f8f8;
  color: #222222;
}

.bag-header {
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
}

.bag-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 92rpx;
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

.bag-count {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.2;
}

.icon-button,
.select-control,
.remove-button,
.quantity-stepper button,
.empty-action,
.inline-error button,
.primary-button,
.tab {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.select-control::after,
.remove-button::after,
.quantity-stepper button::after,
.empty-action::after,
.inline-error button::after,
.primary-button::after,
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

.refresh-mark {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  border: 3rpx solid #050505;
  border-left-color: transparent;
  border-radius: 999rpx;
}

.refresh-mark::after {
  position: absolute;
  top: 0;
  right: -4rpx;
  width: 12rpx;
  height: 12rpx;
  border-top: 3rpx solid #050505;
  border-right: 3rpx solid #050505;
  content: "";
  transform: rotate(18deg);
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.busy,
.disabled,
.disabledButton {
  opacity: 0.58;
}

.bag-feedback {
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

.bag-list {
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

.bag-item {
  display: grid;
  grid-template-columns: 60rpx 168rpx minmax(0, 1fr);
  gap: 20rpx;
  box-sizing: border-box;
  padding: 24rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.bag-item.unavailable {
  opacity: 0.72;
}

.select-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #f4f4f4;
  box-shadow: inset 0 0 0 2rpx #d8d8d8;
}

.select-control text {
  display: block;
  width: 22rpx;
  height: 12rpx;
  border-bottom: 4rpx solid transparent;
  border-left: 4rpx solid transparent;
  transform: rotate(-45deg) translateY(-2rpx);
}

.select-control.checked {
  background: #050505;
  box-shadow: none;
}

.select-control.checked text {
  border-bottom-color: #ffffff;
  border-left-color: #ffffff;
}

.item-media {
  width: 168rpx;
  height: 208rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #eeeeee;
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

.item-body {
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.item-title {
  flex: 1 1 auto;
  min-width: 0;
  color: #222222;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.remove-button {
  display: flex;
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

.item-spec,
.availability {
  display: block;
  margin-top: 8rpx;
  color: #9a9a9a;
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
  margin-top: 22rpx;
}

.price-stack {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.unit-price {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.2;
}

.line-total {
  color: #050505;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.1;
}

.quantity-stepper {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10rpx;
  min-height: 64rpx;
  padding: 6rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
}

.quantity-stepper button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  font-size: 30rpx;
  line-height: 1;
}

.quantity-stepper > text {
  min-width: 48rpx;
  color: #222222;
  font-size: 26rpx;
  line-height: 1;
  text-align: center;
}

.bag-message {
  box-sizing: border-box;
  margin: 22rpx 32rpx 0;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #666666;
  font-size: 26rpx;
  line-height: 1.4;
}

.checkout-bar {
  position: fixed;
  right: 0;
  bottom: calc(152rpx + env(safe-area-inset-bottom));
  left: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  gap: 22rpx;
  box-sizing: border-box;
  padding: 18rpx 32rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 -10rpx 28rpx rgba(0, 0, 0, 0.05);
}

.checkout-summary {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6rpx;
}

.checkout-summary text:first-child {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.2;
}

.checkout-summary text:last-child {
  color: #050505;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.1;
}

.primary-button {
  flex: 0 0 auto;
  min-width: 220rpx;
  min-height: 92rpx;
  padding: 0 42rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 92rpx;
}

.disabledButton {
  background: #9a9a9a;
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
  .bag-item {
    grid-template-columns: 54rpx 150rpx minmax(0, 1fr);
    gap: 16rpx;
  }

  .item-media {
    width: 150rpx;
    height: 192rpx;
  }

  .item-bottom {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
