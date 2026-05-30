<template>
  <view class="page">
    <view class="mine-header">
      <text class="eyebrow">CUSTOMER</text>
      <text class="title">我的</text>
      <text class="copy">客户中心暂未开放</text>
    </view>

    <view class="entry-list" aria-label="客户入口">
      <button class="entry primary" :disabled="Boolean(navigatingRoute)" hover-class="press-feedback" @tap="goHome">
        <text>返回首页</text>
      </button>
      <button class="entry" :disabled="Boolean(navigatingRoute)" hover-class="press-feedback" @tap="goCatalog">
        <text>继续逛商品</text>
      </button>
      <button class="entry" :disabled="Boolean(navigatingRoute)" hover-class="press-feedback" @tap="goFavorites">
        <text>查看收藏</text>
      </button>
      <button class="entry" :disabled="Boolean(navigatingRoute)" hover-class="press-feedback" @tap="goShoppingBag">
        <text>查看购物袋</text>
      </button>
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
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { customerBottomNavRoutes, shouldIgnoreCustomerBottomNavTap } from '../customer-bottom-nav'

const navigatingRoute = ref<AppRoute | ''>('')
let navigationFallbackTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigationLock = () => {
  navigatingRoute.value = ''

  if (navigationFallbackTimer) {
    clearTimeout(navigationFallbackTimer)
    navigationFallbackTimer = null
  }
}

onShow(clearNavigationLock)

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
  navigationFallbackTimer = setTimeout(clearNavigationLock, 900)
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
  padding: calc(env(safe-area-inset-top) + 64rpx) 32rpx calc(190rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f8f8f8;
  color: #222222;
}

.mine-header {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 36rpx 0 48rpx;
}

.eyebrow {
  color: #777777;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 0;
}

.title {
  color: #111111;
  font-size: 56rpx;
  font-weight: 800;
  letter-spacing: 0;
}

.copy {
  color: #555555;
  font-size: 28rpx;
  line-height: 1.6;
}

.entry-list {
  display: grid;
  gap: 18rpx;
}

.entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  border: 1rpx solid #e6e6e6;
  border-radius: 8rpx;
  background: #ffffff;
  color: #222222;
  font-size: 28rpx;
  font-weight: 700;
  text-align: left;
}

.entry.primary {
  border-color: #222222;
  background: #222222;
  color: #ffffff;
}

.entry[disabled] {
  opacity: 0.55;
}

.customer-nav {
  position: fixed;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  left: 24rpx;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4rpx;
  padding: 14rpx 10rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18rpx 50rpx rgba(0, 0, 0, 0.12);
}

.tab {
  display: flex;
  min-width: 0;
  min-height: 76rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border-radius: 8rpx;
  color: #777777;
  font-size: 20rpx;
}

.tab.active {
  background: #222222;
  color: #ffffff;
}

.tab.busy {
  opacity: 0.65;
}

.tab-icon {
  font-size: 28rpx;
  line-height: 1;
}
</style>
