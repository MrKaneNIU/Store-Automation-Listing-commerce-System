<template>
  <view class="page">
    <view class="catalog-header" :style="{ paddingTop: headerTopPadding }">
      <view class="catalog-nav">
        <button
          class="icon-button plain"
          :class="{ busy: navigatingRoute === customerBottomNavRoutes.home }"
          :disabled="Boolean(navigatingRoute)"
          aria-label="返回首页"
          hover-class="press-feedback"
          @tap="goHome"
        >
          <text class="chevron">‹</text>
        </button>
        <view class="title-cluster">
          <text class="nav-title">新品目录</text>
          <button class="icon-button plain" aria-label="搜索商品" hover-class="press-feedback" @tap="showVisualOnlyToast('搜索入口将在后续模块接入')">
            <text class="search-mark" />
          </button>
        </view>
      </view>

      <text class="catalog-kicker">Oh My Fish</text>
    </view>

    <scroll-view class="category-rail" scroll-x enable-flex>
      <view class="category-inner">
        <button class="category-pill active" hover-class="press-feedback" @tap="showVisualOnlyToast('当前展示全部已上架商品')">全部</button>
        <button class="category-pill" hover-class="press-feedback" @tap="showVisualOnlyToast('分类筛选将在后续模块接入')">连衣裙</button>
        <button class="category-pill" hover-class="press-feedback" @tap="showVisualOnlyToast('分类筛选将在后续模块接入')">外套</button>
        <button class="category-pill" hover-class="press-feedback" @tap="showVisualOnlyToast('分类筛选将在后续模块接入')">半裙</button>
        <button class="category-pill" hover-class="press-feedback" @tap="showVisualOnlyToast('分类筛选将在后续模块接入')">通勤</button>
      </view>
    </scroll-view>

    <view class="catalog-tools">
      <button class="tool-button" hover-class="press-feedback" @tap="showVisualOnlyToast('筛选面板将在后续模块接入')">
        <text class="filter-icon">
          <text />
          <text />
          <text />
        </text>
        <text>筛选</text>
      </button>
      <button class="tool-button" hover-class="press-feedback" @tap="showVisualOnlyToast('排序面板将在后续模块接入')">
        <text class="sort-icon">↕</text>
        <text>排序</text>
      </button>
      <view class="view-toggle" aria-label="展示方式">
        <button
          class="toggle-button"
          :class="{ active: displayMode === 'grid' }"
          aria-label="网格展示"
          hover-class="press-feedback"
          @tap="showGridView"
        >
          <view class="grid-icon">
            <view />
            <view />
            <view />
            <view />
          </view>
        </button>
        <button
          class="toggle-button"
          :class="{ active: displayMode === 'list' }"
          aria-label="列表展示"
          hover-class="press-feedback"
          @tap="showListView"
        >
          <view class="list-icon">
            <view class="list-row">
              <view class="list-thumb" />
              <view class="list-line" />
            </view>
            <view class="list-row">
              <view class="list-thumb" />
              <view class="list-line" />
            </view>
            <view class="list-row">
              <view class="list-thumb" />
              <view class="list-line" />
            </view>
          </view>
        </button>
      </view>
    </view>

    <view v-if="isLoading" class="catalog-feedback">
      <view class="skeleton-card">
        <text />
        <text />
        <text />
      </view>
      <view class="empty-card muted-card">
        <text>正在加载</text>
        <button disabled>请稍候</button>
      </view>
    </view>

    <view v-else-if="products.length === 0" class="empty-state">
      <text class="empty-title">{{ emptyMessage }}</text>
      <text class="empty-copy">商品上架后会自动出现在这里。</text>
      <button class="empty-action" hover-class="press-feedback" @tap="reloadView">重新加载</button>
    </view>

    <view v-else :class="displayMode === 'list' ? 'catalog-list' : 'catalog-grid'">
      <view
        v-for="product in products"
        :key="product.id"
        class="catalog-card"
        :class="{ opening: navigatingProductId === product.id }"
        hover-class="catalog-card-pressed"
        hover-stay-time="90"
        @tap="openDetail(product.id)"
      >
        <view class="catalog-media" :class="{ failed: failedImageProductIds.includes(product.id) }">
          <image
            v-if="product.mainImageUrl"
            class="image"
            :src="product.mainImageUrl"
            mode="aspectFill"
            @error="handleProductImageError(product.id)"
          />
          <view v-else class="fashion-visual" :class="getVisualClass(product.productCode)">
            <text v-if="product.imageStatus !== 'ready' || product.imageFallbackReason" class="image-fallback-label">
              {{ product.imageFallbackReason || '图片暂时无法显示' }}
            </text>
          </view>
          <button
            class="favorite-button"
            :class="{ active: isFavoriteProduct(product.id), busy: favoriteBusyProductId === product.id }"
            :disabled="favoriteBusyProductId === product.id"
            :aria-label="favoriteButtonLabel(product.id)"
            hover-class="press-feedback"
            @tap.stop="toggleFavorite(product.id)"
          >
            <text>{{ isFavoriteProduct(product.id) ? '♥' : '♡' }}</text>
          </button>
        </view>

        <text class="product-code">{{ product.productCode }}</text>
        <text class="product-name">{{ product.productName }}</text>
        <text class="rating">4.8 <text>已上架</text></text>
        <text class="price">￥{{ product.minPrice }}</text>
      </view>
    </view>

    <view v-if="favoriteMessage" class="favorite-feedback" :class="{ danger: favoriteProductsView.loadingState === 'failed' }">
      <text>{{ favoriteMessage }}</text>
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
      <button class="tab active" :disabled="Boolean(navigatingRoute)">
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
      <button
        class="tab"
        :class="{ busy: navigatingRoute === customerBottomNavRoutes.mine }"
        :disabled="Boolean(navigatingRoute)"
        hover-class="tab-pressed"
        @tap="goMine"
      >
        <text class="tab-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import type { CustomerProductListItem } from '../../../features/customer-product-list/customer-product-list'
import { getCloudBaseCustomerProductListView } from '../../../features/cloudbase-mall/customer-product-list'
import {
  favoriteCloudBaseCustomerProduct,
  getCloudBaseCustomerFavoriteProductsView,
  unfavoriteCloudBaseCustomerProduct,
} from '../../../features/cloudbase-mall/customer-favorites'
import {
  createCustomerFavoriteProductsLoadingView,
  type CustomerFavoriteProductCommandResult,
  type CustomerFavoriteProductsView,
} from '../../../features/customer-favorites/customer-favorites'
import { customerBottomNavRoutes, shouldIgnoreCustomerBottomNavTap } from '../customer-bottom-nav'

const products = ref<CustomerProductListItem[]>([])
const emptyMessage = ref('暂无已上架商品')
const favoriteMessage = ref('')
const isLoading = ref(false)
const displayMode = ref<'grid' | 'list'>('grid')
const navigatingRoute = ref<AppRoute | ''>('')
const navigatingProductId = ref('')
const favoriteBusyProductId = ref('')
const favoriteProductsView = ref<CustomerFavoriteProductsView>(createCustomerFavoriteProductsLoadingView())
const failedImageProductIds = ref<string[]>([])
const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
let cachedProducts: CustomerProductListItem[] | null = null
let pendingRefresh: Promise<void> | null = null
let navigationFallbackTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigationLock = () => {
  navigatingRoute.value = ''

  if (navigationFallbackTimer) {
    clearTimeout(navigationFallbackTimer)
    navigationFallbackTimer = null
  }
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

type RefreshOptions = {
  showLoading: boolean
}

const refreshView = (options: RefreshOptions): Promise<void> => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  if (options.showLoading) {
    isLoading.value = true
  }

  pendingRefresh = getCloudBaseCustomerProductListView()
    .then((view) => {
      cachedProducts = view.products
      products.value = view.products
      emptyMessage.value = view.emptyMessage || '暂无已上架商品'
    })
    .finally(() => {
      if (options.showLoading) {
        isLoading.value = false
      }

      pendingRefresh = null
    })

  return pendingRefresh
}

const reloadView = () => {
  void refreshView({ showLoading: true })
}

const showGridView = () => {
  displayMode.value = 'grid'
}

const showListView = () => {
  displayMode.value = 'list'
}

const handleProductImageError = (productId: string) => {
  if (failedImageProductIds.value.includes(productId)) {
    favoriteMessage.value = '商品图片暂时无法显示，请检查图片域名或稍后重试'
    return
  }

  failedImageProductIds.value = [...failedImageProductIds.value, productId]
  favoriteMessage.value = '商品图片加载失败，已尝试刷新图片链接'
  void refreshView({ showLoading: false })
}

const keepPreviousFavoritesOnFailure = (
  resultView: CustomerFavoriteProductsView,
  previousView: CustomerFavoriteProductsView,
): CustomerFavoriteProductsView => {
  if (resultView.loadingState === 'failed' && previousView.items.length > 0) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage: resultView.failureMessage,
    }
  }

  return resultView
}

const loadFavoriteState = async () => {
  const previousFavoriteView = favoriteProductsView.value
  const resultView = await getCloudBaseCustomerFavoriteProductsView()
  favoriteProductsView.value = keepPreviousFavoritesOnFailure(resultView, previousFavoriteView)
  favoriteMessage.value = ''
}

const isFavoriteProduct = (productId: string): boolean =>
  favoriteProductsView.value.items.some((item) => item.productId === productId)

const favoriteButtonLabel = (productId: string): string => {
  if (favoriteBusyProductId.value === productId) {
    return isFavoriteProduct(productId) ? '取消中' : '保存中'
  }

  return isFavoriteProduct(productId) ? '已收藏' : '收藏'
}

const hasExpectedListToggleInvalidation = (result: CustomerFavoriteProductCommandResult): boolean =>
  result.invalidatedSnapshotKeys.some((key) => key.startsWith('customer-favorites:') && key.endsWith(':v1'))

const toggleFavorite = async (productId: string) => {
  if (favoriteBusyProductId.value) {
    return
  }

  const previousFavoriteView = favoriteProductsView.value

  favoriteBusyProductId.value = productId
  favoriteMessage.value = ''

  try {
    const result = isFavoriteProduct(productId)
      ? await unfavoriteCloudBaseCustomerProduct(productId, undefined, previousFavoriteView)
      : await favoriteCloudBaseCustomerProduct(productId, undefined, previousFavoriteView)

    favoriteProductsView.value = result.view
    favoriteMessage.value =
      result.status === 'succeeded' && !hasExpectedListToggleInvalidation(result)
        ? '收藏已更新，稍后同步最新状态'
        : result.message
  } finally {
    favoriteBusyProductId.value = ''
  }
}

onShow(() => {
  navigatingProductId.value = ''
  clearNavigationLock()
  void loadFavoriteState()

  if (cachedProducts) {
    products.value = cachedProducts
    isLoading.value = false
    void refreshView({ showLoading: false })

    return
  }

  void refreshView({ showLoading: true })
})

const openDetail = (productId: string) => {
  if (navigatingProductId.value) {
    return
  }

  navigatingProductId.value = productId
  navigateTo(`/pages/customer/product-detail/index?id=${productId}`, {
    onFail: () => {
      navigatingProductId.value = ''
      uni.showToast({
        title: '页面打开失败，请稍后重试',
        icon: 'none',
        duration: 1600,
      })
    },
  })
}

const goCustomerBottomNav = (targetRoute: AppRoute) => {
  if (
    shouldIgnoreCustomerBottomNavTap({
      pendingRoute: navigatingRoute.value,
      targetRoute,
      currentRoute: customerBottomNavRoutes.catalog,
    })
  ) {
    return
  }

  navigatingRoute.value = targetRoute
  navigationFallbackTimer = setTimeout(clearNavigationLock, 900)
  redirectTo(targetRoute, {
    onFail: () => {
      uni.showToast({
        title: '页面切换失败，请稍后重试',
        icon: 'none',
        duration: 1600,
      })
    },
    onComplete: clearNavigationLock,
  })
}

const goHome = () => {
  goCustomerBottomNav(customerBottomNavRoutes.home)
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

const showVisualOnlyToast = (title: string) => {
  uni.showToast({
    title,
    icon: 'none',
    duration: 1800,
  })
}

const getVisualClass = (productCode: string) => {
  const seed = productCode.charCodeAt(productCode.length - 1) || 0
  return seed % 3 === 0 ? 'dress' : seed % 3 === 1 ? 'coat' : 'runway'
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

.catalog-header {
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
}

.catalog-nav {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16rpx;
  min-height: 92rpx;
}

.icon-button,
.category-pill,
.tool-button,
.toggle-button,
.favorite-button,
.empty-action,
.tab {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.category-pill::after,
.tool-button::after,
.toggle-button::after,
.favorite-button::after,
.empty-action::after,
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

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.busy {
  opacity: 0.62;
}

.chevron {
  display: block;
  font-size: 44rpx;
  font-weight: 300;
  line-height: 1;
  transform: translateY(-1rpx);
}

.search-mark {
  position: relative;
  display: block;
  width: 30rpx;
  height: 30rpx;
  border: 3rpx solid #050505;
  border-radius: 999rpx;
  transform: translate(-2rpx, -2rpx);
}

.search-mark::after {
  position: absolute;
  right: -9rpx;
  bottom: -6rpx;
  width: 15rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #050505;
  content: "";
  transform: rotate(45deg);
}

.title-cluster {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
  min-width: 0;
  padding-right: 76rpx;
}

.nav-title {
  min-width: 0;
  color: #222222;
  font-size: 42rpx;
  font-weight: 500;
  line-height: 1.15;
  text-align: center;
}

.catalog-kicker {
  display: block;
  margin-top: 34rpx;
  color: #9a9a9a;
  font-size: 22rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
  line-height: 1.2;
}

.category-rail {
  width: 100%;
  margin-top: 28rpx;
  white-space: nowrap;
}

.category-inner {
  display: flex;
  gap: 18rpx;
  padding: 0 32rpx;
}

.category-pill {
  flex: 0 0 auto;
  min-height: 64rpx;
  padding: 0 50rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #9a9a9a;
  font-size: 28rpx;
  line-height: 64rpx;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.category-pill.active {
  background: #050505;
  color: #ffffff;
  box-shadow: none;
}

.catalog-tools {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 104rpx;
  margin: 38rpx 32rpx 0;
}

.tool-button {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-width: 0;
  min-height: 88rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  font-size: 28rpx;
  line-height: 1;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.filter-icon,
.sort-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
}

.filter-icon {
  flex-direction: column;
  gap: 8rpx;
}

.filter-icon text {
  display: block;
  height: 3rpx;
  border-radius: 999rpx;
  background: #050505;
}

.filter-icon text:first-child {
  width: 34rpx;
}

.filter-icon text:nth-child(2) {
  width: 24rpx;
}

.filter-icon text:nth-child(3) {
  width: 14rpx;
}

.sort-icon {
  font-size: 32rpx;
  line-height: 1;
}

.view-toggle {
  display: flex;
  flex: 0 0 auto;
  gap: 8rpx;
  min-height: 80rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  padding: 0;
  border-radius: 18rpx;
  background: transparent;
  color: #8f8f8f;
}

.toggle-button.active {
  background: #111111;
  color: #ffffff;
}

.grid-icon,
.list-icon {
  display: flex;
  width: 36rpx;
  height: 36rpx;
}

.grid-icon {
  flex-wrap: wrap;
  gap: 4rpx;
}

.grid-icon view {
  display: block;
  width: 15rpx;
  height: 15rpx;
  border-radius: 4rpx;
  background: currentColor;
}

.list-icon {
  flex-direction: column;
  justify-content: center;
  gap: 5rpx;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 5rpx;
  height: 7rpx;
}

.list-thumb {
  flex: 0 0 auto;
  width: 7rpx;
  height: 7rpx;
  border-radius: 2rpx;
  background: currentColor;
}

.list-line {
  flex: 1 1 auto;
  height: 3rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.catalog-feedback {
  display: flex;
  gap: 18rpx;
  margin: 26rpx 32rpx 0;
}

.skeleton-card,
.empty-card {
  flex: 1 1 0;
  min-width: 0;
  min-height: 132rpx;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-sizing: border-box;
  padding: 22rpx;
}

.skeleton-card text {
  display: block;
  height: 18rpx;
  border-radius: 999rpx;
  background: #eeeeee;
}

.skeleton-card text:first-child {
  width: 70%;
}

.skeleton-card text:nth-child(2) {
  width: 92%;
}

.skeleton-card text:nth-child(3) {
  width: 52%;
}

.empty-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
  box-sizing: border-box;
  padding: 18rpx;
}

.empty-card text {
  color: #222222;
  font-size: 26rpx;
  line-height: 1.2;
}

.empty-card button {
  align-self: flex-start;
  min-height: 52rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 52rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  box-sizing: border-box;
  min-height: 420rpx;
  margin: 38rpx 32rpx 0;
  padding: 48rpx 40rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(5, 5, 5, 0.05);
}

.empty-title {
  color: #222222;
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
  min-height: 72rpx;
  margin-top: 12rpx;
  padding: 0 30rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 72rpx;
}

.catalog-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 40rpx 36rpx;
  box-sizing: border-box;
  padding: 38rpx 32rpx 28rpx;
}

.catalog-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  box-sizing: border-box;
  padding: 38rpx 32rpx 28rpx;
}

.catalog-card {
  width: calc((100% - 36rpx) / 2);
  min-width: 0;
  transition: opacity 160ms ease, transform 160ms ease;
  will-change: transform;
}

.catalog-list .catalog-card {
  display: grid;
  grid-template-columns: 168rpx minmax(0, 1fr);
  column-gap: 22rpx;
  box-sizing: border-box;
  width: 100%;
  padding: 16rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 38rpx rgba(5, 5, 5, 0.05);
}

.catalog-card-pressed,
.catalog-card.opening {
  opacity: 0.84;
  transform: scale(0.985);
}

.catalog-media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 392rpx;
  overflow: hidden;
  border-radius: 26rpx;
  background: #f0f0f0;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.catalog-list .catalog-media {
  grid-row: 1 / span 4;
  width: 168rpx;
  height: 168rpx;
  border-radius: 22rpx;
  box-shadow: none;
}

.image,
.fashion-visual {
  width: 100%;
  height: 100%;
}

.image-fallback-label {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  left: 18rpx;
  box-sizing: border-box;
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.88);
  color: #5f5f5f;
  font-size: 22rpx;
  line-height: 1.25;
  text-align: center;
}

.fashion-visual {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.86) 0 8%, transparent 8.4%),
    linear-gradient(110deg, transparent 0 36%, rgba(5, 5, 5, 0.82) 36.4% 49%, transparent 49.4%),
    radial-gradient(ellipse at 50% 72%, rgba(5, 5, 5, 0.88) 0 30%, transparent 30.5%),
    linear-gradient(145deg, #d8d8d8 0%, #f7f7f7 42%, #bdbdbd 100%);
}

.fashion-visual::before,
.fashion-visual::after {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(5, 5, 5, 0.78);
  content: "";
}

.fashion-visual::before {
  top: 22%;
  left: 43%;
  width: 14%;
  height: 42%;
  transform: rotate(-6deg);
}

.fashion-visual::after {
  right: 18%;
  bottom: 8%;
  width: 46%;
  height: 18%;
  background: rgba(255, 255, 255, 0.42);
  transform: rotate(-18deg);
}

.fashion-visual.coat {
  background:
    radial-gradient(circle at 49% 16%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(105deg, transparent 0 31%, rgba(5, 5, 5, 0.86) 31.4% 56%, transparent 56.4%),
    radial-gradient(ellipse at 50% 74%, rgba(5, 5, 5, 0.9) 0 29%, transparent 29.5%),
    linear-gradient(145deg, #ececec, #f9f9f9 48%, #c6c6c6);
}

.fashion-visual.dress {
  background:
    radial-gradient(circle at 51% 17%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(100deg, transparent 0 38%, rgba(5, 5, 5, 0.78) 38.4% 47%, transparent 47.4%),
    radial-gradient(ellipse at 50% 76%, rgba(5, 5, 5, 0.82) 0 34%, transparent 34.5%),
    linear-gradient(145deg, #dddddd, #ffffff 46%, #b8b8b8);
}

.fashion-visual.runway {
  background:
    radial-gradient(circle at 48% 18%, rgba(255, 255, 255, 0.9) 0 7.4%, transparent 7.8%),
    linear-gradient(108deg, transparent 0 34%, rgba(5, 5, 5, 0.82) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 48% 70%, rgba(5, 5, 5, 0.86) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #cfcfcf, #fbfbfb 42%, #9d9d9d);
}

.favorite-button {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  padding: 0;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #050505;
  box-shadow: 0 18rpx 44rpx rgba(0, 0, 0, 0.1);
}

.favorite-button.active {
  background: #050505;
  color: #ffffff;
}

.favorite-button text {
  font-size: 32rpx;
  line-height: 1;
}

.product-code {
  display: block;
  margin-top: 22rpx;
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-list .product-code {
  grid-column: 2;
  margin-top: 0;
  font-size: 22rpx;
}

.product-name {
  display: -webkit-box;
  min-height: 96rpx;
  margin-top: 8rpx;
  overflow: hidden;
  color: #222222;
  font-size: 40rpx;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.catalog-list .product-name {
  grid-column: 2;
  min-height: 0;
  margin-top: 6rpx;
  font-size: 32rpx;
}

.rating {
  display: block;
  margin-top: 12rpx;
  color: #050505;
  font-size: 26rpx;
  line-height: 1.2;
}

.catalog-list .rating {
  grid-column: 2;
  margin-top: 10rpx;
  font-size: 24rpx;
}

.rating text {
  color: #9a9a9a;
}

.price {
  display: block;
  margin-top: 18rpx;
  color: #050505;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 1;
  overflow-wrap: anywhere;
}

.catalog-list .price {
  grid-column: 2;
  margin-top: 12rpx;
  font-size: 36rpx;
}

.favorite-feedback {
  position: fixed;
  right: 32rpx;
  bottom: calc(166rpx + env(safe-area-inset-bottom));
  left: 32rpx;
  z-index: 9;
  display: flex;
  box-sizing: border-box;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.96);
  color: #666666;
  font-size: 26rpx;
  line-height: 1.4;
  box-shadow: 0 18rpx 44rpx rgba(5, 5, 5, 0.1);
}

.favorite-feedback.danger {
  background: #fff3f1;
  color: #9f2b1f;
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
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 0;
  min-height: 104rpx;
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
  .catalog-grid {
    gap: 34rpx 28rpx;
  }

  .catalog-card {
    width: calc((100% - 28rpx) / 2);
  }

  .catalog-list .catalog-card {
    grid-template-columns: 150rpx minmax(0, 1fr);
    width: 100%;
    padding: 14rpx;
  }

  .catalog-media {
    height: 366rpx;
  }

  .catalog-list .catalog-media {
    width: 150rpx;
    height: 150rpx;
  }

  .product-name {
    font-size: 36rpx;
  }

  .catalog-list .product-name {
    font-size: 30rpx;
  }
}
</style>
