<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">DRAFT REVIEW</text>
        <text class="title">草稿确认</text>
      </view>
      <text class="batch">批次 {{ viewModel.latestBatchId || '待生成' }}</text>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">OCR REVIEW</text>
        <text class="hero-title">{{ draftCount }} 条草稿</text>
        <text class="hero-desc">按商品货号分组复核 OCR 结果。必填字段补齐后，继续通过现有规则创建商品和 SKU。</text>
      </view>
      <view class="hero-meter" :class="{ ready: viewModel.canConfirm }">
        <text class="meter-number">{{ viewModel.canConfirm ? 'READY' : 'CHECK' }}</text>
        <text class="meter-label">{{ viewModel.canConfirm ? '可确认' : '待复核' }}</text>
      </view>
    </view>

    <view class="summary-grid">
      <view class="summary-card">
        <text class="summary-value">{{ viewModel.groups.length }}</text>
        <text class="summary-label">货号组</text>
      </view>
      <view class="summary-card">
        <text class="summary-value">{{ viewModel.needsCompletionCount }}</text>
        <text class="summary-label">待补全</text>
      </view>
      <view class="summary-card">
        <text class="summary-value">{{ viewModel.lowConfidenceCount }}</text>
        <text class="summary-label">低置信度</text>
      </view>
      <view class="summary-card">
        <text class="summary-value">{{ viewModel.priceConflictCount }}</text>
        <text class="summary-label">价格冲突</text>
      </view>
    </view>

    <view v-if="isLoading" class="review-loading">
      <view class="loading-card shimmer">
        <text />
        <text />
        <text />
      </view>
      <view class="loading-card shimmer compact">
        <text />
        <text />
      </view>
    </view>

    <view v-else-if="viewModel.groups.length === 0" class="empty-state">
      <text class="empty-title">暂无待确认草稿</text>
      <text class="empty-copy">{{ viewModel.emptyMessage }}</text>
    </view>

    <template v-else>
      <view v-for="group in viewModel.groups" :key="group.productCode" class="group">
        <view class="group-header">
          <view class="group-copy">
            <text class="group-kicker">PRODUCT CODE</text>
            <text class="group-title">{{ group.productCode }}</text>
          </view>
          <view class="group-meta">
            <text class="group-count">{{ group.drafts.length }} 条</text>
            <text v-if="group.hasPriceConflict" class="warning">价格冲突</text>
          </view>
        </view>

        <view v-for="draft in group.drafts" :key="draft.id" class="draft-card">
          <view class="draft-top">
            <view class="draft-heading">
              <text class="draft-code">{{ draft.productCode || '缺少货号' }}</text>
              <text class="draft-name">{{ draft.productName || '待填写商品名称' }}</text>
            </view>
            <view class="badges">
              <text v-if="draft.isNeedsCompletion" class="badge danger">待补全</text>
              <text v-if="draft.isLowConfidence && !draft.isLowConfidenceResolved" class="badge warn">低置信度</text>
              <text v-if="draft.isManuallyCorrected" class="badge clean">人工校正</text>
              <text v-if="draft.isAccepted" class="badge clean">明确接受</text>
              <text v-if="!draft.isNeedsCompletion && (draft.isLowConfidenceResolved || !draft.isLowConfidence)" class="badge clean">已就绪</text>
            </view>
          </view>

          <view class="draft-quality">
            <text>货号 {{ draft.fieldConfidenceLabels.productCode || '-' }} · {{ draft.fieldSourceLabels.productCode || 'ocr' }}</text>
            <text>名称 {{ draft.fieldConfidenceLabels.productName || '-' }} · {{ draft.fieldSourceLabels.productName || 'ocr' }}</text>
            <text>售价 {{ draft.fieldConfidenceLabels.salePrice || '-' }} · {{ draft.fieldSourceLabels.salePrice || 'ocr' }}</text>
            <text>规格 {{ draft.fieldConfidenceLabels.spec || '-' }} · {{ draft.fieldSourceLabels.spec || 'ocr' }}</text>
          </view>

          <view class="field-grid">
            <label class="field">
              <text class="field-label">商品货号</text>
              <input :value="draft.productCode" @input="handleTextInput(draft.id, 'productCode', $event)" />
            </label>
            <label class="field">
              <text class="field-label">商品名称</text>
              <input :value="draft.productName" @input="handleTextInput(draft.id, 'productName', $event)" />
            </label>
            <label class="field">
              <text class="field-label">销售价</text>
              <input type="digit" :value="String(draft.salePrice || '')" @input="handleNumberInput(draft.id, 'salePrice', $event)" />
            </label>
            <label class="field">
              <text class="field-label">规格</text>
              <input :value="draft.spec" @input="handleTextInput(draft.id, 'spec', $event)" />
            </label>
            <label class="field">
              <text class="field-label">库存</text>
              <input type="number" :value="String(draft.stock || '')" @input="handleNumberInput(draft.id, 'stock', $event)" />
            </label>
          </view>

          <view class="draft-actions">
            <button class="accept" :disabled="Boolean(deletingDraftId) || isConfirmingBatch" hover-class="press-feedback" size="mini" @tap="acceptDraft(draft.id)">
              明确接受
            </button>
            <button
              class="delete"
              :class="{ busy: deletingDraftId === draft.id }"
              :disabled="Boolean(deletingDraftId) || isConfirmingBatch"
              hover-class="press-feedback"
              size="mini"
              @tap="deleteDraft(draft.id)"
            >
              {{ deletingDraftId === draft.id ? '删除中...' : '删除草稿' }}
            </button>
          </view>
        </view>
      </view>
    </template>

    <view v-if="message" class="result">{{ message }}</view>

    <view class="bottom-action">
      <button
        class="primary"
        :class="{ busy: isConfirmingBatch }"
        :disabled="!viewModel.canConfirm || isConfirmingBatch || Boolean(deletingDraftId)"
        hover-class="press-feedback"
        @tap="confirmLatestBatch"
      >
        {{ isConfirmingBatch ? '确认中...' : '批量确认并创建商品 SKU' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import {
  type OwnerDraftReviewEditableField,
  type OwnerDraftReviewViewModel,
} from '../../../features/owner-draft-review/owner-draft-review'
import {
  acceptCloudBaseOwnerDraftReviewDraft,
  confirmLatestCloudBaseOwnerDraftReviewBatch,
  deleteCloudBaseOwnerDraftReviewDraft,
  getCloudBaseOwnerDraftReviewView,
  updateCloudBaseOwnerDraftReviewDraft,
} from '../../../features/cloudbase-mall/owner-draft-review'

const message = ref('')
const isLoading = ref(false)
const deletingDraftId = ref('')
const isConfirmingBatch = ref(false)
const isNavigatingToImageTasks = ref(false)
let pendingRefresh: Promise<void> | null = null
const viewModel = ref<OwnerDraftReviewViewModel>({
  latestBatchId: null,
  groups: [],
  needsCompletionCount: 0,
  lowConfidenceCount: 0,
  priceConflictCount: 0,
  canConfirm: false,
  emptyMessage: '暂无草稿，请先完成截图识别',
})

const draftCount = computed(() => viewModel.value.groups.reduce((total, group) => total + group.drafts.length, 0))

type RefreshOptions = {
  showLoading: boolean
}

const refreshView = (options: RefreshOptions = { showLoading: true }) => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  if (options.showLoading) {
    isLoading.value = true
  }

  pendingRefresh = getCloudBaseOwnerDraftReviewView()
    .then((view) => {
      viewModel.value = view
    })
    .finally(() => {
      if (options.showLoading) {
        isLoading.value = false
      }

      pendingRefresh = null
    })

  return pendingRefresh
}

onShow(() => {
  if (!ensureAdminWorkbenchSession('productManagement')) {
    return
  }

  void refreshView()
})

const getInputValue = (event: Event) => {
  const detail = (event as Event & { detail?: { value?: string | number } }).detail
  return String(detail?.value ?? '')
}

const updateDraft = async (draftId: string, field: OwnerDraftReviewEditableField, value: string | number) => {
  const result = await updateCloudBaseOwnerDraftReviewDraft(draftId, field, value)
  message.value = result.message
  await refreshView({ showLoading: false })
}

const handleTextInput = (draftId: string, field: OwnerDraftReviewEditableField, event: Event) => {
  void updateDraft(draftId, field, getInputValue(event))
}

const handleNumberInput = (draftId: string, field: OwnerDraftReviewEditableField, event: Event) => {
  void updateDraft(draftId, field, Number(getInputValue(event) || 0))
}

const acceptDraft = async (draftId: string) => {
  if (deletingDraftId.value || isConfirmingBatch.value) {
    return
  }

  deletingDraftId.value = draftId
  try {
    const result = await acceptCloudBaseOwnerDraftReviewDraft(draftId)
    message.value = result.message
    await refreshView({ showLoading: false })
  } finally {
    deletingDraftId.value = ''
  }
}

const deleteDraft = async (draftId: string) => {
  if (deletingDraftId.value || isConfirmingBatch.value) {
    return
  }

  deletingDraftId.value = draftId

  try {
    const result = await deleteCloudBaseOwnerDraftReviewDraft(draftId)
    message.value = result.message
    await refreshView({ showLoading: false })
  } finally {
    deletingDraftId.value = ''
  }
}

const confirmLatestBatch = async () => {
  if (isConfirmingBatch.value || deletingDraftId.value || isNavigatingToImageTasks.value) {
    return
  }

  isConfirmingBatch.value = true

  try {
    const result = await confirmLatestCloudBaseOwnerDraftReviewBatch(viewModel.value.latestBatchId)
    message.value = result.message
    await refreshView({ showLoading: false })

    if ((result.createdProductCount ?? 0) > 0 || result.nextAction === 'supplementImages') {
      goStaffImageTasks()
    }
  } finally {
    isConfirmingBatch.value = false
  }
}

const goStaffImageTasks = () => {
  if (isNavigatingToImageTasks.value) {
    return
  }

  isNavigatingToImageTasks.value = true
  navigateTo(routes.staffImageTasks, {
    onComplete: () => {
      isNavigatingToImageTasks.value = false
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 32rpx calc(156rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #222222;
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

.kicker,
.hero-label,
.group-kicker {
  color: #9a9a9a;
  font-size: 22rpx;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.2;
}

.title {
  display: block;
  color: #222222;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.batch {
  flex: 0 1 auto;
  max-width: 320rpx;
  overflow: hidden;
  padding: 16rpx 24rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 999rpx;
  background: #ffffff;
  color: #686868;
  font-size: 23rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 22rpx;
  margin-bottom: 24rpx;
  padding: 34rpx;
  border-radius: 30rpx;
  background: #050505;
  box-shadow: 0 22rpx 48rpx rgba(0, 0, 0, 0.08);
}

.hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14rpx;
  min-width: 0;
}

.hero-title {
  display: block;
  color: #ffffff;
  font-size: 46rpx;
  font-weight: 600;
  line-height: 1.12;
}

.hero-desc {
  display: block;
  max-width: 460rpx;
  color: rgba(255, 255, 255, 0.66);
  font-size: 25rpx;
  line-height: 1.55;
}

.hero-meter {
  display: flex;
  flex: 0 0 150rpx;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
  min-height: 150rpx;
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.08);
  text-align: center;
}

.hero-meter.ready {
  background: rgba(47, 168, 92, 0.22);
}

.meter-number {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.1;
}

.meter-label {
  color: rgba(255, 255, 255, 0.62);
  font-size: 23rpx;
  line-height: 1.2;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 34rpx;
}

.summary-card {
  min-width: 0;
  padding: 22rpx 12rpx;
  border: 1rpx solid #eeeeee;
  border-radius: 24rpx;
  background: #ffffff;
  text-align: center;
}

.summary-value {
  display: block;
  color: #222222;
  font-size: 34rpx;
  font-weight: 650;
  line-height: 1.1;
}

.summary-label {
  display: block;
  margin-top: 10rpx;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-bottom: 32rpx;
  padding: 42rpx 34rpx;
  border: 1rpx dashed #d8d8d8;
  border-radius: 30rpx;
  background: #ffffff;
}

.review-loading {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-bottom: 32rpx;
}

.loading-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  box-sizing: border-box;
  min-height: 190rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.04);
}

.loading-card.compact {
  min-height: 122rpx;
}

.loading-card text {
  display: block;
  height: 22rpx;
  border-radius: 999rpx;
  background: #eeeeee;
}

.loading-card text:first-child {
  width: 44%;
}

.loading-card text:nth-child(2) {
  width: 82%;
}

.loading-card text:nth-child(3) {
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.62), transparent);
  content: '';
  transform: translateX(0);
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}

.empty-title {
  color: #222222;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.2;
}

.empty-copy {
  color: #8a8a8a;
  font-size: 26rpx;
  line-height: 1.5;
}

.group {
  margin-bottom: 40rpx;
}

.group-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 22rpx;
  margin-bottom: 18rpx;
}

.group-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.group-title {
  overflow: hidden;
  color: #222222;
  font-size: 34rpx;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10rpx;
}

.group-count,
.warning {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.group-count {
  background: #ffffff;
  color: #8a8a8a;
}

.warning {
  background: rgba(227, 50, 42, 0.1);
  color: #e3322a;
}

.draft-card,
.result {
  margin-bottom: 18rpx;
  padding: 28rpx;
  border: 1rpx solid #eeeeee;
  background: #ffffff;
  border-radius: 28rpx;
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.04);
}

.draft-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.draft-heading {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.draft-code {
  color: #686868;
  font-size: 23rpx;
  font-weight: 600;
  line-height: 1.2;
}

.draft-name {
  display: block;
  overflow: hidden;
  color: #222222;
  font-size: 31rpx;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badges {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12rpx;
  max-width: 240rpx;
}

.badge {
  padding: 8rpx 14rpx;
  font-size: 22rpx;
  line-height: 1.2;
  border-radius: 999rpx;
  white-space: nowrap;
}

.danger {
  color: #e3322a;
  background: rgba(227, 50, 42, 0.1);
}

.warn {
  color: #8b5a00;
  background: rgba(139, 90, 0, 0.12);
}

.clean {
  color: #2fa85c;
  background: rgba(47, 168, 92, 0.12);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 22rpx;
  background: #fbfbfb;
}

.field-label {
  color: #8a8a8a;
  font-size: 22rpx;
  line-height: 1.2;
}

.field input {
  min-height: 58rpx;
  color: #222222;
  font-size: 28rpx;
  line-height: 1.3;
}

.draft-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 22rpx;
}

.delete,
.accept {
  min-height: 64rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
  line-height: 64rpx;
  transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease;
}

.delete {
  background: #f5f5f5;
  color: #686868;
}

.accept {
  background: rgba(47, 168, 92, 0.12);
  color: #2fa85c;
}

.result {
  color: #686868;
  font-size: 26rpx;
  line-height: 1.5;
}

.bottom-action {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  padding: 22rpx 32rpx calc(22rpx + env(safe-area-inset-bottom));
  background: rgba(248, 248, 248, 0.94);
}

.primary {
  min-height: 96rpx;
  margin: 0;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 96rpx;
  color: #ffffff;
  background: #050505;
  transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease;
}

.primary[disabled] {
  background: #d8d8d8;
  color: #ffffff;
}

.busy {
  opacity: 0.66;
  transform: scale(0.98);
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

@media (max-width: 390px) {
  .hero {
    flex-direction: column;
  }

  .hero-meter {
    flex-basis: auto;
    min-height: 112rpx;
  }

  .summary-grid,
  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
