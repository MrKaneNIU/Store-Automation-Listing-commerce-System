<template>
  <view class="page">
    <text class="title">草稿确认</text>
    <text class="hint">按商品货号分组复核 OCR 结果。必填字段补齐后，才能确认并自动创建商品和 SKU。</text>

    <view v-if="viewModel.groups.length === 0" class="empty">{{ viewModel.emptyMessage }}</view>

    <view v-for="group in viewModel.groups" :key="group.productCode" class="group">
      <view class="group-header">
        <text class="group-title">{{ group.productCode }}</text>
        <text v-if="group.hasPriceConflict" class="warning">价格冲突</text>
      </view>

      <view v-for="draft in group.drafts" :key="draft.id" class="draft-card">
        <view class="badges">
          <text v-if="draft.isNeedsCompletion" class="badge danger">待补全</text>
          <text v-if="draft.isLowConfidence" class="badge warn">低置信度</text>
        </view>

        <label class="field">
          <text>商品货号</text>
          <input :value="draft.productCode" @input="handleTextInput(draft.id, 'productCode', $event)" />
        </label>
        <label class="field">
          <text>商品名称</text>
          <input :value="draft.productName" @input="handleTextInput(draft.id, 'productName', $event)" />
        </label>
        <label class="field">
          <text>销售价</text>
          <input
            type="digit"
            :value="String(draft.salePrice || '')"
            @input="handleNumberInput(draft.id, 'salePrice', $event)"
          />
        </label>
        <label class="field">
          <text>规格</text>
          <input :value="draft.spec" @input="handleTextInput(draft.id, 'spec', $event)" />
        </label>
        <label class="field">
          <text>库存</text>
          <input
            type="number"
            :value="String(draft.stock || '')"
            @input="handleNumberInput(draft.id, 'stock', $event)"
          />
        </label>

        <button class="delete" size="mini" @tap="deleteDraft(draft.id)">删除草稿</button>
      </view>
    </view>

    <button class="primary" :disabled="!viewModel.canConfirm" @tap="confirmLatestBatch">批量确认并创建商品 SKU</button>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  type OwnerDraftReviewEditableField,
  type OwnerDraftReviewViewModel,
} from '../../../features/owner-draft-review/owner-draft-review'
import {
  confirmLatestCloudBaseOwnerDraftReviewBatch,
  deleteCloudBaseOwnerDraftReviewDraft,
  getCloudBaseOwnerDraftReviewView,
  updateCloudBaseOwnerDraftReviewDraft,
} from '../../../features/cloudbase-mall/owner-draft-review'

const message = ref('')
const viewModel = ref<OwnerDraftReviewViewModel>({
  latestBatchId: null,
  groups: [],
  needsCompletionCount: 0,
  lowConfidenceCount: 0,
  priceConflictCount: 0,
  canConfirm: false,
  emptyMessage: '暂无草稿，请先完成截图识别',
})

const refreshView = async () => {
  viewModel.value = await getCloudBaseOwnerDraftReviewView()
}

onShow(() => {
  void refreshView()
})

const getInputValue = (event: Event) => {
  const detail = (event as Event & { detail?: { value?: string | number } }).detail
  return String(detail?.value ?? '')
}

const updateDraft = async (draftId: string, field: OwnerDraftReviewEditableField, value: string | number) => {
  const result = await updateCloudBaseOwnerDraftReviewDraft(draftId, field, value)
  message.value = result.message
  await refreshView()
}

const handleTextInput = (draftId: string, field: OwnerDraftReviewEditableField, event: Event) => {
  void updateDraft(draftId, field, getInputValue(event))
}

const handleNumberInput = (draftId: string, field: OwnerDraftReviewEditableField, event: Event) => {
  void updateDraft(draftId, field, Number(getInputValue(event) || 0))
}

const deleteDraft = async (draftId: string) => {
  const result = await deleteCloudBaseOwnerDraftReviewDraft(draftId)
  message.value = result.message
  await refreshView()
}

const confirmLatestBatch = async () => {
  const result = await confirmLatestCloudBaseOwnerDraftReviewBatch(viewModel.value.latestBatchId)
  message.value = result.message
  await refreshView()
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

.hint,
.empty {
  display: block;
  margin-bottom: 28rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #576071;
}

.group {
  margin-bottom: 28rpx;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.group-title {
  font-size: 32rpx;
  font-weight: 700;
}

.warning {
  color: #c2410c;
}

.draft-card,
.result {
  margin-bottom: 18rpx;
  padding: 22rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.badges {
  display: flex;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.badge {
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  border-radius: 6rpx;
}

.danger {
  color: #b42318;
  background: #fee4e2;
}

.warn {
  color: #92400e;
  background: #fef3c7;
}

.field {
  display: grid;
  grid-template-columns: 150rpx 1fr;
  align-items: center;
  min-height: 72rpx;
  border-bottom: 1rpx solid #eef0f3;
}

.field text {
  color: #576071;
}

.field input {
  min-height: 64rpx;
}

.delete {
  margin-top: 18rpx;
}

.primary {
  margin-top: 12rpx;
  color: #ffffff;
  background: #0f62fe;
}
</style>
