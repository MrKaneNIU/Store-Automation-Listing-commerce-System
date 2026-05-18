# 高端女装商城真实小程序迁移模块 J 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 J：草稿确认页真实视觉迁移。

模块 J 的目标是将 `src/pages/owner/draft-review/index.vue` 迁移为高定商城卡片式草稿确认页，同时保留字段编辑、删除草稿、批量确认、待补全提示、低置信度提示、价格冲突提示，以及现有商品和 SKU 创建规则。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/draft-review/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-j-log.md
```

### 1.2 本模块明确不影响

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
src/pages.json
package.json
pnpm-lock.yaml
```

### 1.3 必须保留的调用

```text
getCloudBaseOwnerDraftReviewView()
updateCloudBaseOwnerDraftReviewDraft(...)
deleteCloudBaseOwnerDraftReviewDraft(...)
confirmLatestCloudBaseOwnerDraftReviewBatch(...)
```

## 2. 实施内容

1. 将草稿确认页从基础表单列表迁移为高定商城卡片式复核页：顶部批次栏、OCR 复核 hero、风险摘要、按货号分组、草稿卡片、固定底部确认动作。
2. 保留现有 `viewModel.groups`、`latestBatchId`、`needsCompletionCount`、`lowConfidenceCount`、`priceConflictCount`、`canConfirm` 数据来源。
3. 保留商品货号、商品名称、销售价、规格、库存五个现有可编辑字段。
4. 保留销售价 `type="digit"`、库存 `type="number"` 输入类型。
5. 保留删除草稿动作和批量确认动作，不新增商品字段、不新增 SKU 规则。
6. 页面不直接写 repository、mockDb 或 CloudBase 集合。

## 3. 保留业务合同

1. 草稿按商品货号分组展示。
2. 待补全、低置信度、价格冲突提示仍可见。
3. 字段编辑仍走 `updateCloudBaseOwnerDraftReviewDraft(...)`。
4. 删除草稿仍走 `deleteCloudBaseOwnerDraftReviewDraft(...)`。
5. 批量确认仍走 `confirmLatestCloudBaseOwnerDraftReviewBatch(...)`。
6. 商品与 SKU 创建规则未在页面层修改。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 必填字段和输入类型不弱化 | 保留商品货号、商品名称、销售价、规格、库存；销售价仍为 `digit`，库存仍为 `number` |
| 待补全提示仍可见 | 保留 `draft.isNeedsCompletion` 对应的 `待补全` 标记 |
| 低置信度提示仍可见 | 保留 `draft.isLowConfidence` 对应的 `低置信度` 标记 |
| 价格冲突提示仍可见 | 保留 `group.hasPriceConflict` 对应的 `价格冲突` 标记 |
| 批量确认链路不变 | 保留 `confirmLatestCloudBaseOwnerDraftReviewBatch(viewModel.value.latestBatchId)` |
| `pnpm.cmd run verify` | 2026-05-18 本轮复验通过：lint、boundary-check、frontend/cloudfunction 测试 29 files / 120 tests、coverage、type-check、backend 测试 12 files / 46 tests、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 2026-05-18 本轮复验通过：包含 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`；smoke 输出 `E2E smoke passed: mp-weixin build artifacts and page routes are present.` |
| 受保护业务路径 diff | 已通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml` 输出为空；`src/pages.json` 存在前序视觉模块的 `navigationStyle: custom` 变更，本模块未新增修改 |
| 编译产物抽查 | 已通过：`dist/build/mp-weixin/pages/owner/draft-review/index.wxml` 包含 `草稿确认`、`DRAFT REVIEW`、`OCR REVIEW`、`待补全`、`低置信度`、`价格冲突`、`商品货号`、`商品名称`、`销售价`、`规格`、`库存`、`删除草稿`、`批量确认`；`index.wxss` 包含 `summary-grid`、`draft-card`、`field-grid`、`bottom-action`、`primary`、`badge`、`danger`、`warn`、`border-radius` |

## 5. 下一步

模块 J 已完成代码验证。等待用户人工验收模块 J。用户验收通过前，不进入模块 K。
