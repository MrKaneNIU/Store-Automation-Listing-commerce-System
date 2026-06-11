<template>
  <view class="page">
    <view class="detail-header" :style="{ paddingTop: headerTopPadding }">
      <view class="detail-nav">
        <button class="icon-button plain" aria-label="返回我的" hover-class="press-feedback" @tap="goMine">
          <text class="chevron">‹</text>
        </button>
        <text class="nav-title">收货地址</text>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="viewModel.loadingState === 'loading'" class="feedback">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
    </view>

    <view v-else class="content">
      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="reload">重试</button>
      </view>

      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步地址簿</text>
      </view>

      <view v-if="viewModel.items.length === 0" class="empty-state">
        <text class="empty-title">{{ viewModel.emptyMessage }}</text>
        <text class="empty-copy">新增地址后，商品详情和购物袋结算会使用这里的收货信息。</text>
      </view>

      <view v-else class="address-list">
        <view
          v-for="item in viewModel.items"
          :key="item.id"
          class="address-card"
          :class="{ selected: selectedAddressId === item.id }"
          @tap="selectAddress(item.id)"
        >
          <view class="address-main">
            <view class="recipient-row">
              <text class="recipient">{{ item.recipientLine }}</text>
              <text v-if="item.defaultLabel" class="default-badge">{{ item.defaultLabel }}</text>
            </view>
            <text class="region">{{ item.regionLine }}</text>
            <text class="detail">{{ item.detailLine }}</text>
          </view>
          <view class="address-actions">
            <button
              class="text-button"
              :disabled="isDeletingAddress(item.id)"
              hover-class="press-feedback"
              @tap.stop="editAddress(item.id)"
            >
              编辑
            </button>
            <button
              class="text-button"
              :disabled="item.isDefault || isDeletingAddress(item.id)"
              hover-class="press-feedback"
              @tap.stop="setDefaultAddress(item.id)"
            >
              设默认
            </button>
            <button
              class="text-button danger"
              :disabled="isDeletingAddress(item.id)"
              hover-class="press-feedback"
              @tap.stop="deleteAddress(item.id)"
            >
              {{ isDeletingAddress(item.id) ? '删除中' : '删除' }}
            </button>
          </view>
        </view>
      </view>

      <view class="form-card">
        <text class="form-title">{{ editingAddressId ? '编辑地址' : '新增地址' }}</text>

        <view class="field-row">
          <view class="field">
            <text class="field-label">收货人</text>
            <input class="field-input" :value="form.contactName" :disabled="isSaving" @input="onInput('contactName', $event)" />
            <text v-if="fieldErrors.contactName" class="field-error">{{ fieldErrors.contactName }}</text>
          </view>
          <view class="field">
            <text class="field-label">手机号</text>
            <input class="field-input" type="number" :value="form.phoneNumber" :disabled="isSaving" @input="onInput('phoneNumber', $event)" />
            <text v-if="fieldErrors.phoneNumber" class="field-error">{{ fieldErrors.phoneNumber }}</text>
          </view>
        </view>

        <view class="field-row">
          <view class="field">
            <text class="field-label">省份</text>
            <input class="field-input" :value="form.province" :disabled="isSaving" @input="onInput('province', $event)" />
            <text v-if="fieldErrors.province" class="field-error">{{ fieldErrors.province }}</text>
          </view>
          <view class="field">
            <text class="field-label">城市</text>
            <input class="field-input" :value="form.city" :disabled="isSaving" @input="onInput('city', $event)" />
            <text v-if="fieldErrors.city" class="field-error">{{ fieldErrors.city }}</text>
          </view>
        </view>

        <view class="field">
          <text class="field-label">区县</text>
          <input class="field-input" :value="form.district" :disabled="isSaving" @input="onInput('district', $event)" />
          <text v-if="fieldErrors.district" class="field-error">{{ fieldErrors.district }}</text>
        </view>

        <view class="field">
          <text class="field-label">详细地址</text>
          <input class="field-input" :value="form.detail" :disabled="isSaving" @input="onInput('detail', $event)" />
          <text v-if="fieldErrors.detail" class="field-error">{{ fieldErrors.detail }}</text>
        </view>

        <label class="default-toggle">
          <checkbox :checked="Boolean(form.isDefault)" :disabled="isSaving" @tap="toggleDefault" />
          <text>设为默认地址</text>
        </label>

        <view class="form-actions">
          <button class="secondary-action" :disabled="isSaving" hover-class="press-feedback" @tap="resetForm">清空</button>
          <button class="primary-action" :disabled="isSaveDisabled" hover-class="press-feedback" @tap="saveAddress">
            {{ isSaving ? '保存中' : editingAddressId ? '保存修改' : '新增地址' }}
          </button>
        </view>
      </view>

      <view v-if="message" class="address-message">
        <text>{{ message }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { createCustomerAddressPageState } from './useCustomerAddressPageState'

type AddressField = 'contactName' | 'phoneNumber' | 'province' | 'city' | 'district' | 'detail'

const addressState = createCustomerAddressPageState()
const viewModel = addressState.viewModel
const form = addressState.form
const fieldErrors = addressState.fieldErrors
const selectedAddressId = addressState.selectedAddressId
const editingAddressId = addressState.editingAddressId
const message = addressState.message
const isSaving = addressState.isSaving
const processingAddressId = addressState.processingAddressId
const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
const isSaveDisabled = computed(() => isSaving.value || viewModel.value.loadingState === 'loading')

const readInputValue = (event: unknown): string => {
  const detail = (event as { detail?: { value?: unknown } }).detail

  return String(detail?.value ?? '')
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
  void addressState.handlePageShow()
})

const reload = () => {
  void addressState.reload()
}

const onInput = (field: AddressField, event: unknown) => {
  addressState.updateField(field, readInputValue(event))
}

const toggleDefault = () => {
  addressState.updateField('isDefault', !form.value.isDefault)
}

const resetForm = () => addressState.resetForm()
const editAddress = (addressId: string) => addressState.editAddress(addressId)
const saveAddress = () => void addressState.saveAddress()
const deleteAddress = (addressId: string) => void addressState.deleteAddress(addressId)
const setDefaultAddress = (addressId: string) => void addressState.setDefaultAddress(addressId)
const selectAddress = (addressId: string) => addressState.selectAddress(addressId)
const isDeletingAddress = (addressId: string) => processingAddressId.value === addressId

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
}

.icon-button,
.text-button,
.secondary-action,
.primary-action,
.inline-error button {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.text-button::after,
.secondary-action::after,
.primary-action::after,
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
  font-size: 44rpx;
  font-weight: 300;
  line-height: 1;
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.content,
.feedback,
.address-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.address-card,
.form-card,
.empty-state,
.inline-status,
.inline-error,
.address-message,
.skeleton-card,
.skeleton-row {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.address-card,
.form-card,
.empty-state {
  padding: 30rpx;
}

.address-card.selected {
  box-shadow: 0 0 0 2rpx #111111 inset, 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.recipient-row,
.address-actions,
.form-actions,
.field-row,
.inline-status,
.inline-error,
.address-message {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.recipient {
  color: #111111;
  font-size: 30rpx;
  font-weight: 700;
}

.default-badge {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #111111;
  color: #ffffff;
  font-size: 22rpx;
}

.region,
.detail,
.empty-copy {
  display: block;
  margin-top: 10rpx;
  color: #666666;
  font-size: 26rpx;
  line-height: 1.45;
}

.address-actions {
  margin-top: 22rpx;
  justify-content: flex-end;
}

.text-button {
  min-height: 58rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #f3f3f3;
  color: #111111;
  font-size: 24rpx;
}

.text-button.danger {
  color: #c21f16;
}

.text-button[disabled],
.secondary-action[disabled],
.primary-action[disabled] {
  opacity: 0.48;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-title,
.empty-title {
  color: #111111;
  font-size: 34rpx;
  font-weight: 700;
}

.field-row {
  align-items: flex-start;
}

.field {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10rpx;
}

.field-label {
  color: #222222;
  font-size: 26rpx;
  font-weight: 600;
}

.field-input {
  min-height: 86rpx;
  box-sizing: border-box;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: #f6f6f6;
  color: #111111;
  font-size: 28rpx;
}

.field-error,
.inline-error {
  color: #c21f16;
}

.field-error {
  font-size: 23rpx;
}

.default-toggle {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 72rpx;
  color: #333333;
  font-size: 26rpx;
}

.form-actions {
  justify-content: flex-end;
}

.secondary-action,
.primary-action,
.inline-error button {
  min-height: 82rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.secondary-action,
.primary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.secondary-action {
  background: #f2f2f2;
  color: #111111;
}

.primary-action,
.inline-error button {
  background: #050505;
  color: #ffffff;
}

.inline-status,
.inline-error,
.address-message {
  justify-content: space-between;
  min-height: 82rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
}

.skeleton-card {
  height: 260rpx;
}

.skeleton-row {
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
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}
</style>
