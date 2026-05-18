# 高端女装商城真实小程序迁移模块 K 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 K：店员补图页真实视觉迁移。

模块 K 的目标是将 `src/pages/staff/image-tasks/index.vue` 迁移为高定商城卡片式补图任务页，同时保留关键词搜索、批次筛选、待补图商品列表、上传补图动作，并确保店员不进入 OCR 草稿确认流程，不新增商品编辑或发布能力。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/staff/image-tasks/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-k-log.md
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
getCloudBaseStaffImageTasksView(...)
supplementCloudBaseStaffProductImages(...)
```

## 2. 实施内容

1. 将店员补图页从基础列表迁移为高定商城卡片式任务页：顶部任务栏、补图 hero、关键词搜索、批次筛选、补图任务卡、无图占位、空状态和结果反馈。
2. 保留 `keyword`、`selectedBatchId`、`viewModel.batchOptions`、`viewModel.selectedBatchLabel`、`viewModel.products` 的现有数据来源。
3. 保留关键词搜索输入和批次 picker 筛选。
4. 保留每个待补图商品的上传补图按钮，继续调用 `supplementCloudBaseStaffProductImages(productId)`。
5. 页面不新增 OCR 草稿确认入口，不新增商品编辑入口，不新增商品发布入口。
6. 页面不直接写 repository、mockDb 或 CloudBase 集合。

## 3. 保留业务合同

1. 补图任务查询仍走 `getCloudBaseStaffImageTasksView({ keyword, selectedBatchId })`。
2. 补图动作仍走 `supplementCloudBaseStaffProductImages(productId)`。
3. 店员只处理已创建商品的补图任务。
4. 不改变补图任务 ViewModel、CloudBase facade 或上传规则。
5. 不新增店员商品编辑或发布能力。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 关键词搜索不变 | 保留 `v-model="keyword"` 与 `watch([keyword, selectedBatchId], ...)` |
| 批次筛选不变 | 保留 `picker`、`viewModel.batchOptions`、`selectBatch(...)` |
| 补图任务查询不变 | 保留 `getCloudBaseStaffImageTasksView({ keyword, selectedBatchId })` |
| 补图动作不变 | 保留 `supplementCloudBaseStaffProductImages(productId)` |
| 店员不进入 OCR 草稿确认流程 | 页面未新增草稿确认入口或导航 |
| 不新增商品编辑或发布能力 | 页面未新增编辑、发布调用 |
| `pnpm.cmd run verify` | 2026-05-18 本轮复验通过：lint、boundary-check、frontend/cloudfunction 测试 29 files / 120 tests、coverage、type-check、backend 测试 12 files / 46 tests、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 2026-05-18 本轮复验通过：包含 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`；smoke 输出 `E2E smoke passed: mp-weixin build artifacts and page routes are present.` |
| 受保护业务路径 diff | 已通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml` 输出为空；`src/pages.json` 存在前序视觉模块的 `navigationStyle: custom` 变更，本模块未新增修改 |
| 编译产物抽查 | 已通过：`dist/build/mp-weixin/pages/staff/image-tasks/index.wxml` 包含 `店员补图`、`IMAGE TASKS`、`STAFF WORKFLOW`、`货号搜索`、`批次筛选`、`上传主图和详情图`、`暂无补图任务`、`待补图`；`index.wxss` 包含 `filters`、`filter-card`、`task-card`、`task-list`、`thumb`、`placeholder`、`primary`、`empty-state`、`border-radius` |

## 5. 下一步

模块 K 已完成代码验证。等待用户人工验收模块 K。用户验收通过前，不进入模块 L。
