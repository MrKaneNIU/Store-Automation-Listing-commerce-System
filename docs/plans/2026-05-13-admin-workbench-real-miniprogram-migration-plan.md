# 高端女装商城管理工作台真实小程序迁移计划

## 0. 文档定位

本文档是 `docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md` 的模块 9 交付物，只用于规划 V4 管理工作台 HTTP 原型后续迁移到真实 uni-app 小程序的方式。

当前模块不实现真实迁移，不修改 `src/`、`backend/`、`cloudfunctions/`、`src/pages.json`、`package.json` 或 `pnpm-lock.yaml`。后续只有在用户确认本计划后，才允许按本计划拆分小模块进入真实小程序页面实现。

## 1. 当前依据

### 1.1 已冻结原型

HTTP 原型冻结范围：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
```

已确认的 V4 管理端结构：

```text
客户首页“管理”入口
管理端“商城”返回入口
管理端底部导航：工作台 / 商品管理 / 订单确认
工作台首页：业务流进度 + 截图识别 / 草稿确认 / 店员补图
商品管理独占页
订单确认独占页
```

### 1.2 已核对真实页面

真实页面文件均存在：

```text
src/pages/index/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/staff/image-tasks/index.vue
```

`src/pages.json` 已包含这些页面路由，本计划阶段不修改 `src/pages.json`。

### 1.3 已核对 feature / ViewModel 锚点

真实页面已有的 feature 和 CloudBase facade 锚点：

| 页面 | 当前功能锚点 | 后续迁移规则 |
| --- | --- | --- |
| `src/pages/index/index.vue` | `src/app/routes.ts`、`src/app/navigation.ts` | 可增加客户商城首页视觉入口，但不改路由表 |
| `src/pages/owner/dashboard/index.vue` | `src/app/routes.ts`、`src/app/navigation.ts` | 只重构工作台 UI 和入口布局 |
| `src/pages/owner/import-upload/index.vue` | `features/owner-screenshot-import`、`features/cloudbase-mall/owner-screenshot-import`、`services/storage/runtime-upload-service` | 保留截图选择、删除、识别调用链 |
| `src/pages/owner/draft-review/index.vue` | `features/owner-draft-review`、`features/cloudbase-mall/owner-draft-review` | 保留草稿编辑、删除、批量确认调用链 |
| `src/pages/staff/image-tasks/index.vue` | `features/staff-image-tasks`、`features/cloudbase-mall/staff-image-tasks` | 保留补图任务查询、批次筛选、补图调用链 |
| `src/pages/owner/products/index.vue` | `features/owner-products`、`features/cloudbase-mall/owner-products` | 保留状态筛选、单品上架、批量上架调用链 |
| `src/pages/owner/orders/index.vue` | `features/owner-orders`、`features/cloudbase-mall/owner-orders` | 保留订单查询、确认订单、取消订单调用链 |

## 2. 迁移总原则

1. 真实迁移只能在用户确认本计划后开始。
2. 真实迁移优先改页面层模板和 scoped 样式，保留现有 script 中的 feature / CloudBase facade 调用。
3. 页面层不得直接写 repository、mockDb、CloudBase 集合或服务适配器。
4. 不新增商品、SKU、订单、库存、收藏、地址、支付、物流、退款、优惠券等模型或能力。
5. 不修改业务状态流：截图识别、草稿确认、补图、上架、订单确认、订单取消都继续走现有 feature。
6. 不把 HTTP 原型的静态假数据迁入真实页面。
7. 不把管理端订单卡重复放到客户个人中心或客户页面。
8. 不把 `截图识别 / 草稿确认 / 店员补图` 放入管理端底部导航；它们只作为工作台业务流入口。
9. 不把 `商品管理 / 订单确认` 作为工作台入口卡重复展示；它们只在管理端底部导航独占页面中出现。
10. 所有真实迁移模块结束后必须运行与改动匹配的验证命令。

## 3. 预计真实影响文件

后续真实迁移预计只允许触碰页面层和必要的页面局部样式：

```text
src/pages/index/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/staff/image-tasks/index.vue
```

只有当真实实现发现多个页面重复样式过多，并且用户确认可以抽公共样式时，才允许另行评估：

```text
src/pages/owner/
src/pages/staff/
src/pages/customer/
```

本计划不预先新增公共组件、不预先新增全局样式文件。

## 4. 明确不改范围

真实迁移计划和后续第一轮实现默认不改：

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

不改的业务合同：

1. 客户浏览商品不触发登录。
2. 只有下单时触发微信登录和手机号授权。
3. 取消授权不创建订单。
4. 客户侧只展示已上架商品。
5. 商品、SKU、订单、库存、OCR、上传、权限、授权的数据结构不变。
6. 页面层继续通过现有 feature / CloudBase facade 获取 ViewModel 和执行命令。
7. 真实迁移不引入新依赖。

## 5. 页面级迁移方案

### 5.1 首页与管理入口

候选文件：

```text
src/pages/index/index.vue
```

迁移目标：

1. 将当前工程骨架首页调整为客户商城风格入口页。
2. 保留进入 `客户商城` 的现有路径。
3. 将右上角或顶部轻量入口设置为 `管理`，跳转到 `routes.ownerDashboard`。

接入方式：

```text
navigateTo(routes.ownerDashboard)
navigateTo(routes.customerProductList)
```

禁止：

1. 不新增权限判断。
2. 不新增登录或授权逻辑。
3. 不修改 `src/app/routes.ts`，除非后续用户确认新增页面。

### 5.2 管理工作台首页

候选文件：

```text
src/pages/owner/dashboard/index.vue
```

迁移目标：

1. 使用 `Oh My Fish / 管理工作台` 顶部结构。
2. 增加右上角 `商城` 入口，跳转到 `routes.customerProductList`。
3. 展示业务流进度：

```text
截图识别：可上传 X 张
草稿确认：待确认 N 条
店员补图：待补图 M 件
```

4. 工作台首页只保留三个功能入口：

```text
截图识别 -> routes.ownerImportUpload
草稿确认 -> routes.ownerDraftReview
店员补图 -> routes.staffImageTasks
```

5. 增加页面内管理端底部导航：

```text
工作台 -> routes.ownerDashboard
商品管理 -> routes.ownerProducts
订单确认 -> routes.ownerOrders
```

接入方式：

```text
navigateTo(routes.ownerImportUpload)
navigateTo(routes.ownerDraftReview)
navigateTo(routes.staffImageTasks)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
navigateTo(routes.customerProductList)
```

待确认点：

1. `可上传 X 张` 后续是否从上传组件选中数量计算，还是在工作台只展示静态上限。
2. `待确认 N 条` 和 `待补图 M 件` 是否需要从现有 ViewModel 查询汇总；如果需要，必须通过现有 feature / CloudBase facade，不允许页面直接查 repository。

建议：

模块化迁移第一版可先保留入口和视觉，不做跨页面实时汇总；汇总数值另开小模块接入。

### 5.3 截图识别页

候选文件：

```text
src/pages/owner/import-upload/index.vue
```

迁移目标：

1. 仅重构视觉：黑白、高留白、圆角卡片、轻阴影。
2. 保留现有截图选择、删除、开始识别、识别结果展示。
3. 将上传数量限制视觉文案与真实 `chooseImages({ count: 9 })` 保持一致，除非另开业务需求把真实上限改为 18。

保留调用：

```text
uploadService.chooseImages(...)
removeOwnerScreenshotDescriptor(...)
startCloudBaseOwnerScreenshotRecognition(...)
formatUploadFailureMessage(...)
```

禁止：

1. 不改 OCR provider。
2. 不改上传服务。
3. 不改截图数量上限，除非单独确认业务变更。

### 5.4 草稿确认页

候选文件：

```text
src/pages/owner/draft-review/index.vue
```

迁移目标：

1. 保留商品货号分组、待补全、低置信度、价格冲突、字段编辑、删除草稿、批量确认。
2. 将传统表单视觉调整为高定商城卡片式编辑界面。
3. 保留输入字段与原有事件。

保留调用：

```text
getCloudBaseOwnerDraftReviewView()
updateCloudBaseOwnerDraftReviewDraft(...)
deleteCloudBaseOwnerDraftReviewDraft(...)
confirmLatestCloudBaseOwnerDraftReviewBatch(...)
```

禁止：

1. 不改变必填字段规则。
2. 不改变商品和 SKU 创建规则。
3. 不弱化低置信度、价格冲突等提示。

### 5.5 店员补图页

候选文件：

```text
src/pages/staff/image-tasks/index.vue
```

迁移目标：

1. 保留关键词搜索、批次筛选、待补图商品列表、补图动作。
2. 调整为高定商城卡片列表。
3. 保留店员只处理补图任务的语义，不进入 OCR 草稿确认流程。

保留调用：

```text
getCloudBaseStaffImageTasksView(...)
supplementCloudBaseStaffProductImages(...)
```

禁止：

1. 不新增店员商品编辑能力。
2. 不新增商品发布能力。
3. 不绕过补图 feature。

### 5.6 商品管理独占页

候选文件：

```text
src/pages/owner/products/index.vue
```

迁移目标：

1. 使用状态摘要、筛选胶囊和商品卡片，不做传统表格。
2. 保留 `全部 / 待补图 / 可上架 / 已上架` 筛选。
3. 保留单品上架与批量上架能力。
4. 增加页面内管理端底部导航，激活 `商品管理`。

保留调用：

```text
getCloudBaseOwnerProductsView(selectedStatus.value)
publishCloudBaseOwnerProduct(productId)
publishReadyCloudBaseOwnerProducts()
```

禁止：

1. 不新增商品字段。
2. 不新增 SKU 规则。
3. 不改变上架判断。

### 5.7 订单确认独占页

候选文件：

```text
src/pages/owner/orders/index.vue
```

迁移目标：

1. 使用订单卡片，不做传统表格。
2. 保留订单状态、客户信息、商品摘要、规格、数量、金额。
3. 保留确认订单和取消订单动作。
4. 增加页面内管理端底部导航，激活 `订单确认`。

保留调用：

```text
getCloudBaseOwnerOrdersView()
confirmCloudBaseOwnerOrder(orderId)
cancelCloudBaseOwnerOrder(orderId)
```

禁止：

1. 不新增支付能力。
2. 不新增物流能力。
3. 不新增退款能力。
4. 不新增优惠券能力。
5. 不改变库存扣减与审计规则。

## 6. 真实迁移拆分建议

后续真实迁移必须继续一次只做一个小模块，每个模块结束后停下等待用户确认。

### 迁移模块 A：真实页面视觉令牌与导航基线

目标：

1. 确定真实小程序页面使用的黑白、高留白、圆角、轻阴影、底部导航样式基线。
2. 不改任何业务动作。

预计影响：

```text
src/pages/owner/dashboard/index.vue
```

验收：

1. 工作台首页呈现高定商城视觉。
2. `管理工作台` 单行显示。
3. `商城` 入口跳转客户商城。
4. 业务入口仍可跳转原页面。
5. `pnpm.cmd run verify` 通过。
6. 若构建受影响，`pnpm.cmd run verify:full` 通过。

### 迁移模块 B：真实管理端底部导航

目标：

1. 在 `owner/dashboard`、`owner/products`、`owner/orders` 中落地一致的页面内管理端底部导航。
2. 底部导航只包含 `工作台 / 商品管理 / 订单确认`。

预计影响：

```text
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
```

验收：

1. 三个页面之间可切换。
2. 不把截图识别、草稿确认、店员补图放入底部导航。
3. 底部导航不遮挡主要内容。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

### 迁移模块 C：工作台业务流与三入口

目标：

1. 在真实工作台首页落地业务流进度模块。
2. 只保留 `截图识别 / 草稿确认 / 店员补图` 三个入口。

预计影响：

```text
src/pages/owner/dashboard/index.vue
```

验收：

1. 工作台不展示商品管理入口卡。
2. 工作台不展示订单确认入口卡。
3. 三个入口跳转到现有页面。
4. 不新增跨层数据读取。
5. `pnpm.cmd run verify` 通过。

### 迁移模块 D：商品管理页面视觉迁移

目标：

1. 将真实商品管理页迁移为高定商城卡片式页面。
2. 保留现有 ViewModel、状态筛选、单品上架、批量上架。

预计影响：

```text
src/pages/owner/products/index.vue
```

验收：

1. 页面不以传统表格为第一视觉。
2. 状态筛选可用。
3. 上架能力仍走原 CloudBase facade。
4. 不新增商品字段或 SKU 规则。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 迁移模块 E：订单确认页面视觉迁移

目标：

1. 将真实订单确认页迁移为高定商城订单卡片页面。
2. 保留确认订单和取消订单能力。

预计影响：

```text
src/pages/owner/orders/index.vue
```

验收：

1. 页面不以传统表格为第一视觉。
2. 确认订单仍走 `confirmCloudBaseOwnerOrder`。
3. 取消订单仍走 `cancelCloudBaseOwnerOrder`。
4. 不新增支付、物流、退款、优惠券能力。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 迁移模块 F：截图识别、草稿确认、店员补图视觉对齐

目标：

1. 将三条业务流页面视觉与管理工作台统一。
2. 保留上传、识别、草稿编辑、批量确认、补图任务等现有动作。

预计影响：

```text
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/staff/image-tasks/index.vue
```

验收：

1. 三页视觉与管理端一致。
2. 现有动作调用链不变。
3. 表单、输入、上传和错误反馈仍可用。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

## 7. 验证计划

每个真实迁移模块至少运行：

```powershell
pnpm.cmd run verify
```

当页面结构、构建配置、路由、样式或小程序构建可能受影响时运行：

```powershell
pnpm.cmd run verify:full
```

真实迁移模块的人工验收不等同于自动验证。浏览器预览、WeChat DevTools 打开、构建启动成功，都不能替代 `verify` / `verify:full`。

## 8. 主要风险与控制

| 风险 | 控制方式 |
| --- | --- |
| 页面层绕过 feature 直接写数据 | 每个页面保留现有 CloudBase facade 调用，禁止新增 repository / mockDb / CloudBase 集合写入 |
| 原型静态数据误迁入真实页面 | 真实页面只使用现有 ViewModel，不复制原型假数据 |
| 管理端底部导航破坏页面栈 | 继续使用 `navigateTo(routes.xxx)`，不改 `pages.json` 和全局 tabBar |
| 业务流指标缺少真实汇总来源 | 第一版可先展示入口和局部已有状态；跨页面汇总另开模块接入 feature |
| 商品 / SKU / 订单状态流被改动 | 真实迁移默认不改 `src/features/`、`src/domain/`、`src/services/` |
| 小程序 safe-area / 底部导航遮挡内容 | 每个页面底部预留 padding，并在 375 / 390 / 414 宽度人工验收 |
| 视觉统一导致可用性下降 | 保持触控目标 44px 以上，表单/上传/确认按钮清晰可见 |

## 9. 当前结论

模块 9 只完成真实迁移计划，不进入真实页面实现。后续如用户确认进入真实迁移，应从“迁移模块 A：真实页面视觉令牌与导航基线”开始，继续一次只做一个小模块，每个模块完成后停下验收。
