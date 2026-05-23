<template>
  <view class="page">
    <view class="hero" :class="`tone-${homepageSettings.backgroundTone}`">
      <view class="topbar" :style="{ top: topbarTop }">
        <button
          class="manage-link"
          :class="{ busy: navigatingRoute === routes.ownerDashboard }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goOwnerDashboard"
        >
          管理
        </button>
      </view>

      <view class="hero-visual">
        <image
          v-if="homepageSettings.customBackgroundImage"
          class="hero-background-image"
          :src="homepageSettings.customBackgroundImage"
          mode="aspectFill"
        />
        <view v-if="!homepageSettings.customBackgroundImage" class="visual-head" />
        <view v-if="!homepageSettings.customBackgroundImage" class="visual-body" />
        <view v-if="!homepageSettings.customBackgroundImage" class="visual-skirt" />
        <view v-if="!homepageSettings.customBackgroundImage" class="visual-train" />
      </view>
      <view class="hero-shade" />

      <view class="hero-copy">
        <text class="eyebrow">NEW SEASON</text>
        <text class="hero-title">{{ homepageSettings.titleLineOne }}</text>
        <text class="hero-title">{{ homepageSettings.titleLineTwo }}</text>
        <text class="hero-note">{{ homepageSettings.promotionalContent }}</text>
        <button
          class="primary-button"
          :class="{ busy: navigatingRoute === routes.customerProductList }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goProductList"
        >
          <text>查看新品</text>
          <text class="button-mark">↗</text>
        </button>
      </view>
    </view>

    <view class="new-arrivals">
      <view class="section-heading">
        <view class="heading-copy">
          <text class="eyebrow dark">CURATED DROP</text>
          <text class="section-title">新品</text>
        </view>
        <button
          class="ghost-button"
          :class="{ busy: navigatingRoute === routes.customerProductList }"
          :disabled="Boolean(navigatingRoute)"
          @tap="goProductList"
        >
          全部
        </button>
      </view>

      <scroll-view class="product-rail" scroll-x enable-flex>
        <view class="rail-inner">
          <view class="product-card" :class="{ busy: navigatingRoute === routes.customerProductList }" @tap="goProductList">
            <view class="product-media coat">
              <view class="mini-head" />
              <view class="mini-body" />
              <text class="favorite-mark">♡</text>
            </view>
            <text class="product-code">NEW ARRIVAL</text>
            <text class="product-name">黑色廓形短外套</text>
            <text class="price">进入商品列表查看</text>
          </view>

          <view class="product-card tonal" :class="{ busy: navigatingRoute === routes.customerProductList }" @tap="goProductList">
            <view class="product-media empty-media">
              <text class="image-fallback">NO IMAGE</text>
            </view>
            <text class="product-code">READY TO STYLE</text>
            <text class="product-name">象牙白垂坠半裙</text>
            <text class="price">真实价格来自商品页</text>
          </view>

          <view class="product-card" :class="{ busy: navigatingRoute === routes.customerProductList }" @tap="goProductList">
            <view class="product-media dress">
              <view class="mini-head" />
              <view class="mini-body long" />
              <text class="sale-pill">NEW</text>
            </view>
            <text class="product-code">OH MY FISH</text>
            <text class="product-name">法式收腰连衣裙</text>
            <text class="price">浏览不会触发登录</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="customer-nav">
      <button class="tab active" @tap="stayHome">
        <text class="tab-icon">⌂</text>
        <text>首页</text>
      </button>
      <button
        class="tab"
        :class="{ busy: navigatingRoute === routes.customerProductList }"
        :disabled="Boolean(navigatingRoute)"
        @tap="goProductList"
      >
        <text class="tab-icon">◇</text>
        <text>商品</text>
      </button>
      <button class="tab" @tap="showVisualOnlyToast('购物袋为视觉入口，真实购物袋能力需单独 PRD')">
        <text class="tab-icon">▢</text>
        <text>购物袋</text>
      </button>
      <button class="tab" @tap="showVisualOnlyToast('收藏为视觉入口，真实收藏能力需单独 PRD')">
        <text class="tab-icon">♡</text>
        <text>收藏</text>
      </button>
      <button class="tab" @tap="showVisualOnlyToast('我的为视觉入口，不新增个人中心数据模型')">
        <text class="tab-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../app/navigation'
import type { AppRoute } from '../../app/routes'
import { routes } from '../../app/routes'
import { getAdminWorkbenchEntryRoute } from '../../features/admin-workbench-auth/admin-workbench-entry'
import { getHomepageSettingsView } from '../../features/homepage-settings/homepage-settings'

const DEFAULT_TOPBAR_TOP = 'calc(env(safe-area-inset-top) + 40rpx)'

const topbarTop = ref(DEFAULT_TOPBAR_TOP)
const navigatingRoute = ref<AppRoute | ''>('')
const homepageSettings = ref(getHomepageSettingsView())

const syncTopbarPosition = () => {
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect?.()
    const systemInfo = uni.getSystemInfoSync()

    if (menuButton && Number.isFinite(menuButton.top) && menuButton.top > 0) {
      topbarTop.value = `${Math.ceil(menuButton.top)}px`

      return
    }

    const statusBarHeight = systemInfo.statusBarHeight

    if (typeof statusBarHeight === 'number' && Number.isFinite(statusBarHeight) && statusBarHeight > 0) {
      topbarTop.value = `${Math.ceil(statusBarHeight + 8)}px`
    }
  } catch {
    topbarTop.value = DEFAULT_TOPBAR_TOP
  }
}

onMounted(syncTopbarPosition)
onShow(() => {
  homepageSettings.value = getHomepageSettingsView()
})

const stayHome = () => {
  uni.pageScrollTo({ scrollTop: 0, duration: 180 })
}

const goProductList = () => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = routes.customerProductList
  redirectTo(routes.customerProductList)
}

const goOwnerDashboard = () => {
  if (navigatingRoute.value) {
    return
  }

  const targetRoute = getAdminWorkbenchEntryRoute()

  navigatingRoute.value = targetRoute
  navigateTo(targetRoute, {
    onFail: () => {
      navigatingRoute.value = ''
      uni.showToast({
        title: '页面打开失败，请稍后重试',
        icon: 'none',
        duration: 1600,
      })
    },
  })
}

const showVisualOnlyToast = (title: string) => {
  uni.showToast({
    title,
    icon: 'none',
    duration: 1800,
  })
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

.hero {
  position: relative;
  min-height: 1080rpx;
  overflow: hidden;
  border-bottom-right-radius: 38rpx;
  border-bottom-left-radius: 38rpx;
  background: #f0f0f0;
}

.hero.tone-linen {
  background: #f7f2ea;
}

.hero.tone-noir {
  background: #202020;
}

.topbar {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 40rpx);
  left: 32rpx;
  z-index: 4;
  display: flex;
  align-items: center;
}

.manage-link,
.primary-button,
.ghost-button,
.tab {
  margin: 0;
  border: 0;
  transition: opacity 120ms ease, transform 120ms ease;
}

.manage-link::after,
.primary-button::after,
.ghost-button::after,
.tab::after {
  border: 0;
}

.manage-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 88rpx;
  min-height: 88rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #050505;
  box-shadow: 0 18rpx 44rpx rgba(0, 0, 0, 0.1);
}

.manage-link {
  min-width: 116rpx;
  padding: 0 26rpx;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1;
}

.hero-visual {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 48% 18%, rgba(255, 255, 255, 0.9) 0 7.4%, transparent 7.8%),
    linear-gradient(108deg, transparent 0 34%, rgba(5, 5, 5, 0.82) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 48% 70%, rgba(5, 5, 5, 0.86) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #cfcfcf, #fbfbfb 42%, #9d9d9d);
}

.hero-background-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.tone-linen .hero-visual {
  background:
    radial-gradient(circle at 48% 18%, rgba(255, 255, 255, 0.92) 0 7.4%, transparent 7.8%),
    linear-gradient(108deg, transparent 0 34%, rgba(92, 82, 72, 0.76) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 48% 70%, rgba(118, 103, 89, 0.72) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #e8dfd4, #fffaf1 42%, #cdbfae);
}

.tone-noir .hero-visual {
  background:
    radial-gradient(circle at 48% 18%, rgba(244, 244, 244, 0.9) 0 7.4%, transparent 7.8%),
    linear-gradient(108deg, transparent 0 34%, rgba(240, 240, 240, 0.72) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 48% 70%, rgba(245, 245, 245, 0.52) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #242424, #464646 42%, #111111);
}

.visual-head,
.visual-body,
.visual-skirt,
.visual-train {
  position: absolute;
  display: block;
}

.visual-head {
  top: 132rpx;
  left: 345rpx;
  width: 82rpx;
  height: 82rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
}

.visual-body {
  top: 250rpx;
  left: 318rpx;
  width: 110rpx;
  height: 350rpx;
  border-radius: 999rpx;
  background: rgba(5, 5, 5, 0.78);
  transform: rotate(-6deg);
}

.visual-skirt {
  right: 184rpx;
  bottom: 156rpx;
  width: 330rpx;
  height: 260rpx;
  border-radius: 999rpx;
  background: rgba(5, 5, 5, 0.86);
}

.visual-train {
  right: 126rpx;
  bottom: 78rpx;
  width: 330rpx;
  height: 132rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.42);
  transform: rotate(-18deg);
}

.hero-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(5, 5, 5, 0.1) 0%, rgba(5, 5, 5, 0.04) 42%, rgba(5, 5, 5, 0.72) 100%),
    linear-gradient(90deg, rgba(5, 5, 5, 0.2), rgba(5, 5, 5, 0));
}

.hero-copy {
  position: absolute;
  right: 32rpx;
  bottom: 52rpx;
  left: 32rpx;
  z-index: 3;
  color: #ffffff;
}

.eyebrow {
  display: block;
  margin-bottom: 18rpx;
  font-size: 22rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
  line-height: 1.2;
}

.dark {
  color: #9a9a9a;
}

.hero-title {
  display: block;
  font-size: 96rpx;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.05;
}

.hero-note {
  display: block;
  max-width: 600rpx;
  margin-top: 24rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 28rpx;
  line-height: 1.55;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 328rpx;
  min-height: 94rpx;
  margin-top: 34rpx;
  padding: 0 12rpx 0 36rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1;
}

.button-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 30rpx;
  line-height: 1;
}

.new-arrivals {
  padding: 54rpx 0 32rpx 32rpx;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  padding-right: 32rpx;
  margin-bottom: 28rpx;
}

.heading-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.section-title {
  display: block;
  color: #222222;
  font-size: 78rpx;
  font-weight: 500;
  line-height: 1.08;
}

.ghost-button {
  flex: 0 0 auto;
  min-width: 104rpx;
  min-height: 64rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  font-size: 24rpx;
  line-height: 64rpx;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.product-rail {
  width: 100%;
  white-space: nowrap;
}

.rail-inner {
  display: flex;
  gap: 30rpx;
  padding-right: 32rpx;
}

.product-card {
  flex: 0 0 312rpx;
  width: 312rpx;
  transition: opacity 120ms ease, transform 120ms ease;
  white-space: normal;
}

.product-media {
  position: relative;
  width: 312rpx;
  height: 388rpx;
  margin-bottom: 18rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: #f0f0f0;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.coat {
  background:
    radial-gradient(circle at 49% 16%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(105deg, transparent 0 31%, rgba(5, 5, 5, 0.86) 31.4% 56%, transparent 56.4%),
    radial-gradient(ellipse at 50% 74%, rgba(5, 5, 5, 0.9) 0 29%, transparent 29.5%),
    linear-gradient(145deg, #ececec, #f9f9f9 48%, #c6c6c6);
}

.dress {
  background:
    radial-gradient(circle at 51% 17%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(100deg, transparent 0 38%, rgba(5, 5, 5, 0.78) 38.4% 47%, transparent 47.4%),
    radial-gradient(ellipse at 50% 76%, rgba(5, 5, 5, 0.82) 0 34%, transparent 34.5%),
    linear-gradient(145deg, #dddddd, #ffffff 46%, #b8b8b8);
}

.empty-media {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.mini-head,
.mini-body {
  position: absolute;
  display: block;
  border-radius: 999rpx;
}

.mini-head {
  top: 54rpx;
  left: 132rpx;
  width: 52rpx;
  height: 52rpx;
  background: rgba(255, 255, 255, 0.9);
}

.mini-body {
  top: 122rpx;
  left: 128rpx;
  width: 62rpx;
  height: 162rpx;
  background: rgba(5, 5, 5, 0.72);
  transform: rotate(-6deg);
}

.mini-body.long {
  left: 132rpx;
  height: 210rpx;
  background: rgba(5, 5, 5, 0.66);
}

.favorite-mark,
.sale-pill {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64rpx;
  height: 64rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #050505;
  font-size: 28rpx;
  line-height: 1;
}

.sale-pill {
  font-size: 20rpx;
  font-weight: 600;
}

.image-fallback {
  color: #9a9a9a;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.product-code,
.product-name,
.price {
  display: block;
  overflow-wrap: anywhere;
}

.product-code {
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.25;
}

.product-name {
  min-height: 78rpx;
  margin-top: 8rpx;
  color: #222222;
  font-size: 34rpx;
  font-weight: 500;
  line-height: 1.28;
}

.price {
  margin-top: 12rpx;
  color: #050505;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.25;
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

.tab-icon {
  font-size: 30rpx;
  line-height: 1;
}

.tab.active {
  color: #050505;
}

.busy {
  opacity: 0.66;
  transform: scale(0.98);
}

@media (max-width: 390px) {
  .hero-title {
    font-size: 88rpx;
  }

  .product-card,
  .product-media {
    width: 292rpx;
  }

  .product-card {
    flex-basis: 292rpx;
  }
}
</style>
