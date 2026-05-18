# 高端女装商城真实小程序迁移模块 G 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 G：商品管理独占页真实迁移。

模块 G 的目标是将 `src/pages/owner/products/index.vue` 迁移为高定商城卡片式商品管理页，同时保留状态筛选、单品上架和批量上架能力，不新增商品字段、SKU 规则或页面直连仓储。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/products/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-g-log.md
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
getCloudBaseOwnerProductsView(selectedStatus.value)
publishCloudBaseOwnerProduct(productId)
publishReadyCloudBaseOwnerProducts()
navigateTo(routes.ownerDashboard)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
```

## 2. 实施内容

1. 将商品管理页从简单列表迁移为高定商城管理视图：顶部品牌栏、发布概览、状态筛选面板、批量上架操作区、商品卡片列表和空状态。
2. 状态筛选继续使用 `viewModel.statusOptions` 与 `selectedStatus`，筛选切换后仍通过 `watch(selectedStatus)` 调用 `refreshView()`。
3. 单品上架按钮继续只在 `product.canPublish` 为真时展示，并调用 `publish(product.id)`。
4. 批量上架按钮继续使用 `:disabled="!viewModel.canBatchPublish"`，并调用 `publishReadyProducts()`。
5. 保留模块 F 已落地的管理端底部导航，`商品管理` 为当前激活态，页面底部继续预留安全区，避免遮挡内容。
6. 页面只新增展示用 `selectedStatusLabel`，没有新增商品字段、SKU 规则、状态规则、仓储访问或 CloudBase 集合直连。

## 3. 保留业务合同

1. 商品状态筛选仍由 `getCloudBaseOwnerProductsView(selectedStatus.value)` 返回的 ViewModel 驱动。
2. 单品上架仍走 `publishCloudBaseOwnerProduct(productId)`。
3. 批量上架仍走 `publishReadyCloudBaseOwnerProducts()`。
4. 页面不直接读取 repository、mockDb 或 CloudBase 集合。
5. 页面不新增商品字段、SKU 规则、价格规则、库存规则、支付、物流、退款或优惠券能力。
6. 未修改 `src/pages.json`，未新增全局 tabBar。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 页面不以传统表格为第一视觉 | 已迁移为发布概览、筛选面板与商品卡片列表 |
| 状态筛选仍可用 | 保留 `viewModel.statusOptions`、`selectedStatus` 和 `getCloudBaseOwnerProductsView(selectedStatus.value)` |
| 单品上架仍走现有 facade | 保留 `publishCloudBaseOwnerProduct(productId)` |
| 批量上架仍走现有 facade | 保留 `publishReadyCloudBaseOwnerProducts()` |
| 不新增商品字段或 SKU 规则 | 仅使用现有 `productCode`、`productName`、`mainImageUrl`、`statusLabel`、`skuCount`、`canPublish` |
| 底部导航不遮挡内容 | `.page` 保留 `calc(188rpx + env(safe-area-inset-bottom))` 底部 padding |
| `pnpm.cmd run verify` | 通过：lint、boundary-check、前端/云函数测试 29 个文件 120 条、coverage、type-check、后端测试 12 个文件 46 条、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 通过：包含完整 `verify`，并完成 `build:mp-weixin` 与 `scripts/e2e-smoke.mjs`，小程序构建产物和页面路由 smoke 均通过 |
| 受保护路径 diff | 通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 输出为空 |

## 5. 下一步

模块 G 已完成代码验证。等待用户人工验收模块 G。用户验收通过前，不进入模块 H。
