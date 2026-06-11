<template>
  <view class="page">
    <view class="detail-header" :style="{ paddingTop: headerTopPadding }">
      <view class="detail-nav">
        <button class="icon-button plain" aria-label="返回我的" hover-class="press-feedback" @tap="goMine">
          <text class="chevron">‹</text>
        </button>
        <text class="nav-title">钱包</text>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="wallet-feedback" aria-label="正在加载钱包">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
      <view class="skeleton-row narrow shimmer" />
    </view>

    <view v-else class="wallet-content">
      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步钱包</text>
      </view>

      <view v-if="hasWalletSnapshot" class="balance-card">
        <text class="balance-label">钱包余额</text>
        <text class="balance-value">{{ viewModel.balanceText }}</text>
        <text class="balance-meta">钱包当前仅支持余额和流水查看。</text>
      </view>

      <view v-if="hasWalletSnapshot" class="ledger-section">
        <view class="section-header">
          <text class="section-title">交易流水</text>
          <text class="section-count">{{ viewModel.ledger.length }} 条</text>
        </view>

        <view v-if="viewModel.ledger.length === 0" class="empty-state">
          <text class="empty-title">{{ viewModel.emptyMessage }}</text>
          <text class="empty-copy">当前账户还没有钱包流水。</text>
        </view>

        <view v-else class="ledger-list">
          <view v-for="item in viewModel.ledger" :key="item.id" class="ledger-card">
            <view class="ledger-main">
              <view class="ledger-title-row">
                <text class="ledger-reason">{{ item.reasonLabel }}</text>
                <text class="ledger-amount" :class="{ debit: item.direction === 'debit' }">
                  {{ item.amountText }}
                </text>
              </view>
              <view class="ledger-meta-row">
                <text>{{ item.directionLabel }}</text>
                <text>{{ item.createdAtLabel }}</text>
              </view>
            </view>
            <text class="ledger-balance">{{ item.balanceAfterText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { createCustomerWalletPageState } from './useCustomerWalletPageState'

const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
const walletState = createCustomerWalletPageState()
const viewModel = walletState.viewModel

const hasWalletSnapshot = computed(() =>
  viewModel.value.loadingState !== 'failed' || viewModel.value.customerId.length > 0,
)

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
  void walletState.handlePageShow()
})

const reload = () => {
  void walletState.reload()
}

const goMine = () => {
  redirectTo(routes.customerMine)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 64rpx;
  overflow-x: hidden;
  background: #f8f8f8;
  color: #222222;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 3;
  margin: 0 -32rpx;
  padding: calc(env(safe-area-inset-top) + 28rpx) 32rpx 0;
  background: #f8f8f8;
}

.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 92rpx;
}

.nav-spacer,
.icon-button {
  width: 76rpx;
  min-width: 76rpx;
  height: 76rpx;
}

.nav-title {
  color: #111111;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.2;
}

.icon-button,
.inline-error button {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.inline-error button::after {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
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

.wallet-feedback,
.wallet-content {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 38rpx;
}

.skeleton-card,
.skeleton-row {
  border-radius: 30rpx;
  background: #ffffff;
}

.skeleton-card {
  height: 260rpx;
}

.skeleton-row {
  height: 34rpx;
}

.skeleton-row.narrow {
  width: 58%;
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
  line-height: 1.35;
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

.balance-card,
.ledger-section,
.ledger-card {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.balance-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 38rpx 34rpx;
}

.balance-label,
.section-title {
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
}

.balance-value {
  color: #050505;
  font-size: 58rpx;
  font-weight: 700;
  line-height: 1.1;
}

.balance-meta,
.empty-copy,
.section-count,
.ledger-meta-row,
.ledger-balance {
  color: #777777;
  font-size: 24rpx;
  line-height: 1.45;
}

.ledger-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 26rpx;
  border-radius: 24rpx;
  background: #f6f6f6;
}

.empty-title {
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.35;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.ledger-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 26rpx;
  box-shadow: 0 0 0 1rpx #eeeeee inset;
}

.ledger-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12rpx;
}

.ledger-title-row,
.ledger-meta-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.ledger-reason {
  min-width: 0;
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.ledger-amount {
  flex: 0 0 auto;
  color: #147a3f;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.35;
}

.ledger-amount.debit {
  color: #9f2b1f;
}

.ledger-balance {
  align-self: flex-end;
}

@media (max-width: 390px) {
  .balance-card,
  .ledger-section {
    padding-right: 28rpx;
    padding-left: 28rpx;
  }
}
</style>
