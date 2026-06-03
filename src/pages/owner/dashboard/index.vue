<template>
  <view class="page" :style="{ paddingTop: pageTopPadding }">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">Oh My Fish</text>
        <view class="title-row">
          <text class="title">管理工作台</text>
          <button
            class="shop-link"
            :class="{ busy: isShopNavigating }"
            :disabled="isShopNavigating"
            @tap="goShop"
          >
            商城
          </button>
        </view>
      </view>
    </view>

    <view class="flow-section">
      <view class="hero">
        <view class="hero-copy">
          <text class="hero-label">BUSINESS FLOW</text>
          <text class="hero-title">业务流进度</text>
          <text class="hero-desc">从截图识别到草稿确认，再到店员补图，保持每天上新链路清晰推进。</text>
        </view>
        <view class="hero-mark">
          <text class="hero-number">03</text>
          <text class="hero-caption">active paths</text>
        </view>
      </view>

      <view class="progress-panel">
        <view class="progress-item">
          <text class="progress-step">01</text>
          <view class="progress-copy">
            <text class="progress-title">截图识别</text>
            <text class="progress-meta">可上传 {{ remainingUploadCount }} 张</text>
          </view>
        </view>
        <view class="progress-line" />
        <view class="progress-item">
          <text class="progress-step">02</text>
          <view class="progress-copy">
            <text class="progress-title">草稿确认</text>
            <text class="progress-meta">待确认 {{ pendingDraftCount }} 条</text>
          </view>
        </view>
        <view class="progress-line" />
        <view class="progress-item">
          <text class="progress-step">03</text>
          <view class="progress-copy">
            <text class="progress-title">店员补图</text>
            <text class="progress-meta">待补图 {{ pendingImageTaskCount }} 件</text>
          </view>
        </view>
      </view>

      <view class="entry-list">
        <button
          class="entry-card primary-card"
          :class="{ busy: navigatingRoute === routes.ownerImportUpload }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goEntry(routes.ownerImportUpload)"
        >
          <view class="entry-copy">
            <text class="entry-label">UPLOAD</text>
            <text class="entry-title">截图识别</text>
            <text class="entry-desc">批量上传商品截图，进入识别流程。</text>
          </view>
          <text class="entry-arrow">→</text>
        </button>

        <button
          class="entry-card"
          :class="{ busy: navigatingRoute === routes.ownerDraftReview }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goEntry(routes.ownerDraftReview)"
        >
          <view class="entry-copy">
            <text class="entry-label">REVIEW</text>
            <text class="entry-title">草稿确认</text>
            <text class="entry-desc">检查识别草稿，确认后进入商品流转。</text>
          </view>
          <text class="entry-arrow">→</text>
        </button>

        <button
          class="entry-card"
          :class="{ busy: navigatingRoute === routes.staffImageTasks }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goEntry(routes.staffImageTasks)"
        >
          <view class="entry-copy">
            <text class="entry-label">IMAGE TASKS</text>
            <text class="entry-title">店员补图</text>
            <text class="entry-desc">处理待补图商品，补齐发布前素材。</text>
          </view>
          <text class="entry-arrow">→</text>
        </button>
      </view>
    </view>

    <view class="admin-nav">
      <button class="nav-item active" @tap="stayDashboard">工作台</button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerProducts }"
        :disabled="navigatingRoute === routes.ownerProducts"
        @tap="goAdminTab(routes.ownerProducts)"
      >
        商品管理
      </button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerOrders }"
        :disabled="navigatingRoute === routes.ownerOrders"
        @tap="goAdminTab(routes.ownerOrders)"
      >
        订单确认
      </button>
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
import { onHide, onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo, relaunchTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSessionFromServer } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import {
  createEmptyOwnerDashboardView,
  getCloudBaseOwnerDashboardView,
} from '../../../features/cloudbase-mall/owner-dashboard'

const DEFAULT_PAGE_TOP_PADDING = 'calc(env(safe-area-inset-top) + 12rpx)'
const TOP_CONTENT_GAP_RPX = 12

const pageTopPadding = ref(DEFAULT_PAGE_TOP_PADDING)
const navigatingRoute = ref<AppRoute | ''>('')
const isShopNavigating = ref(false)
const isLoadingDashboard = ref(false)
const loadError = ref('')
const viewModel = ref(createEmptyOwnerDashboardView())
let pendingRefresh: Promise<void> | null = null

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

onShow(async () => {
  if (!(await ensureAdminWorkbenchSessionFromServer('workbenchAccess'))) {
    return
  }

  navigatingRoute.value = ''
  isShopNavigating.value = false
  void refreshView()
})

onHide(() => {
  navigatingRoute.value = ''
  isShopNavigating.value = false
})

const getErrorMessage = (error: unknown) => (error instanceof Error && error.message.trim()
  ? error.message.trim()
  : '工作台数据加载失败')

const refreshView = () => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  isLoadingDashboard.value = true
  loadError.value = ''
  pendingRefresh = getCloudBaseOwnerDashboardView()
    .then((nextView) => {
      viewModel.value = nextView
    })
    .catch((error) => {
      loadError.value = getErrorMessage(error)
    })
    .finally(() => {
      isLoadingDashboard.value = false
      pendingRefresh = null
    })

  return pendingRefresh
}

const remainingUploadCount = computed(() => viewModel.value.remainingUploadCount)
const pendingDraftCount = computed(() => viewModel.value.pendingDraftCount)
const pendingImageTaskCount = computed(() => viewModel.value.pendingImageTaskCount)

const stayDashboard = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 180 })
}

const goEntry = (route: AppRoute) => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = route
  navigateTo(route, {
    onFail: () => {
      navigatingRoute.value = ''
    },
    onComplete: () => {
      navigatingRoute.value = ''
    },
  })
}

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

const goShop = () => {
  if (isShopNavigating.value) {
    return
  }

  isShopNavigating.value = true
  relaunchTo(routes.customerProductList, {
    onComplete: () => {
      isShopNavigating.value = false
    },
  })
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
  align-items: center;
  margin-bottom: 34rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
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
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.shop-link {
  flex: 0 0 auto;
  min-width: 100rpx;
  min-height: 56rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 56rpx;
  box-shadow: 0 12rpx 30rpx rgba(12, 12, 12, 0.06);
  transition: opacity 120ms ease, transform 120ms ease;
}

.shop-link::after,
.entry-card::after,
.nav-item::after {
  border: 0;
}

.flow-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 176rpx;
  gap: 24rpx;
  box-sizing: border-box;
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

.hero-mark {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 0;
}

.hero-number {
  font-size: 60rpx;
  font-weight: 600;
  line-height: 1;
}

.hero-caption {
  color: #b8b8b8;
  font-size: 20rpx;
  line-height: 1.2;
  text-align: right;
}

.progress-panel {
  box-sizing: border-box;
  padding: 30rpx 32rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.progress-step {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: #f1f1f1;
  color: #202020;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.progress-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-width: 0;
  flex: 1;
}

.progress-title {
  overflow: hidden;
  color: #202020;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-meta {
  flex: 0 0 auto;
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.35;
  text-align: right;
}

.progress-line {
  width: 2rpx;
  height: 28rpx;
  margin: 8rpx 0 8rpx 28rpx;
  background: #e8e8e8;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  width: 100%;
  min-height: 168rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 30rpx 30rpx 30rpx 34rpx;
  border-radius: 30rpx;
  background: #ffffff;
  color: #202020;
  text-align: left;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
  transition: opacity 120ms ease, transform 120ms ease;
}

.primary-card {
  background: #fffdf9;
}

.entry-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-label {
  margin-bottom: 10rpx;
  color: #9b9288;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1.2;
}

.entry-title {
  margin-bottom: 12rpx;
  color: #202020;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.25;
}

.entry-desc {
  color: #747474;
  font-size: 24rpx;
  line-height: 1.45;
}

.entry-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 32rpx;
  line-height: 1;
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
</style>
