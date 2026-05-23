<template>
  <view class="page" :style="{ paddingTop: pageTopPadding }">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">MORE</text>
        <text class="title">更多</text>
      </view>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">ADMIN MODULES</text>
        <text class="hero-title">三个管理入口</text>
        <text class="hero-desc">这里只放三个管理入口：权限管理、首页设置、账号管理，便于快速完成店铺后台配置。</text>
      </view>
    </view>

    <view class="module-list">
      <button class="module-card" :class="{ busy: navigatingRoute === routes.ownerPermissions }" :disabled="Boolean(navigatingRoute)" @tap="goRoute(routes.ownerPermissions)">
        <view class="module-copy">
          <text class="module-label">01</text>
          <text class="module-title">权限管理</text>
          <text class="module-desc">查看与分配管理范围。</text>
        </view>
        <text class="module-arrow">→</text>
      </button>

      <button class="module-card" :class="{ busy: navigatingRoute === routes.ownerHomepageSettings }" :disabled="Boolean(navigatingRoute)" @tap="goRoute(routes.ownerHomepageSettings)">
        <view class="module-copy">
          <text class="module-label">02</text>
          <text class="module-title">首页设置</text>
          <text class="module-desc">调整首页背景、标题、副标题与主按钮文案。</text>
        </view>
        <text class="module-arrow">→</text>
      </button>

      <button class="module-card" :class="{ busy: navigatingRoute === routes.ownerAccountManagement }" :disabled="Boolean(navigatingRoute)" @tap="goRoute(routes.ownerAccountManagement)">
        <view class="module-copy">
          <text class="module-label">03</text>
          <text class="module-title">账号管理</text>
          <text class="module-desc">修改当前管理账号密码，重新登录后生效。</text>
        </view>
        <text class="module-arrow">→</text>
      </button>
    </view>

    <view class="admin-nav">
      <button class="nav-item" :class="{ busy: navigatingRoute === routes.ownerDashboard }" :disabled="navigatingRoute === routes.ownerDashboard" @tap="goRoute(routes.ownerDashboard)">工作台</button>
      <button class="nav-item" :class="{ busy: navigatingRoute === routes.ownerProducts }" :disabled="navigatingRoute === routes.ownerProducts" @tap="goRoute(routes.ownerProducts)">商品管理</button>
      <button class="nav-item" :class="{ busy: navigatingRoute === routes.ownerOrders }" :disabled="navigatingRoute === routes.ownerOrders" @tap="goRoute(routes.ownerOrders)">订单确认</button>
      <button class="nav-item active">更多</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import type { AppRoute } from '../../../app/routes'

const navigatingRoute = ref<AppRoute | ''>('')
const DEFAULT_PAGE_TOP_PADDING = 'calc(env(safe-area-inset-top) + 12rpx)'
const TOP_CONTENT_GAP_RPX = 12

const pageTopPadding = ref(DEFAULT_PAGE_TOP_PADDING)

const ownerTabRoutes = [
  routes.ownerDashboard,
  routes.ownerProducts,
  routes.ownerOrders,
  routes.ownerMore,
] as const

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

onShow(() => {
  if (!ensureAdminWorkbenchSession('more')) {
    return
  }

  navigatingRoute.value = ''
})

const goRoute = (route: AppRoute) => {
  if (navigatingRoute.value === route) {
    return
  }

  navigatingRoute.value = route
  const go = ownerTabRoutes.includes(route as (typeof ownerTabRoutes)[number]) ? redirectTo : navigateTo

  go(route, {
    onComplete: () => {
      navigatingRoute.value = ''
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 12rpx) 32rpx calc(188rpx + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f8f8f8;
  color: #202020;
}

.topbar {
  display: flex;
  align-items: center;
  margin-bottom: 34rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.kicker {
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 500;
}

.title {
  color: #202020;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
}

.hero {
  margin-bottom: 24rpx;
  padding: 34rpx;
  border-radius: 34rpx;
  background: #202020;
  color: #ffffff;
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-label {
  margin-bottom: 18rpx;
  color: #b8b8b8;
  font-size: 20rpx;
  font-weight: 600;
}

.hero-title {
  margin-bottom: 18rpx;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-desc {
  color: #d7d7d7;
  font-size: 24rpx;
  line-height: 1.55;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.module-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  width: 100%;
  min-height: 160rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 28rpx 30rpx;
  border-radius: 30rpx;
  background: #ffffff;
  color: #202020;
  text-align: left;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.module-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.module-label {
  margin-bottom: 10rpx;
  color: #9b9288;
  font-size: 20rpx;
  font-weight: 600;
}

.module-title {
  margin-bottom: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.25;
}

.module-desc {
  color: #747474;
  font-size: 24rpx;
  line-height: 1.45;
}

.module-arrow {
  flex: 0 0 auto;
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 32rpx;
  line-height: 72rpx;
  text-align: center;
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

.nav-item::after {
  border: 0;
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
</style>
