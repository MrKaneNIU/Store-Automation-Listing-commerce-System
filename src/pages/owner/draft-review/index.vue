<template>
  <view class="page">
    <text class="title">草稿确认</text>
    <text class="hint">按商品货号分组复核 OCR 结果。必填字段补齐后，才能确认并自动创建商品和 SKU。</text>

    <view v-if="groups.length === 0" class="empty">暂无草稿，请先完成截图识别</view>

    <view v-for="group in groups" :key="group.productCode" class="group">
      <view class="group-header">
        <text class="group-title">{{ group.productCode }}</text>
        <text v-if="priceConflictCodes.has(group.productCode)" class="warning">价格冲突</text>
      </view>

      <view v-for="draft in group.drafts" :key="draft.id" class="draft-card">
        <view class="badges">
          <text v-if="draft.status === 'needs_completion'" class="badge danger">待补全</text>
          <text v-if="draft.confidence < 0.8" class="badge warn">低置信度</text>
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

    <button class="primary" :disabled="groups.length === 0" @tap="confirmLatestBatch">批量确认并创建商品/SKU</button>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { mallWorkflow } from '../../../features/mall-workflow/mall-workflow'
import { mallAccess } from '../../../features/mall-workflow/mall-access'
import { findPriceConflictCodes, groupDraftsByProductCode } from '../../../features/draft-review/draft-review'
import type { ProductDraft } from '../../../domain/draft/types'

const version = ref(0)
const message = ref('')

onShow(() => {
  version.value += 1
})

const latestBatch = computed(() => {
  version.value
  return mallAccess.getLatestBatch()
})

const drafts = computed(() => {
  version.value
  return latestBatch.value ? mallAccess.listDrafts(latestBatch.value.id) : []
})

const groups = computed(() => groupDraftsByProductCode(drafts.value))
const priceConflictCodes = computed(() => findPriceConflictCodes(drafts.value))

const persistDrafts = (nextDrafts: ProductDraft[]) => {
  if (!latestBatch.value) return
  mallAccess.replaceDrafts(latestBatch.value.id, nextDrafts)
  version.value += 1
}

const updateDraft = (draftId: string, field: keyof ProductDraft, value: string | number) => {
  const nextDrafts = drafts.value.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft))
  persistDrafts(nextDrafts)
}

const getInputValue = (event: Event) => {
  const detail = (event as Event & { detail?: { value?: string | number } }).detail
  return String(detail?.value ?? '')
}

const handleTextInput = (draftId: string, field: keyof ProductDraft, event: Event) => {
  updateDraft(draftId, field, getInputValue(event))
}

const handleNumberInput = (draftId: string, field: keyof ProductDraft, event: Event) => {
  updateDraft(draftId, field, Number(getInputValue(event) || 0))
}

const deleteDraft = (draftId: string) => {
  const nextDrafts = drafts.value.map((draft) => (draft.id === draftId ? { ...draft, status: 'deleted' as const } : draft))
  persistDrafts(nextDrafts)
}

const confirmLatestBatch = () => {
  if (!latestBatch.value) {
    message.value = '暂无 OCR 批次，请先生成草稿'
    return
  }

  const result = mallWorkflow.confirmBatch(latestBatch.value.id)
  version.value += 1
  if (result.issues.length > 0) {
    message.value = `存在 ${result.issues.length} 个必填字段问题，请先补齐草稿`
    return
  }

  message.value = `已创建 ${result.products.length} 个商品、${result.skus.length} 个 SKU`
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
