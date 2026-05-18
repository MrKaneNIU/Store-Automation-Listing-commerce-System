# 高端女装商城真实小程序迁移模块 I 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 I：截图识别页真实视觉迁移。

模块 I 的目标是将 `src/pages/owner/import-upload/index.vue` 迁移为高定商城卡片式上传页，同时保留截图选择、删除、开始识别、识别结果展示、上传数量上限和错误反馈。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/import-upload/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-i-log.md
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
uploadService.chooseImages(...)
removeOwnerScreenshotDescriptor(...)
startCloudBaseOwnerScreenshotRecognition(...)
formatUploadFailureMessage(...)
```

## 2. 实施内容

1. 将截图识别页从基础表单列表迁移为高定商城卡片式上传页：顶部品牌栏、OCR 批次概览、上传操作卡、截图预览网格、空状态、错误/结果反馈、识别草稿卡片。
2. 选择截图继续调用 `uploadService.chooseImages(...)`，且 `count: 9` 保持不变。
3. 删除截图继续调用 `removeOwnerScreenshotDescriptor(screenshots.value, imageId)`。
4. 开始识别继续调用 `startCloudBaseOwnerScreenshotRecognition(screenshots.value)`，识别结果继续写入 `drafts` 并展示。
5. 上传失败继续通过 `formatUploadFailureMessage(error)` 显示错误反馈。
6. 页面只新增视觉展示结构和商城返回入口，没有新增 OCR provider、上传服务、草稿创建、商品创建或 CloudBase 集合直连。

## 3. 保留业务合同

1. 截图选择、删除、识别状态不变。
2. 上传服务不变。
3. OCR provider / CloudBase facade 不变。
4. 识别结果继续生成草稿，不直接创建商品。
5. 页面不直接写 repository、mockDb 或 CloudBase 集合。
6. 未修改 `src/pages.json`，未新增全局 tabBar。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 上传链路不变 | 保留 `uploadService.chooseImages(...)`，`count: 9` 不变 |
| 删除截图不变 | 保留 `removeOwnerScreenshotDescriptor(...)` |
| OCR 识别调用不变 | 保留 `startCloudBaseOwnerScreenshotRecognition(...)` |
| 错误反馈仍可见 | 保留 `message` 区域和 `formatUploadFailureMessage(...)` |
| 识别结果仍展示 | 保留 `drafts.length > 0` 草稿列表 |
| 不直接创建商品 | 页面仍只展示草稿，不调用商品创建或发布能力 |
| `pnpm.cmd run verify` | 已通过：lint、boundary-check、frontend/cloudfunction 测试 29 files / 120 tests、coverage、type-check、backend 测试 12 files / 46 tests、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 2026-05-14 本轮复验通过：包含 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`；smoke 输出 `E2E smoke passed: mp-weixin build artifacts and page routes are present.` |
| 受保护业务路径 diff | 已通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml` 输出为空；`src/pages.json` 存在前序视觉模块的 `navigationStyle: custom` 变更，本模块未新增修改 |
| 编译产物抽查 | 已通过：`dist/build/mp-weixin/pages/owner/import-upload/index.wxml` 包含 `截图识别`、`IMAGE INTAKE`、`OCR BATCH`、`选择截图`、`开始识别`、`删除`、`识别草稿`、`等待选择截图`、`9 张`、`商城`；`index.wxss` 包含 `upload-panel`、`image-grid`、`image-card`、`draft-card`、`primary`、`secondary`、`remove-button`、`border-radius` |

## 5. 下一步

模块 I 已完成代码验证。等待用户人工验收模块 I。用户验收通过前，不进入模块 J。
