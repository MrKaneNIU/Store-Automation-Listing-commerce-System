<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">IMAGE INTAKE</text>
        <text class="title">截图识别</text>
      </view>
      <button class="shop-link" @tap="navigateTo(routes.customerProductList)">商城</button>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">OCR BATCH</text>
        <text class="hero-title">{{ screenshots.length }} / 9 张截图</text>
        <text class="hero-desc">选择云 e 宝商品页、规格页或弹窗截图，识别后继续生成草稿，不直接创建商品。</text>
      </view>
      <view class="hero-meter">
        <text class="meter-number">{{ drafts.length }}</text>
        <text class="meter-label">drafts</text>
      </view>
    </view>

    <view class="upload-panel">
      <view class="upload-copy">
        <text class="panel-title">上传素材</text>
        <text class="panel-desc">当前仍使用现有上传服务与 CloudBase OCR 批次入口。</text>
      </view>
      <view class="actions">
        <button class="secondary" @tap="chooseScreenshots">选择截图</button>
        <button class="primary" :disabled="screenshots.length === 0 || isRecognizing" @tap="startRecognize">
          {{ isRecognizing ? '识别中...' : '开始识别' }}
        </button>
      </view>
    </view>

    <view v-if="screenshots.length > 0" class="image-grid">
      <view v-for="image in screenshots" :key="image.id" class="image-card">
        <view class="image-shell">
          <image class="image" :src="image.url" mode="aspectFill" />
          <text class="image-index">{{ image.name }}</text>
        </view>
        <view class="image-foot">
          <text class="image-name">{{ image.name }}</text>
          <button class="remove-button" @tap="removeScreenshot(image.id)">删除</button>
        </view>
      </view>
    </view>
    <view v-else class="empty-state">
      <text class="empty-title">等待选择截图</text>
      <text class="empty-copy">最多一次选择 9 张，上传链路和识别入口保持现有实现。</text>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view v-if="drafts.length > 0" class="draft-list">
      <view class="draft-head">
        <text class="section-title">识别草稿</text>
        <text class="section-meta">{{ drafts.length }} 条</text>
      </view>
      <view v-for="draft in drafts" :key="draft.id" class="draft-card">
        <view class="draft-top">
          <text class="draft-code">{{ draft.productCode || '缺少货号' }}</text>
          <text class="draft-status">{{ draft.status }}</text>
        </view>
        <text class="draft-title">{{ draft.productName }}</text>
        <view class="draft-fields">
          <text class="draft-field">销售价：{{ draft.salePrice || '待补全' }}</text>
          <text class="draft-field">规格：{{ draft.spec || '待补全' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadedImage } from '../../../domain/batch/types'
import type { ProductDraft } from '../../../domain/draft/types'
import { navigateTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { removeOwnerScreenshotDescriptor } from '../../../features/owner-screenshot-import/owner-screenshot-import'
import { startCloudBaseOwnerScreenshotRecognition } from '../../../features/cloudbase-mall/owner-screenshot-import'
import { formatUploadFailureMessage, uploadService } from '../../../services/storage/runtime-upload-service'

const screenshots = ref<UploadedImage[]>([])
const drafts = ref<ProductDraft[]>([])
const message = ref('')
const isRecognizing = ref(false)

const chooseScreenshots = () => {
  void (async () => {
    try {
      const selected = await uploadService.chooseImages({
        businessType: 'ocr_screenshot',
        sourceRole: 'owner',
        entityType: 'ocr_batch',
        count: 9,
      })
      screenshots.value = [...screenshots.value, ...selected]
      message.value = ''
    } catch (error) {
      message.value = formatUploadFailureMessage(error)
    }
  })()
}

const removeScreenshot = (imageId: string) => {
  screenshots.value = removeOwnerScreenshotDescriptor(screenshots.value, imageId)
}

const startRecognize = async () => {
  if (screenshots.value.length === 0) {
    message.value = '请先选择至少一张截图'
    return
  }

  isRecognizing.value = true
  try {
    const result = await startCloudBaseOwnerScreenshotRecognition(screenshots.value)
    drafts.value = result.drafts
    message.value = result.message
  } catch (error) {
    drafts.value = []
    message.value = error instanceof Error ? error.message : '截图识别失败，请查看 Console 错误信息'
  } finally {
    isRecognizing.value = false
  }
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

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 34rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
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
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.shop-link {
  flex: 0 0 auto;
  min-width: 112rpx;
  min-height: 60rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
  box-shadow: 0 12rpx 30rpx rgba(12, 12, 12, 0.06);
}

.shop-link::after,
.primary::after,
.secondary::after,
.remove-button::after {
  border: 0;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168rpx;
  gap: 24rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
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

.hero-meter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  min-width: 0;
}

.meter-number {
  font-size: 60rpx;
  font-weight: 600;
  line-height: 1;
}

.meter-label {
  color: #b8b8b8;
  font-size: 20rpx;
  line-height: 1.2;
  text-align: right;
}

.upload-panel,
.empty-state,
.draft-card,
.result {
  box-sizing: border-box;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.upload-panel {
  margin-bottom: 26rpx;
  padding: 30rpx;
}

.upload-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.panel-title {
  color: #202020;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.25;
}

.panel-desc {
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.45;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.primary,
.secondary,
.remove-button {
  min-width: 0;
  min-height: 68rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 68rpx;
}

.primary {
  color: #ffffff;
  background: #202020;
}

.primary[disabled] {
  background: #e8e8e8;
  color: #9a9a9a;
}

.secondary,
.remove-button {
  color: #707070;
  background: #f4f4f4;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 26rpx;
}

.image-card {
  min-width: 0;
}

.image-shell {
  position: relative;
  width: 100%;
  height: 246rpx;
  margin-bottom: 14rpx;
  overflow: hidden;
  border-radius: 28rpx;
  background: #f0f0f0;
  box-shadow: 0 18rpx 44rpx rgba(5, 5, 5, 0.06);
}

.image {
  width: 100%;
  height: 100%;
}

.image-index {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  max-width: 210rpx;
  box-sizing: border-box;
  padding: 10rpx 16rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #202020;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.image-name {
  min-width: 0;
  overflow: hidden;
  color: #202020;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-button {
  flex: 0 0 auto;
  min-height: 56rpx;
  padding: 0 20rpx;
  font-size: 22rpx;
  line-height: 56rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-height: 320rpx;
  margin-bottom: 26rpx;
  padding: 48rpx 40rpx;
}

.empty-title {
  color: #202020;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-copy {
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.5;
}

.result {
  display: block;
  margin-bottom: 26rpx;
  padding: 24rpx 28rpx;
  color: #202020;
  font-size: 26rpx;
  line-height: 1.45;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.section-title {
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.3;
}

.section-meta {
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.3;
}

.draft-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 26rpx;
}

.draft-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.draft-code {
  min-width: 0;
  overflow: hidden;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-status {
  flex: 0 0 auto;
  max-width: 160rpx;
  box-sizing: border-box;
  padding: 10rpx 16rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #202020;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-title {
  display: -webkit-box;
  overflow: hidden;
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.draft-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f7f7f7;
}

.draft-field {
  color: #707070;
  font-size: 24rpx;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>
