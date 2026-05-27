<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">HOMEPAGE</text>
        <text class="title">首页设置</text>
      </view>
      <button class="back-link" :disabled="Boolean(navigatingRoute)" @tap="goMore">更多</button>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">首页展示</text>
        <text class="hero-title">编辑首页展示内容</text>
        <text class="hero-desc">调整首页背景、标题和宣传内容；商品、订单和上传识别流程保持不变。</text>
      </view>
    </view>

    <view class="form-panel">
      <view class="panel-head">
        <text class="section-title">编辑</text>
        <text class="section-meta">保存后首页立即读取最新展示设置</text>
      </view>

      <view class="tone-row">
        <button
          v-for="option in homepageBackgroundOptions"
          :key="option.value"
          class="tone-pill"
          :class="{ active: draft.backgroundTone === option.value }"
          @tap="selectTone(option.value)"
        >
          {{ option.label }}
        </button>
      </view>

      <view class="custom-background">
        <view class="custom-background-copy">
          <text class="field-label">自定义首页背景</text>
          <text class="helper-text">上传图片后会优先用于下方预览，移除后回到所选背景。</text>
        </view>
        <view class="custom-background-actions">
          <button class="upload-button" :disabled="isChoosingImage" @tap="chooseCustomBackground">
            {{ draft.customBackgroundImage ? '更换图片' : '上传图片' }}
          </button>
          <button v-if="draft.customBackgroundImage" class="clear-button" @tap="clearCustomBackground">移除</button>
        </view>
        <text v-if="draft.customBackgroundImage" class="image-status">已选择自定义背景图，保存后首页展示层会读取这张图。</text>
      </view>

      <label class="field">
        <text class="field-label">标题第一行</text>
        <input v-model="draft.titleLineOne" class="input" maxlength="14" placeholder="输入首页标题第一行" />
      </label>

      <label class="field">
        <text class="field-label">标题第二行</text>
        <input v-model="draft.titleLineTwo" class="input" maxlength="14" placeholder="输入首页标题第二行" />
      </label>

      <label class="field">
        <text class="field-label">宣传内容</text>
        <textarea v-model="draft.promotionalContent" class="textarea" maxlength="72" placeholder="输入首页宣传内容" />
      </label>

      <button class="primary" @tap="saveSettings">保存首页设置</button>
    </view>

    <view class="preview-panel">
      <view class="panel-head">
        <text class="section-title">预览</text>
        <text class="section-meta">未保存前只在本页预览</text>
      </view>
      <view class="preview-hero" :class="`tone-${preview.backgroundTone}`">
        <image v-if="preview.customBackgroundImage" class="preview-image" :src="preview.customBackgroundImage" mode="aspectFill" />
        <view class="preview-shade" />
        <view class="preview-copy">
          <text class="preview-kicker">NEW SEASON</text>
          <text class="preview-title">{{ preview.titleLineOne }}</text>
          <text class="preview-title">{{ preview.titleLineTwo }}</text>
          <text class="preview-desc">{{ preview.promotionalContent }}</text>
        </view>
      </view>
    </view>

    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import { routes, type AppRoute } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import {
  getHomepageSettingsView,
  homepageBackgroundOptions,
  previewHomepageSettings,
  saveHomepageSettings,
  type HomepageBackgroundTone,
  type HomepageSettingsInput,
} from '../../../features/homepage-settings/homepage-settings'

const navigatingRoute = ref<AppRoute | ''>('')
const message = ref('')
const isChoosingImage = ref(false)
const isLoadingSettings = ref(false)
const loadError = ref('')
const draft = reactive<HomepageSettingsInput>({
  backgroundTone: 'runway',
  customBackgroundImage: '',
  titleLineOne: '',
  titleLineTwo: '',
  promotionalContent: '',
})

const syncDraft = () => {
  const settings = getHomepageSettingsView()
  draft.backgroundTone = settings.backgroundTone
  draft.customBackgroundImage = settings.customBackgroundImage
  draft.titleLineOne = settings.titleLineOne
  draft.titleLineTwo = settings.titleLineTwo
  draft.promotionalContent = settings.promotionalContent
}

const getErrorMessage = (error: unknown) => (error instanceof Error && error.message.trim()
  ? error.message.trim()
  : '首页设置加载失败')

const refreshSettings = () => {
  isLoadingSettings.value = true
  loadError.value = ''
  try {
    syncDraft()
  } catch (error) {
    loadError.value = getErrorMessage(error)
    message.value = loadError.value
  } finally {
    isLoadingSettings.value = false
  }
}

const preview = computed(() => previewHomepageSettings(draft))

onShow(() => {
  if (!ensureAdminWorkbenchSession('homepageSettings')) {
    return
  }

  navigatingRoute.value = ''
  message.value = ''
  refreshSettings()
})

const selectTone = (tone: HomepageBackgroundTone) => {
  draft.backgroundTone = tone
}

const setCustomBackgroundImage = (imagePath: string) => {
  draft.customBackgroundImage = imagePath
  message.value = '自定义背景已保存为本地图片，保存设置后首页会读取这张图'
}

const persistCustomBackgroundImage = (tempFilePath: string) => {
  uni.saveFile({
    tempFilePath,
    success: (result) => {
      setCustomBackgroundImage(result.savedFilePath || tempFilePath)
    },
    fail: () => {
      setCustomBackgroundImage(tempFilePath)
    },
  })
}

const chooseCustomBackground = () => {
  if (isChoosingImage.value) {
    return
  }

  isChoosingImage.value = true
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const imagePath = result.tempFilePaths?.[0]

      if (!imagePath) {
        message.value = '未读取到图片，请重新选择'

        return
      }

      persistCustomBackgroundImage(imagePath)
    },
    fail: () => {
      message.value = '未选择图片'
    },
    complete: () => {
      isChoosingImage.value = false
    },
  })
}

const clearCustomBackground = () => {
  draft.customBackgroundImage = ''
  message.value = '已恢复为所选背景，保存后首页会清除自定义图'
}

const saveSettings = () => {
  const result = saveHomepageSettings(draft)
  message.value = result.message

  if (result.status === 'success') {
    syncDraft()
  }

  uni.showToast({
    title: result.message,
    icon: 'none',
    duration: 1600,
  })
}

const goMore = () => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = routes.ownerMore
  redirectTo(routes.ownerMore, {
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
  padding: 32rpx 32rpx calc(64rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
}

.topbar,
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.topbar {
  margin-bottom: 34rpx;
}

.brand,
.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.kicker,
.hero-label {
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 500;
}

.title {
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
}

.back-link,
.tone-pill,
.upload-button,
.clear-button,
.primary {
  margin: 0;
  border: 0;
}

.back-link::after,
.tone-pill::after,
.upload-button::after,
.clear-button::after,
.primary::after {
  border: 0;
}

.back-link {
  min-height: 60rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  line-height: 60rpx;
}

.hero,
.form-panel,
.preview-panel,
.result {
  box-sizing: border-box;
  border-radius: 32rpx;
}

.hero {
  margin-bottom: 24rpx;
  padding: 34rpx;
  background: #202020;
  color: #ffffff;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-desc {
  color: #d7d7d7;
  font-size: 24rpx;
  line-height: 1.55;
}

.form-panel,
.preview-panel,
.result {
  margin-bottom: 22rpx;
  padding: 28rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
}

.section-meta {
  color: #8a8a8a;
  font-size: 24rpx;
  line-height: 1.45;
  text-align: right;
}

.tone-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 24rpx;
}

.tone-pill {
  min-height: 68rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f0f0;
  color: #505050;
  font-size: 24rpx;
  line-height: 68rpx;
}

.tone-pill.active,
.primary {
  background: #202020;
  color: #ffffff;
}

.custom-background {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 24rpx;
  border: 1rpx solid #ececec;
  border-radius: 26rpx;
  background: #fafafa;
}

.custom-background-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.helper-text,
.image-status {
  color: #858585;
  font-size: 22rpx;
  line-height: 1.45;
}

.custom-background-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.upload-button,
.clear-button {
  min-height: 76rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  line-height: 76rpx;
}

.upload-button {
  background: #202020;
  color: #ffffff;
}

.upload-button[disabled] {
  opacity: 0.54;
}

.clear-button {
  background: #eeeeee;
  color: #303030;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
}

.field-label {
  font-size: 24rpx;
  font-weight: 600;
}

.input,
.textarea {
  box-sizing: border-box;
  width: 100%;
  border-radius: 24rpx;
  background: #f5f5f5;
  color: #202020;
  font-size: 28rpx;
}

.input {
  min-height: 88rpx;
  padding: 0 24rpx;
}

.textarea {
  min-height: 160rpx;
  padding: 22rpx 24rpx;
  line-height: 1.45;
}

.primary {
  width: 100%;
  min-height: 92rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.preview-hero {
  position: relative;
  min-height: 520rpx;
  margin-top: 24rpx;
  overflow: hidden;
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 54% 20%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(108deg, transparent 0 34%, rgba(5, 5, 5, 0.78) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 52% 70%, rgba(5, 5, 5, 0.78) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #cfcfcf, #fbfbfb 42%, #9d9d9d);
}

.preview-hero.tone-linen {
  background:
    radial-gradient(circle at 54% 20%, rgba(255, 255, 255, 0.92) 0 8%, transparent 8.4%),
    linear-gradient(108deg, transparent 0 34%, rgba(92, 82, 72, 0.72) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 52% 70%, rgba(118, 103, 89, 0.68) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #e8dfd4, #fffaf1 42%, #cdbfae);
}

.preview-hero.tone-noir {
  background:
    radial-gradient(circle at 54% 20%, rgba(244, 244, 244, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(108deg, transparent 0 34%, rgba(240, 240, 240, 0.68) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 52% 70%, rgba(245, 245, 245, 0.48) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #242424, #464646 42%, #111111);
}

.preview-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.preview-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 5, 0.04), rgba(5, 5, 5, 0.72));
}

.preview-copy {
  position: absolute;
  right: 28rpx;
  bottom: 30rpx;
  left: 28rpx;
  display: flex;
  flex-direction: column;
  color: #ffffff;
}

.preview-kicker {
  margin-bottom: 14rpx;
  font-size: 20rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
}

.preview-title {
  font-size: 62rpx;
  font-weight: 500;
  line-height: 1.05;
}

.preview-desc {
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 24rpx;
  line-height: 1.5;
}

.result {
  font-size: 26rpx;
}
</style>
