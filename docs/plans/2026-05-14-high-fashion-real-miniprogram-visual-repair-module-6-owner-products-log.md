# 高端女装商城真实小程序视觉修复模块 6：商品管理独占页记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 G：商品管理独占页真实迁移。

本模块目标是让 `src/pages/owner/products/index.vue` 成为高定商城卡片式商品管理页，同时保留状态筛选、单品上架、批量上架能力，不新增字段、不改变 SKU 或上架规则。

本次执行发现：在前序管理端视觉迁移中，商品管理页已经完成卡片式视觉迁移，并保留了现有 CloudBase facade 调用。因此模块 G 采用审计、验证和记录的安全收口方式，不再制造额外代码改动。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-6-owner-products-log.md
```

### 1.2 本模块审计范围

```text
src/pages/owner/products/index.vue
```

### 1.3 本模块明确不影响

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
src/pages.json
```

本模块未新增字段、未改 SKU 规则、未改上架判断、未新增 repository 或 CloudBase 集合直接访问。

## 2. PRD 验收点复核

### 2.1 页面不以传统表格为第一视觉

商品管理页当前结构为高端女装商城风格：

1. 顶部品牌/kicker 与 `商品管理` 标题。
2. 黑底状态摘要 hero。
3. 白底圆角状态筛选面板。
4. 白底圆角批量上架操作条。
5. 商品卡片列表，包含商品图、货号、商品名、SKU 数量、状态徽标和上架入口。
6. 固定管理端底部导航。

页面未使用 `<table>`、`<tr>`、`<td>` 作为主视觉结构。

### 2.2 筛选胶囊可用

状态筛选继续来自现有 ViewModel：

```text
viewModel.statusOptions
selectedStatus
```

筛选胶囊点击后仍执行：

```text
selectedStatus = option.value
watch(selectedStatus, refreshView)
```

刷新调用保持：

```text
getCloudBaseOwnerProductsView(selectedStatus.value)
```

### 2.3 上架能力仍走现有 CloudBase facade

单品上架保留：

```text
publishCloudBaseOwnerProduct(productId)
```

批量上架保留：

```text
publishReadyCloudBaseOwnerProducts()
```

页面没有直接写入数据层。

### 2.4 不新增商品字段或 SKU 规则

页面展示仍来自现有 `OwnerProductsViewModel` 和商品项字段：

```text
product.productCode
product.productName
product.mainImageUrl
product.statusLabel
product.skuCount
product.canPublish
viewModel.readyProductCount
viewModel.canBatchPublish
```

未新增价格区间、库存、颜色尺码等额外字段，也未修改 SKU 或上架规则。

## 3. 编译产物复核

已在 `dist/build/mp-weixin/pages/owner/products/index.wxml` 中确认关键结构与文案：

```text
商品管理
状态筛选
批量上架
货号
SKU
上架
工作台
订单确认
```

已在 `dist/build/mp-weixin/pages/owner/products/index.wxss` 中确认关键样式：

```text
product-card
filter-pill
publish-button
admin-nav
border-radius
```

## 4. 业务合同复核

1. 未修改 `src/features/owner-products/owner-products.ts`。
2. 未修改 `src/features/cloudbase-mall/owner-products.ts`。
3. 未修改 domain、service、backend、cloudfunctions。
4. 未修改商品字段、SKU 规则、上架判断。
5. 未新增真实数据模型、状态字段、API 或 CloudBase 集合访问。
6. 受保护业务层 diff 为空。

复核命令：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml
```

结果：输出为空。

## 5. 自动验证

已运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `verify` 通过：lint、boundary-check、前端/云函数测试 29 files / 120 tests、coverage、type-check、后端测试 12 files / 46 tests、backend build、prod/all audit 均通过。
2. `verify:full` 通过：包含完整 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`。
3. mp-weixin smoke 通过：`E2E smoke passed: mp-weixin build artifacts and page routes are present.`

## 6. 未完成的人工验收

本模块已经完成代码审计、编译产物检查和自动验证，但尚未在微信开发者工具中完成真实视觉验收。

用户需要重点检查：

1. 商品管理页是否为卡片式高端女装商城风格，而不是传统后台表格。
2. 状态筛选胶囊是否可点，并能刷新对应列表。
3. 单个商品的 `上架` 按钮是否仍可用。
4. `批量上架` 是否仍可用，并按可上架状态启用/禁用。
5. 长商品名、长货号、无图商品是否不破版。
6. 底部导航是否 active 在 `商品管理`，且不遮挡内容。
7. 375px、390px、414px 宽度是否无横向滚动。

## 7. 下一步建议

用户确认模块 G 后，再进入模块 H：订单确认独占页真实迁移。模块 H 才允许继续收敛订单确认页主体视觉，但仍必须保留确认订单、取消订单、库存扣减和审计规则。
