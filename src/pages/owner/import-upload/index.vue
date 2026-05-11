<template>
  <view class="page">
    <text class="title">截图识别</text>
    <text class="hint">上传已填写内容的云 e 宝商品页、规格页或弹窗截图。当前使用 Mock OCR 跑通流程。</text>

    <view class="actions">
      <button @tap="chooseScreenshots">选择截图</button>
      <button class="primary" :disabled="screenshots.length === 0 || isRecognizing" @tap="startRecognize">
        {{ isRecognizing ? '识别中...' : '开始识别' }}
      </button>
    </view>

    <view v-if="screenshots.length > 0" class="image-grid">
      <view v-for="image in screenshots" :key="image.id" class="image-card">
        <image class="image" :src="image.url" mode="aspectFill" />
        <text class="image-name">{{ image.name }}</text>
        <button size="mini" @tap="removeScreenshot(image.id)">删除</button>
      </view>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view v-if="drafts.length > 0" class="draft-list">
      <view v-for="draft in drafts" :key="draft.id" class="draft-card">
        <text class="draft-title">{{ draft.productCode || '缺少货号' }} {{ draft.productName }}</text>
        <text>销售价：{{ draft.salePrice || '待补全' }}</text>
        <text>规格：{{ draft.spec || '待补全' }}</text>
        <text>状态：{{ draft.status }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadedImage } from '../../../domain/batch/types'
import type { ProductDraft } from '../../../domain/draft/types'
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
  padding: 32rpx;
  background: #f6f7f9;
}

.title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.hint {
  display: block;
  margin-bottom: 28rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #576071;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.primary {
  color: #ffffff;
  background: #0f62fe;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.image-card,
.draft-card,
.result {
  padding: 20rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.image {
  width: 100%;
  height: 220rpx;
  margin-bottom: 12rpx;
  border-radius: 8rpx;
  background: #eef0f3;
}

.image-name,
.draft-title {
  display: block;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 28rpx;
}

.draft-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
</style>
