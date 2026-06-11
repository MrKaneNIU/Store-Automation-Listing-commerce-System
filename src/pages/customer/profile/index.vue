<template>
  <view class="page">
    <view class="detail-header" :style="{ paddingTop: headerTopPadding }">
      <view class="detail-nav">
        <button class="icon-button plain" aria-label="返回我的" hover-class="press-feedback" @tap="goMine">
          <text class="chevron">‹</text>
        </button>
        <view class="title-cluster">
          <text class="nav-title">个人信息</text>
        </view>
        <view class="nav-spacer" />
      </view>
    </view>

    <view v-if="isInitialLoading" class="profile-feedback" aria-label="正在加载个人信息">
      <view class="skeleton-card shimmer" />
      <view class="skeleton-row shimmer" />
      <view class="skeleton-row narrow shimmer" />
    </view>

    <view v-else class="profile-content">
      <view v-if="viewModel.loadingState === 'failed'" class="inline-error">
        <text>{{ viewModel.failureMessage }}</text>
        <button hover-class="press-feedback" @tap="retry">重试</button>
      </view>

      <view v-if="viewModel.loadingState === 'refreshing'" class="inline-status">
        <text>正在同步个人信息</text>
      </view>

      <view class="profile-card">
        <view class="avatar-preview" aria-label="头像预览">
          <image v-if="previewAvatarUrl" class="avatar-image" :src="previewAvatarUrl" mode="aspectFill" />
          <text v-else class="avatar-placeholder">{{ viewModel.avatarPlaceholderText }}</text>
        </view>
        <view class="profile-copy">
          <text class="profile-title">{{ nickname || '微信客户' }}</text>
          <text class="profile-meta">昵称和头像会在保存后同步到我的页面。</text>
        </view>
      </view>

      <view class="form-card" aria-label="编辑个人信息">
        <view class="field-group">
          <text class="field-label">昵称</text>
          <input
            class="field-input"
            :class="{ invalid: Boolean(fieldErrors.nickname) }"
            :disabled="isSaving"
            :value="nickname"
            placeholder="请输入昵称"
            placeholder-class="input-placeholder"
            @input="onNicknameInput"
          />
          <text v-if="fieldErrors.nickname" class="field-error">{{ fieldErrors.nickname }}</text>
        </view>

        <view class="field-group">
          <text class="field-label">头像地址</text>
          <input
            class="field-input"
            :class="{ invalid: Boolean(fieldErrors.avatarUrl) }"
            :disabled="isSaving"
            :value="avatarUrl"
            placeholder="cloud:// 或 https:// 头像地址"
            placeholder-class="input-placeholder"
            @input="onAvatarUrlInput"
          />
          <text v-if="fieldErrors.avatarUrl" class="field-error">{{ fieldErrors.avatarUrl }}</text>
          <text v-else class="field-helper">当前阶段支持保存头像 URL，后续如接入上传能力再使用选择头像。</text>
        </view>

        <button
          class="avatar-select-button"
          open-type="chooseAvatar"
          :disabled="isSaving"
          hover-class="press-feedback"
          @chooseavatar="onChooseAvatar"
        >
          <text>选择微信头像</text>
        </button>

        <view v-if="isEmptyProfile" class="empty-state">
          <text class="empty-title">还没有完善个人资料</text>
          <text class="empty-copy">补充昵称和头像地址后，返回我的页面即可看到更新后的资料。</text>
        </view>

        <view v-if="message" class="save-message" :class="{ error: viewModel.loadingState === 'failed' }">
          <text>{{ message }}</text>
        </view>

        <button
          class="save-button"
          :class="{ saving: isSaving }"
          :disabled="isSaveDisabled"
          hover-class="press-feedback"
          @tap="save"
        >
          <text>{{ isSaving ? '保存中' : '保存资料' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { createCustomerProfilePageState } from './useCustomerProfilePageState'

type UniInputEvent = InputEvent & {
  detail?: {
    value?: string
  }
  target: (EventTarget & {
    value?: string
  }) | null
}

type UniChooseAvatarEvent = {
  detail?: {
    avatarUrl?: string
  }
}

const DEFAULT_HEADER_TOP_PADDING = 'calc(env(safe-area-inset-top) + 28rpx)'
const HEADER_TOP_OFFSET_RPX = -8
const STATUS_BAR_FALLBACK_GAP_RPX = 44
const headerTopPadding = ref(DEFAULT_HEADER_TOP_PADDING)
const profileState = createCustomerProfilePageState()
const viewModel = profileState.viewModel
const nickname = profileState.nickname
const avatarUrl = profileState.avatarUrl
const fieldErrors = profileState.fieldErrors
const message = profileState.message
const isSaving = profileState.isSaving

const previewAvatarUrl = computed(() => avatarUrl.value.trim())
const isInitialLoading = computed(() => viewModel.value.loadingState === 'loading')
const isSaveDisabled = computed(() => isSaving.value || viewModel.value.loadingState === 'loading')
const isEmptyProfile = computed(() =>
  viewModel.value.loadingState !== 'failed' && !nickname.value.trim() && !avatarUrl.value.trim(),
)

const toInputValue = (event: InputEvent): string => {
  const uniEvent = event as UniInputEvent

  return uniEvent.detail?.value ?? uniEvent.target?.value ?? ''
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
  void profileState.handlePageShow()
})

const onNicknameInput = (event: InputEvent) => {
  profileState.updateNickname(toInputValue(event))
}

const onAvatarUrlInput = (event: InputEvent) => {
  profileState.updateAvatarUrl(toInputValue(event))
}

const onChooseAvatar = (event: UniChooseAvatarEvent) => {
  const selectedAvatarUrl = event.detail?.avatarUrl
  if (selectedAvatarUrl) {
    profileState.updateAvatarUrl(selectedAvatarUrl)
  }
}

const retry = () => {
  void profileState.reload()
}

const save = () => {
  void profileState.save()
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

.nav-spacer {
  width: 76rpx;
  min-width: 76rpx;
  height: 76rpx;
}

.title-cluster {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
}

.nav-title {
  color: #222222;
  font-size: 42rpx;
  font-weight: 600;
  line-height: 1.15;
}

.icon-button,
.inline-error button,
.avatar-select-button,
.save-button {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.inline-error button::after,
.avatar-select-button::after,
.save-button::after {
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

.profile-feedback,
.profile-content {
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
  height: 300rpx;
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
.inline-error,
.save-message {
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

.inline-error,
.save-message.error {
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

.profile-card,
.form-card {
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 34rpx;
}

.avatar-preview {
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

.avatar-image {
  width: 100%;
  height: 100%;
}

.profile-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  gap: 10rpx;
}

.profile-title {
  color: #111111;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.profile-meta,
.field-helper,
.empty-copy {
  color: #777777;
  font-size: 24rpx;
  line-height: 1.45;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 34rpx;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.field-label {
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
}

.field-input {
  min-height: 88rpx;
  box-sizing: border-box;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: #f6f6f6;
  color: #222222;
  font-size: 28rpx;
  line-height: 88rpx;
}

.field-input.invalid {
  background: #fff3f1;
  box-shadow: 0 0 0 1rpx #d65f50 inset;
}

.field-input[disabled] {
  opacity: 0.56;
}

.input-placeholder {
  color: #a2a2a2;
}

.field-error {
  color: #9f2b1f;
  font-size: 24rpx;
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f6f6f6;
}

.avatar-select-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: #f2f2f2;
  color: #111111;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 88rpx;
}

.avatar-select-button[disabled] {
  opacity: 0.48;
}

.empty-title {
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.35;
}

.save-message {
  justify-content: flex-start;
  min-height: 72rpx;
}

.save-button {
  min-height: 88rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 88rpx;
}

.save-button[disabled],
.save-button.saving {
  opacity: 0.48;
}

@media (max-width: 390px) {
  .profile-card,
  .form-card {
    padding-right: 28rpx;
    padding-left: 28rpx;
  }
}
</style>
