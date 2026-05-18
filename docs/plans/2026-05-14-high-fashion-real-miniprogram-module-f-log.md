# 高端女装商城真实小程序迁移模块 F 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 F：管理端底部导航真实迁移。

模块 F 的目标是在管理端三个主页面落地一致的页面内底部导航，固定为 `工作台 / 商品管理 / 订单确认`，并保持与客户侧底部导航一致的悬浮、圆角、安全区和触控气质。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-f-log.md
```

### 1.2 本模块明确不影响

```text
src/pages.json
src/app/routes.ts
src/app/navigation.ts
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
```

### 1.3 必须保留的调用

```text
navigateTo(routes.ownerDashboard)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
```

商品管理页必须继续保留：

```text
getCloudBaseOwnerProductsView(...)
publishCloudBaseOwnerProduct(...)
publishReadyCloudBaseOwnerProducts(...)
```

订单确认页必须继续保留：

```text
getCloudBaseOwnerOrdersView()
confirmCloudBaseOwnerOrder(...)
cancelCloudBaseOwnerOrder(...)
```

## 2. 实施内容

1. 在 `src/pages/owner/dashboard/index.vue` 增加页面内管理端底部导航，并将 `工作台` 设为激活态。
2. 在 `src/pages/owner/products/index.vue` 增加同规格底部导航，并将 `商品管理` 设为激活态。
3. 在 `src/pages/owner/orders/index.vue` 增加同规格底部导航，并将 `订单确认` 设为激活态。
4. 三个页面底部导航均使用现有 `navigateTo(routes.xxx)`，没有修改全局 `tabBar` 或 `src/pages.json`。
5. 三个页面都增加 `env(safe-area-inset-bottom)` 底部预留，避免固定底部导航遮挡主要内容。
6. 商品管理和订单确认页面仅新增导航导入、导航模板和安全区样式，未修改业务 ViewModel、发布、确认或取消逻辑。

## 3. 保留业务合同

1. 底部导航只包含 `工作台 / 商品管理 / 订单确认`。
2. 底部导航不包含 `截图识别 / 草稿确认 / 店员补图`。
3. 页面不直接读取 repository、mockDb 或 CloudBase 集合。
4. 页面不新增跨页面汇总查询。
5. 页面不新增商品字段、SKU 规则、订单状态、支付、物流、退款或优惠券能力。
6. 商品管理页的状态筛选、单品上架、批量上架能力保持现有 feature/facade。
7. 订单确认页的确认订单、取消订单能力保持现有 feature/facade。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 三个管理端页面之间可切换 | 三页均使用 `navigateTo(routes.ownerDashboard / ownerProducts / ownerOrders)` |
| 底部导航不包含截图识别、草稿确认、店员补图 | 三页底部导航仅含 `工作台 / 商品管理 / 订单确认` |
| 底部导航不遮挡内容 | 三页 `.page` 均增加 `calc(188rpx + env(safe-area-inset-bottom))` 底部 padding |
| 不修改全局 tabBar 或 `src/pages.json` | 未修改 `src/pages.json` |
| 商品管理业务调用不变 | 保留 `getCloudBaseOwnerProductsView(...)`、`publishCloudBaseOwnerProduct(...)`、`publishReadyCloudBaseOwnerProducts(...)` |
| 订单确认业务调用不变 | 保留 `getCloudBaseOwnerOrdersView()`、`confirmCloudBaseOwnerOrder(...)`、`cancelCloudBaseOwnerOrder(...)` |
| `pnpm.cmd run verify` | 通过：lint、boundary-check、前端/云函数测试 29 个文件 120 条、coverage、type-check、后端测试 12 个文件 46 条、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 通过：包含完整 `verify`，并完成 `build:mp-weixin` 与 `scripts/e2e-smoke.mjs`，小程序构建产物和页面路由 smoke 均通过 |
| 受保护路径 diff | 通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 输出为空 |

## 5. 下一步

模块 F 已完成代码验证。等待用户人工验收模块 F 后，才能进入模块 G：商品管理独占页真实迁移。
