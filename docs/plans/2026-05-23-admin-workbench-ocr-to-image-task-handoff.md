# 2026-05-23 管理工作台 OCR 到补图链路修复交付记录

## 背景

用户实测确认：

- 截图上传 OCR 已能成功识别。
- 提取信息正确。
- 草稿确认页可以走到明确接受，草稿显示已就绪。
- 点击“批量确认并创建商品 SKU”后，没有继续进入店员补图。

本次修复目标是打通管理工作台账号体系下的：

```text
OCR 识别
-> 草稿复核/明确接受
-> 批量确认创建商品和 SKU
-> 商品进入 pending_images
-> 店员补图页可查询并补图
```

## Repository Impact Map

本次实际涉及：

```text
cloudfunctions/mallApi/mall-api-core.js
cloudfunctions/mallApi/mall-api-core.test.js
src/features/cloudbase-mall/owner-draft-review.ts
src/features/owner-draft-review/owner-draft-review.ts
src/pages/owner/draft-review/index.vue
src/pages/owner/draft-review/index.test.ts
docs/plans/2026-05-23-admin-workbench-ocr-to-image-task-handoff.md
docs/plans/2026-05-19-risk-group-b-ocr-job-main-chain-log.md
docs/plans/2026-05-22-admin-workbench-repair-baseline.md
```

明确未改变：

```text
客户浏览/下单
订单确认与库存扣减语义
支付、物流、退款、优惠券
商品/SKU 合并规则
OCR 上传直接创建商品的禁令
页面直接写 repository 或 CloudBase 集合的禁令
```

## 根因

1. 草稿确认页在 `confirmLatestBatch` 成功后只刷新当前页和显示消息，没有把操作者带到店员补图页。
2. `mallApi` 中 `confirmBatch`、`listPendingImageTasks`、`supplementProductImages`、`publishProduct` 仍使用旧的微信角色身份校验；OCR 与草稿编辑已经接入管理工作台 `adminSession`，但后续商品/补图链路没有完全同步到同一账号体系。

这导致管理工作台账号能完成 OCR 和草稿复核，却在创建 SKU 后的补图链路继续遇到旧的 `Verified WeChat identity is required` 门槛。

## 修复内容

- `mallApi` 后续商品链路改为接受管理工作台 `adminSession`，并要求 `productManagement` 权限。
- 草稿确认 facade 增加结构化结果：
  - `createdProductCount`
  - `createdSkuCount`
  - `nextAction: supplementImages`
- 草稿确认页在成功创建商品后自动进入 `routes.staffImageTasks`。
- 新增页面契约测试，锁定“批量确认成功后存在店员补图下一步路径”。
- 新增云函数测试，锁定“管理工作台 session 无需微信 identity 也能从 OCR 草稿继续到 pending image tasks 并完成补图”。

## 验证记录

RED/GREEN 定向测试：

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/pages/owner/draft-review/index.test.ts
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
```

RED 结果：

- 页面测试失败，因为草稿确认页没有导入 `navigateTo` / `routes`，也没有 `goStaffImageTasks`。
- 云函数测试失败，因为 `confirmBatch` 在没有微信 identity 时返回旧的 `UNAUTHORIZED`，导致 `confirmed.data` 为空。

GREEN 后定向验证：

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/pages/owner/draft-review/index.test.ts src/features/owner-draft-review/owner-draft-review.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
```

结果：3 个测试文件、19 个测试通过。

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
```

结果：1 个测试文件、21 个测试通过。

完整验证：

```powershell
pnpm.cmd run type-check
pnpm.cmd run verify:full
```

结果：

- `type-check` 通过。
- `verify:full` 通过。
- 前端/云函数测试：49 个测试文件、217 个测试通过。
- 覆盖率：整体 88.8%。
- 后端测试：12 个测试文件、49 个测试通过。
- `audit:prod` / `audit:all`：No known vulnerabilities found。
- `build:mp-weixin`：Build complete。
- `smoke:mp-weixin`：`E2E smoke passed: mp-weixin build artifacts and page routes are present.`

## CloudBase 部署与线上验证

环境：

```text
envId: cloud1-d7gifjyzl7721b383
function: mallApi
runtime: Nodejs18.15
```

部署：

```text
manageFunctions.updateFunctionCode(mallApi)
RequestId: 2382fed2-653e-481a-aa25-dd118d7aee69
```

函数状态收敛后：

```text
Status: Active
AvailableStatus: Available
ModTime: 2026-05-23 14:58:21
```

线上无副作用验证：

```text
action: listPendingImageTasks
adminSession:
  account: admin
  role: creator
  permissions:
    - workbenchAccess
    - productManagement
```

结果：

```json
{"success":true,"data":{"products":[]},"error":null,"meta":{}}
```

说明线上 `listPendingImageTasks` 已不再要求微信 identity。返回空数组只代表当前线上没有待补图商品，不代表权限失败。

## 当前状态

已完成：

- 管理工作台账号体系下，OCR 后续的批量确认、待补图查询、补图动作权限链路已统一到 `productManagement`。
- 草稿确认成功创建商品后会进入店员补图下一步。
- 本地完整验证通过。
- 线上 `mallApi` 已部署并完成无微信 identity 的管理 session 验证。

仍需人工验收：

1. 在微信开发者工具重新导入或刷新 `dist/build/mp-weixin`。
2. 使用管理工作台账号登录。
3. 走完整链路：
   - 截图上传 OCR
   - 识别成功
   - 草稿明确接受
   - 批量确认并创建商品 SKU
   - 自动进入或手动进入店员补图
   - 新商品出现在待补图任务中
   - 上传主图/详情图后状态进入可上架

注意：

- `verify:full` 和 CloudBase smoke 不能替代微信开发者工具人工验收。
- 当前工作树在本次交付前已有大量管理工作台和 OCR 主链未提交改动；本次 git checkpoint 作为当前进度快照，不应被误读为只包含单一文件修复。
