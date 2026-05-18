# 高端女装商城真实小程序迁移模块 A 审计冻结记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 A：迁移前基线审计与文件清单冻结。

模块 A 只做审计和执行记录，不进入真实页面实现，不修改 `src/`、`backend/`、`cloudfunctions/`、`src/pages.json`、`package.json` 或 `pnpm-lock.yaml`。

## 1. 已复读依据

本轮审计已复读以下材料：

```text
docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md
docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md
docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
```

结论：

1. 真实迁移已被允许进入，但第一步必须是模块 A。
2. 模块 A 之后，每次只能执行一个模块，并在模块结束后停止等待用户验收。
3. 真实迁移默认只改页面层模板、页面局部样式和必要的页面内导航布局。
4. 业务层、服务层、CloudBase facade、上传、OCR、订单、库存、授权、权限链路保持不变。

## 2. Repository Impact Map

### 2.1 本模块实际允许影响

```text
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-a-audit-log.md
```

### 2.2 本模块禁止影响

```text
src/
backend/
cloudfunctions/
src/pages.json
package.json
pnpm-lock.yaml
```

### 2.3 后续真实迁移第一批页面清单

以下页面文件均已在当前仓库中存在，并已在 `src/pages.json` 中有路由记录：

```text
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/staff/image-tasks/index.vue
```

### 2.4 默认不改范围

除非用户另开业务 PRD 或在单模块执行前明确批准，否则后续真实迁移默认不改：

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
docs/contracts/
src/pages.json
package.json
pnpm-lock.yaml
```

也不新增以下真实业务能力或数据模型：

```text
购物袋数据模型
收藏数据模型
个人中心数据模型
地址数据模型
支付卡数据模型
优惠券数据模型
物流数据模型
退款数据模型
评论数据模型
视觉搜索真实能力
```

## 3. 当前真实接入点核对

### 3.1 首页与路由

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/index/index.vue` | `navigateTo(routes.ownerDashboard)`、`navigateTo(routes.staffImageTasks)`、`navigateTo(routes.customerProductList)` | 后续模块 B 可改视觉和入口呈现；保留 `navigateTo(routes.customerProductList)` 与 `navigateTo(routes.ownerDashboard)`，不新增登录、授权或权限判断。 |
| `src/app/routes.ts` | 已包含 owner/customer/staff 页面路由常量 | 默认不改。仅当后续单模块重新列出影响范围并获用户确认后才允许评估。 |
| `src/app/navigation.ts` | `uni.navigateTo({ url })` | 默认不改。 |
| `src/pages.json` | 已包含 9 个目标页面路径 | 默认不改。后续真实迁移优先使用页面内导航，不改全局 tabBar。 |

### 3.2 客户侧商品列表

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/customer/product-list/index.vue` | `getCloudBaseCustomerProductListView()`、`uni.navigateTo({ url: /pages/customer/product-detail/index?id=... })` | 后续模块 C 只改列表视觉；商品数据继续来自现有 ViewModel，不直接读 repository。 |
| `src/features/cloudbase-mall/customer-product-list.ts` | CloudBase facade | 默认不改。 |
| `src/features/customer-product-list/customer-product-list.ts` | 页面 ViewModel 类型和纯视图规则 | 默认不改。 |

### 3.3 客户侧商品详情与下单

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/customer/product-detail/index.vue` | `getCloudBaseCustomerProductDetailView(...)`、`selectCloudBaseCustomerProductSku(...)`、`submitCloudBaseCustomerProductDetailOrder(...)` | 后续模块 D 只改详情和下单反馈视觉；浏览不触发登录，下单时才触发微信登录和手机号授权，取消授权不创建订单。 |
| `src/features/cloudbase-mall/customer-product-detail.ts` | CloudBase facade | 默认不改。 |
| `src/features/customer-product-detail/customer-product-detail.ts` | SKU 可选状态、价格、库存和页面 ViewModel 规则 | 默认不改。 |

### 3.4 管理工作台

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/owner/dashboard/index.vue` | `navigateTo(routes.ownerImportUpload)`、`navigateTo(routes.ownerDraftReview)`、`navigateTo(routes.ownerProducts)`、`navigateTo(routes.ownerOrders)` | 后续模块 E 只改工作台视觉和入口布局；工作台只展示 `截图识别 / 草稿确认 / 店员补图` 三个入口，商品管理和订单确认改由模块 F 的管理端底部导航承载。 |

### 3.5 老板端截图识别

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/owner/import-upload/index.vue` | `uploadService.chooseImages(...)`、`removeOwnerScreenshotDescriptor(...)`、`startCloudBaseOwnerScreenshotRecognition(...)`、`formatUploadFailureMessage(...)` | 后续模块 I 只改上传页视觉；截图选择、删除、识别状态、上传服务、OCR provider 均不变。 |
| `src/features/owner-screenshot-import/owner-screenshot-import.ts` | 截图描述符删除等页面安全纯逻辑 | 默认不改。 |
| `src/features/cloudbase-mall/owner-screenshot-import.ts` | CloudBase facade | 默认不改。 |
| `src/services/storage/runtime-upload-service.ts` | 上传服务 | 默认不改。 |

### 3.6 老板端草稿确认

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/owner/draft-review/index.vue` | `getCloudBaseOwnerDraftReviewView()`、`updateCloudBaseOwnerDraftReviewDraft(...)`、`deleteCloudBaseOwnerDraftReviewDraft(...)`、`confirmLatestCloudBaseOwnerDraftReviewBatch(...)` | 后续模块 J 只改草稿确认视觉；必填、低置信度、价格冲突提示和批量确认规则不弱化。 |
| `src/features/owner-draft-review/owner-draft-review.ts` | 草稿确认 ViewModel 和页面规则 | 默认不改。 |
| `src/features/cloudbase-mall/owner-draft-review.ts` | CloudBase facade | 默认不改。 |

### 3.7 店员补图

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/staff/image-tasks/index.vue` | `getCloudBaseStaffImageTasksView(...)`、`supplementCloudBaseStaffProductImages(...)` | 后续模块 K 只改补图任务页视觉；店员只处理补图任务，不进入 OCR 草稿确认流程，不新增商品编辑或发布能力。 |
| `src/features/staff-image-tasks/staff-image-tasks.ts` | 店员补图 ViewModel 和页面规则 | 默认不改。 |
| `src/features/cloudbase-mall/staff-image-tasks.ts` | CloudBase facade | 默认不改。 |

### 3.8 商品管理

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/owner/products/index.vue` | `getCloudBaseOwnerProductsView(selectedStatus.value)`、`publishCloudBaseOwnerProduct(productId)`、`publishReadyCloudBaseOwnerProducts()` | 后续模块 G 只改商品管理视觉；状态筛选、单品上架、批量上架继续走现有 CloudBase facade，不新增商品字段、SKU 规则或上架规则。 |
| `src/features/owner-products/owner-products.ts` | 商品管理 ViewModel 和页面规则 | 默认不改。 |
| `src/features/cloudbase-mall/owner-products.ts` | CloudBase facade | 默认不改。 |

### 3.9 订单确认、库存与审计

| 文件 | 当前接入点 | 模块规则 |
| --- | --- | --- |
| `src/pages/owner/orders/index.vue` | `getCloudBaseOwnerOrdersView()`、`confirmCloudBaseOwnerOrder(orderId)`、`cancelCloudBaseOwnerOrder(orderId)` | 后续模块 H 只改订单确认视觉；确认、取消、订单状态流、库存扣减和审计规则不变。 |
| `src/features/owner-orders/owner-orders.ts` | 订单确认 ViewModel 和页面规则 | 默认不改。 |
| `src/features/cloudbase-mall/owner-orders.ts` | CloudBase facade | 默认不改。 |

## 4. 后续模块冻结清单

| 模块 | 允许修改文件 | 必须保留 | 明确不改链路 |
| --- | --- | --- | --- |
| B 客户首页与管理入口真实迁移 | `src/pages/index/index.vue` | `navigateTo(routes.customerProductList)`、`navigateTo(routes.ownerDashboard)` | 不改 `src/pages.json`；不新增登录、授权、权限逻辑。 |
| C 客户商品列表真实迁移 | `src/pages/customer/product-list/index.vue` | `getCloudBaseCustomerProductListView()`、详情页跳转 URL | 不直接读 repository；不改商品筛选或已上架规则。 |
| D 客户商品详情与下单授权视觉迁移 | `src/pages/customer/product-detail/index.vue` | `getCloudBaseCustomerProductDetailView(...)`、`selectCloudBaseCustomerProductSku(...)`、`submitCloudBaseCustomerProductDetailOrder(...)` | 不新增购物袋数据结构；不改变浏览不登录、下单才授权、取消授权不建单规则。 |
| E 管理工作台首页真实迁移 | `src/pages/owner/dashboard/index.vue` | `navigateTo(routes.ownerImportUpload)`、`navigateTo(routes.ownerDraftReview)`、`navigateTo(routes.staffImageTasks)`、`navigateTo(routes.customerProductList)` | 不接入跨页面实时汇总；不把商品管理/订单确认作为工作台入口卡重复展示。 |
| F 管理端底部导航真实迁移 | `src/pages/owner/dashboard/index.vue`、`src/pages/owner/products/index.vue`、`src/pages/owner/orders/index.vue` | `navigateTo(routes.ownerDashboard)`、`navigateTo(routes.ownerProducts)`、`navigateTo(routes.ownerOrders)` | 不改全局 tabBar；不改 `src/pages.json`；底部导航不包含截图识别、草稿确认、店员补图。 |
| G 商品管理独占页真实迁移 | `src/pages/owner/products/index.vue` | `getCloudBaseOwnerProductsView(selectedStatus.value)`、`publishCloudBaseOwnerProduct(productId)`、`publishReadyCloudBaseOwnerProducts()` | 不新增商品字段、SKU 规则、上架规则。 |
| H 订单确认独占页真实迁移 | `src/pages/owner/orders/index.vue` | `getCloudBaseOwnerOrdersView()`、`confirmCloudBaseOwnerOrder(orderId)`、`cancelCloudBaseOwnerOrder(orderId)` | 不新增支付、物流、退款、优惠券；不改变订单状态流、库存扣减和审计规则。 |
| I 截图识别页真实视觉迁移 | `src/pages/owner/import-upload/index.vue` | `uploadService.chooseImages(...)`、`removeOwnerScreenshotDescriptor(...)`、`startCloudBaseOwnerScreenshotRecognition(...)`、`formatUploadFailureMessage(...)` | 不改上传服务、OCR provider、识别状态；识别结果仍生成草稿。 |
| J 草稿确认页真实视觉迁移 | `src/pages/owner/draft-review/index.vue` | `getCloudBaseOwnerDraftReviewView()`、`updateCloudBaseOwnerDraftReviewDraft(...)`、`deleteCloudBaseOwnerDraftReviewDraft(...)`、`confirmLatestCloudBaseOwnerDraftReviewBatch(...)` | 不弱化必填、低置信度、价格冲突提示；不改商品和 SKU 创建规则。 |
| K 店员补图页真实视觉迁移 | `src/pages/staff/image-tasks/index.vue` | `getCloudBaseStaffImageTasksView(...)`、`supplementCloudBaseStaffProductImages(...)` | 不新增店员商品编辑或发布能力；店员不进入 OCR 草稿确认流程。 |
| L 真实迁移总验收与冻结 | `docs/plans/` | 自动验证、人工验收记录、最终冻结记录 | 不做新页面实现；不补业务能力。 |

## 5. 验证命令冻结

真实代码迁移模块必须运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

模块 A 只新增文档，按总控 PRD 不运行全量验证；必须确认真实业务代码 diff 为空。

本模块已确认 `package.json` 中存在以下脚本：

```text
verify
verify:full
```

## 6. 当前工作树说明

审计开始时，`git status --short` 显示存在若干既有未跟踪目录和文档，例如 `.agents/`、`.playwright-mcp/`、`.superpowers/`、`docs/prototypes/`、`skills-lock.json` 以及 2026-05-12/2026-05-13 相关 PRD/日志文件。

这些项目不是模块 A 新增的业务代码改动。本模块只新增本审计记录，不处理 unrelated 本地文件。

## 7. 模块 A 验收证据

已核对页面文件存在：

```text
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/staff/image-tasks/index.vue
```

已核对路由存在：

```text
src/pages.json
src/app/routes.ts
src/app/navigation.ts
```

已运行受保护范围 diff：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

结果为空，说明模块 A 没有修改真实页面、业务层、服务层、后端、云函数、路由配置、依赖或锁文件。

## 8. 当前结论

模块 A 的审计冻结输出已经形成。用户确认本记录后，才能进入模块 B：客户首页与管理入口真实迁移。

模块 B 开始前仍必须重新输出 Repository Impact Map 和 Execution Plan，并确认只影响：

```text
src/pages/index/index.vue
```
