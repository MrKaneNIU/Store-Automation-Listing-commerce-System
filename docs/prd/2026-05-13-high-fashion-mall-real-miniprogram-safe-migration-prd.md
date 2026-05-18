# 高端女装商城真实小程序无损迁移总控 PRD

## 0. 文档定位

本文档是在真实迁移开始前，对以下三份已确认材料的总控整合：

```text
docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md
docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
```

目标是形成一份完整、安全、可分模块执行的真实微信小程序迁移 PRD。它的优先级是：先保护本项目原有业务功能和链路，再把已冻结的高端女装商城视觉迁移到真实 uni-app 小程序页面。

本 PRD 不直接实现迁移，不修改业务代码。真实迁移必须在用户确认本文档后，继续按模块单独执行、单独验收。

## 1. 背景

当前项目已经完成两个 UI 方向的 HTTP 原型和 PRD：

1. 客户商城侧：高端女装商城首页、商品列表、商品详情、购物反馈、收藏、购物袋、个人中心等参考视觉。
2. 管理工作台侧：客户首页“管理”入口、管理端“商城”返回入口、管理端底部导航、工作台首页、商品管理独占页、订单确认独占页。

用户现在要求进入真实小程序迁移前，先把客户侧 PRD、管理端 PRD 和模块 9 的安全做法合并为一份可执行总控 PRD，确保迁移过程不损伤现有业务功能和链路。

## 2. 总目标

1. 将已确认的高端女装商城视觉迁移到真实 uni-app 小程序。
2. 客户侧与管理端使用同一套黑白、高留白、圆角卡片、轻阴影、高级女装商城视觉语言。
3. 真实迁移只改页面层模板、页面局部样式和必要的页面内导航布局。
4. 保留现有 ViewModel、feature、CloudBase facade、上传服务、订单、库存、授权、权限链路。
5. 每次只做一个小模块；每个模块完成后运行验证并停止等待用户验收。

## 3. 不可破坏的业务链路

以下链路是硬保护对象，真实迁移不得改变其业务语义、数据结构和调用边界。

### 3.1 客户浏览与下单链路

必须保持：

1. 客户浏览商品不触发登录。
2. 客户侧只展示已上架商品。
3. 商品详情规格可选状态继续来自 ViewModel。
4. 只有下单时触发微信登录和手机号授权。
5. 取消授权不创建订单。
6. 下单继续走现有客户订单 feature / CloudBase facade。
7. 不新增购物袋真实数据结构，除非另开 PRD。

必须保留的真实接入点：

```text
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
src/features/cloudbase-mall/customer-product-list.ts
src/features/cloudbase-mall/customer-product-detail.ts
src/features/customer-product-list/customer-product-list.ts
src/features/customer-product-detail/customer-product-detail.ts
```

### 3.2 老板端截图识别链路

必须保持：

1. 截图选择、删除、识别状态不变。
2. 上传服务不变。
3. OCR provider 不变。
4. 识别结果继续生成草稿，不直接创建商品。
5. 页面不直接写 repository、mockDb 或 CloudBase 集合。

必须保留的真实接入点：

```text
src/pages/owner/import-upload/index.vue
src/features/owner-screenshot-import/owner-screenshot-import.ts
src/features/cloudbase-mall/owner-screenshot-import.ts
src/services/storage/runtime-upload-service.ts
```

### 3.3 老板端草稿确认链路

必须保持：

1. 草稿按商品货号分组。
2. 待补全、低置信度、价格冲突提示不弱化。
3. 商品货号、商品名称、销售价、规格、库存等现有字段不变。
4. 批量确认后继续通过现有规则创建商品和 SKU。
5. 不新增 SKU 规则。

必须保留的真实接入点：

```text
src/pages/owner/draft-review/index.vue
src/features/owner-draft-review/owner-draft-review.ts
src/features/cloudbase-mall/owner-draft-review.ts
```

### 3.4 店员补图链路

必须保持：

1. 店员只处理补图任务，不进入 OCR 草稿确认流程。
2. 保留关键词搜索、批次筛选、待补图商品列表。
3. 补图继续走现有 feature / CloudBase facade。
4. 不新增店员商品编辑或发布能力。

必须保留的真实接入点：

```text
src/pages/staff/image-tasks/index.vue
src/features/staff-image-tasks/staff-image-tasks.ts
src/features/cloudbase-mall/staff-image-tasks.ts
```

### 3.5 商品管理链路

必须保持：

1. 商品状态筛选不变。
2. 单品上架和批量上架能力不变。
3. 上架判断不变。
4. 不新增商品字段。
5. 不新增 SKU 规则。

必须保留的真实接入点：

```text
src/pages/owner/products/index.vue
src/features/owner-products/owner-products.ts
src/features/cloudbase-mall/owner-products.ts
```

### 3.6 订单确认、库存与审计链路

必须保持：

1. 订单查询不变。
2. 确认订单能力不变。
3. 取消订单能力不变。
4. 不新增支付、物流、退款、优惠券能力。
5. 不改变订单状态流。
6. 不改变库存扣减与审计规则。
7. 不在客户个人中心或客户页面重复展示管理端订单卡。

必须保留的真实接入点：

```text
src/pages/owner/orders/index.vue
src/features/owner-orders/owner-orders.ts
src/features/cloudbase-mall/owner-orders.ts
```

## 4. 真实迁移允许影响范围

### 4.1 第一批允许影响页面

真实迁移第一批只允许触碰以下页面文件：

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

### 4.2 条件允许影响

只有当单个模块执行前重新列出影响范围并获得用户确认后，才允许评估：

```text
src/app/routes.ts
src/app/navigation.ts
src/pages.json
```

默认策略是不改这些文件，因为当前页面路由已经存在。

### 4.3 明确禁止影响

真实迁移默认不改：

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
docs/contracts/
package.json
pnpm-lock.yaml
```

除非用户另开业务 PRD，否则也不新增：

```text
收藏数据模型
购物袋数据模型
地址数据模型
支付卡数据模型
优惠券数据模型
物流数据模型
退款数据模型
评论数据模型
视觉搜索真实能力
```

## 5. 视觉与交互总规范

真实迁移必须继承客户侧和管理端已确认的共同视觉参数。

### 5.1 风格关键词

```text
黑白
高留白
圆角卡片
轻阴影
克制字号
触控友好
电商感
非传统后台
```

### 5.2 色彩

```text
页面背景：#F8F8F8
主内容背景：#FFFFFF
卡片背景：#FFFFFF
商品图片占位背景：#F0F0F0
主文字：#222222
弱文字：#9A9A9A
分割线：#E8E8E8
主按钮/黑卡：#050505
主按钮文字：#FFFFFF
警示红：#E3322A
成功绿：#2FA85C
```

禁止：

1. 紫蓝渐变。
2. 霓虹光效。
3. 重型后台深色仪表盘。
4. 大面积表格灰底。
5. 整页 PNG 背景。
6. 把参考图切成大图覆盖页面。

### 5.3 尺寸与触控

```text
页面左右安全边距：32rpx
区块间距：48rpx - 72rpx
卡片内边距：28rpx - 40rpx
卡片圆角：24rpx - 32rpx
胶囊按钮圆角：999rpx
底部导航高度：144rpx - 168rpx
底部导航顶部圆角：32rpx - 40rpx
主按钮高度：92rpx - 104rpx
触控目标：不小于 44px 对应的小程序可点区域
```

### 5.4 响应式与 safe-area

必须检查：

1. 375px 宽度无横向滚动。
2. 390px 宽度无横向滚动。
3. 414px 宽度无横向滚动。
4. 文本不溢出、不重叠。
5. 固定底部按钮或底部导航不遮挡主要内容。
6. 使用 `env(safe-area-inset-bottom)` 或等效小程序安全区处理。

## 6. 信息架构总方案

### 6.1 客户侧

真实小程序客户侧应包含：

```text
首页 / 商城入口
商品列表
商品详情
下单授权反馈
订单成功反馈
```

第一批真实迁移默认不新增真实购物袋、收藏、个人中心数据模型。

### 6.2 管理端

真实小程序管理端应包含：

```text
工作台
商品管理
订单确认
```

管理端底部导航固定为：

```text
工作台
商品管理
订单确认
```

工作台首页业务入口固定为：

```text
截图识别
草稿确认
店员补图
```

规则：

1. `商品管理` 不在工作台首页作为功能入口重复展示。
2. `订单确认` 不在工作台首页作为功能入口重复展示。
3. `截图识别 / 草稿确认 / 店员补图` 不进入管理端底部导航。
4. 管理端右上角必须提供 `商城` 返回入口。
5. 客户首页右上角必须保留轻量 `管理` 入口，但不进入客户底部导航。

## 7. 分模块执行计划

真实迁移必须按以下模块顺序执行。每次只做一个模块，每个模块结束后停下等待用户验收。

### 模块 A：迁移前基线审计与文件清单冻结

目标：

1. 重新读取本 PRD、客户侧 UI PRD、管理端 UI PRD。
2. 核对当前真实页面、feature、CloudBase facade、验证命令。
3. 冻结本轮真实迁移的文件清单。

允许影响：

```text
docs/plans/
```

禁止影响：

```text
src/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
```

验收：

1. 列出每个后续模块会改哪些文件。
2. 列出每个后续模块不改哪些链路。
3. `git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 为空。
4. 用户确认后进入模块 B。

### 模块 B：客户首页与管理入口真实迁移

目标：

1. 将 `src/pages/index/index.vue` 从工程入口视觉迁移为高端女装商城入口。
2. 保留客户商城入口。
3. 保留右上角或顶部轻量 `管理` 入口。
4. 不触发登录、授权或权限逻辑。

允许影响：

```text
src/pages/index/index.vue
```

保留调用：

```text
navigateTo(routes.customerProductList)
navigateTo(routes.ownerDashboard)
```

验收：

1. 客户可进入商品列表。
2. 管理入口可进入工作台。
3. 不修改 `src/pages.json`。
4. 不新增登录或授权。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 模块 C：客户商品列表真实迁移

目标：

1. 将 `src/pages/customer/product-list/index.vue` 迁移为高端女装商城列表视觉。
2. 保留已上架商品列表能力。
3. 保留进入商品详情的路径。

允许影响：

```text
src/pages/customer/product-list/index.vue
```

保留调用：

```text
getCloudBaseCustomerProductListView()
uni.navigateTo({ url: `/pages/customer/product-detail/index?id=${productId}` })
```

验收：

1. 页面不直接读 repository。
2. 商品数据来自现有 ViewModel。
3. 无图、长商品名不破版。
4. 375px、390px、414px 无横向滚动。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 模块 D：客户商品详情与下单授权视觉迁移

目标：

1. 将 `src/pages/customer/product-detail/index.vue` 迁移为高端女装商品详情视觉。
2. 保留 SKU 选择、价格、库存禁用、下单授权、订单反馈链路。
3. 不新增真实购物袋能力。

允许影响：

```text
src/pages/customer/product-detail/index.vue
```

保留调用：

```text
getCloudBaseCustomerProductDetailView(...)
submitCloudBaseCustomerProductDetailOrder(...)
```

验收：

1. 浏览商品不触发登录。
2. 下单时才触发微信登录和手机号授权。
3. 取消授权不创建订单。
4. SKU 可选状态来自 ViewModel。
5. 页面不新增购物袋数据结构。
6. `pnpm.cmd run verify` 通过。
7. `pnpm.cmd run verify:full` 通过。

### 模块 E：管理工作台首页真实迁移

目标：

1. 将 `src/pages/owner/dashboard/index.vue` 迁移为 V4 管理工作台视觉。
2. 顶部显示 `Oh My Fish / 管理工作台`。
3. 右上角显示 `商城`。
4. 展示业务流进度和三个入口。
5. 不接入新的跨页面汇总查询，除非另开模块。

允许影响：

```text
src/pages/owner/dashboard/index.vue
```

保留调用：

```text
navigateTo(routes.ownerImportUpload)
navigateTo(routes.ownerDraftReview)
navigateTo(routes.staffImageTasks)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
navigateTo(routes.customerProductList)
```

验收：

1. `管理工作台` 单行显示。
2. 不出现传统后台 Dashboard 风格。
3. 工作台只展示 `截图识别 / 草稿确认 / 店员补图` 三个入口。
4. 商品管理和订单确认不作为工作台入口卡重复出现。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 模块 F：管理端底部导航真实迁移

目标：

1. 在管理端三个主页面落地一致的页面内底部导航。
2. 底部导航固定为 `工作台 / 商品管理 / 订单确认`。
3. 视觉与客户侧底部导航同尺寸、同高度、同圆角气质。

允许影响：

```text
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
```

验收：

1. 三个管理端页面之间可切换。
2. 底部导航不包含截图识别、草稿确认、店员补图。
3. 底部导航不遮挡内容。
4. 不修改全局 tabBar 或 `src/pages.json`。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 模块 G：商品管理独占页真实迁移

目标：

1. 将 `src/pages/owner/products/index.vue` 迁移为高定商城卡片式商品管理页。
2. 保留状态筛选、单品上架、批量上架。
3. 不新增字段、不改变 SKU 或上架规则。

允许影响：

```text
src/pages/owner/products/index.vue
```

保留调用：

```text
getCloudBaseOwnerProductsView(selectedStatus.value)
publishCloudBaseOwnerProduct(productId)
publishReadyCloudBaseOwnerProducts()
```

验收：

1. 页面不以传统表格为第一视觉。
2. 筛选胶囊可用。
3. 上架能力仍走现有 CloudBase facade。
4. 不新增商品字段或 SKU 规则。
5. `pnpm.cmd run verify` 通过。
6. `pnpm.cmd run verify:full` 通过。

### 模块 H：订单确认独占页真实迁移

目标：

1. 将 `src/pages/owner/orders/index.vue` 迁移为高定商城订单卡片页。
2. 保留确认订单和取消订单能力。
3. 不新增支付、物流、退款、优惠券能力。

允许影响：

```text
src/pages/owner/orders/index.vue
```

保留调用：

```text
getCloudBaseOwnerOrdersView()
confirmCloudBaseOwnerOrder(orderId)
cancelCloudBaseOwnerOrder(orderId)
```

验收：

1. 页面不以传统表格为第一视觉。
2. 订单卡展示客户信息、商品摘要、规格、数量、状态、金额。
3. 确认和取消动作仍走现有 CloudBase facade。
4. 不改变库存扣减与审计规则。
5. 不在客户页面重复展示管理端订单卡。
6. `pnpm.cmd run verify` 通过。
7. `pnpm.cmd run verify:full` 通过。

### 模块 I：截图识别页真实视觉迁移

目标：

1. 将 `src/pages/owner/import-upload/index.vue` 迁移为高定商城卡片式上传页。
2. 保留截图选择、删除、开始识别、识别结果展示。
3. 保留当前真实上传数量上限，除非另开业务变更。

允许影响：

```text
src/pages/owner/import-upload/index.vue
```

保留调用：

```text
uploadService.chooseImages(...)
removeOwnerScreenshotDescriptor(...)
startCloudBaseOwnerScreenshotRecognition(...)
formatUploadFailureMessage(...)
```

验收：

1. 上传链路不变。
2. OCR 识别调用不变。
3. 错误反馈仍可见。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

### 模块 J：草稿确认页真实视觉迁移

目标：

1. 将 `src/pages/owner/draft-review/index.vue` 迁移为高定商城卡片式草稿确认页。
2. 保留字段编辑、删除草稿、批量确认。
3. 不改变商品和 SKU 创建规则。

允许影响：

```text
src/pages/owner/draft-review/index.vue
```

保留调用：

```text
getCloudBaseOwnerDraftReviewView()
updateCloudBaseOwnerDraftReviewDraft(...)
deleteCloudBaseOwnerDraftReviewDraft(...)
confirmLatestCloudBaseOwnerDraftReviewBatch(...)
```

验收：

1. 必填字段和输入类型不弱化。
2. 待补全、低置信度、价格冲突提示仍可见。
3. 批量确认仍走现有 CloudBase facade。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

### 模块 K：店员补图页真实视觉迁移

目标：

1. 将 `src/pages/staff/image-tasks/index.vue` 迁移为高定商城卡片式补图任务页。
2. 保留关键词搜索、批次筛选、待补图商品列表、上传补图动作。
3. 不新增店员商品编辑或发布能力。

允许影响：

```text
src/pages/staff/image-tasks/index.vue
```

保留调用：

```text
getCloudBaseStaffImageTasksView(...)
supplementCloudBaseStaffProductImages(...)
```

验收：

1. 补图任务查询不变。
2. 补图动作不变。
3. 店员不进入 OCR 草稿确认流程。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

### 模块 L：真实迁移总验收与冻结

目标：

1. 对客户侧、管理端、老板端、店员端进行最终视觉和链路回归。
2. 冻结真实迁移版本。

允许影响：

```text
docs/plans/
```

验收：

1. 客户浏览商品不登录。
2. 下单授权和取消授权规则不变。
3. 截图识别、草稿确认、补图、商品上架、订单确认链路均可用。
4. 375px、390px、414px 无横向滚动。
5. 底部导航和固定按钮不遮挡内容。
6. `pnpm.cmd run verify` 通过。
7. `pnpm.cmd run verify:full` 通过。
8. 用户人工验收完成后，更新交付日志。

## 8. 每个模块的强制执行流程

每个真实迁移模块开始前必须：

1. 重新阅读本 PRD 中对应模块。
2. 输出 Repository Impact Map。
3. 输出 Execution Plan。
4. 明确改哪些文件。
5. 明确不改哪些文件。
6. 明确保留哪些 feature / ViewModel / CloudBase facade 调用。

每个真实迁移模块完成前必须：

1. 检查 `git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json`，除非该模块已明确获批修改其中某项，否则必须为空。
2. 运行 `pnpm.cmd run verify`。
3. 运行 `pnpm.cmd run verify:full`。
4. 如果命令失败，不得声称完成。
5. 如果只改文档，则不用运行 `verify`，但必须说明原因并确认真实业务代码 diff 为空。
6. 更新执行日志。
7. 停下等待用户确认。

## 9. 测试与验收策略

### 9.1 自动验证

真实代码迁移模块必须运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

不得用以下内容替代：

1. 浏览器预览成功。
2. WeChat DevTools 打开成功。
3. 构建启动成功。
4. 页面截图看起来正确。

### 9.2 人工验收

建议人工验收覆盖：

1. 客户首页进入商品列表。
2. 商品列表进入商品详情。
3. 商品详情选择规格。
4. 商品详情点击下单触发授权。
5. 取消授权不创建订单。
6. 管理入口进入工作台。
7. 工作台进入截图识别。
8. 工作台进入草稿确认。
9. 工作台进入店员补图。
10. 管理端底部导航进入商品管理。
11. 管理端底部导航进入订单确认。
12. 商品上架按钮仍可用。
13. 订单确认和取消仍可用。

### 9.3 视觉验收

必须在以下宽度检查：

```text
375px
390px
414px
```

检查项：

1. 无横向滚动。
2. 长商品名不破版。
3. 长规格名不破版。
4. 无图商品不破版。
5. 底部导航不遮挡内容。
6. 固定按钮不遮挡内容。
7. 表单字段可读、可点、可输入。
8. 错误与空状态可见。

## 10. 风险与控制

| 风险 | 控制方式 |
| --- | --- |
| 视觉迁移时误改业务层 | 每模块只允许改页面文件，业务层 diff 必须为空 |
| 页面绕过 feature 直接写数据 | 保留现有 ViewModel / CloudBase facade，禁止新增 repository / mockDb / CloudBase 集合访问 |
| 静态原型假数据进入真实页面 | 真实页面只读取现有 ViewModel，不复制原型假数据 |
| 底部导航破坏页面栈 | 默认使用现有 `navigateTo(routes.xxx)`，不改 `pages.json` |
| 客户下单授权规则被破坏 | 模块 D 必须专项验收“浏览不登录、下单才授权、取消不创建订单” |
| 商品/SKU/库存/订单状态流被破坏 | 默认不改 `src/domain/`、`src/features/`、`src/services/` |
| 小程序 safe-area 造成遮挡 | 每个页面底部预留空间，模块验收检查 375/390/414 |
| 管理端变成传统后台 | 商品和订单页必须使用卡片、胶囊、状态摘要，不使用表格作为第一视觉 |
| 真实迁移范围过大 | 拆分模块 A-L，每个模块完成后停下 |

## 11. 出口标准

只有同时满足以下条件，才能认为真实迁移完成：

1. 模块 A-L 均已完成并被用户确认。
2. `pnpm.cmd run verify` 通过。
3. `pnpm.cmd run verify:full` 通过。
4. 客户侧核心购物链路人工验收通过。
5. 管理端工作台、商品管理、订单确认人工验收通过。
6. 老板端截图识别、草稿确认人工验收通过。
7. 店员补图人工验收通过。
8. 未新增未批准的数据模型或业务能力。
9. 执行日志记录完整。

## 12. 当前结论

可以进入真实微信小程序迁移，但必须以本文档为总控 PRD，严格按模块推进。第一步不是直接改页面，而是执行模块 A：迁移前基线审计与文件清单冻结。只有模块 A 通过并获得用户确认后，才进入客户首页与管理入口的真实迁移。

## 13. 2026-05-13 交接状态

### 13.1 今日状态

截至 2026-05-13 收尾，本 PRD 只作为真实迁移前的总控计划文档，尚未进入真实页面实现。今天已经完成：

1. 客户侧 UI PRD 复核。
2. 管理工作台 V4 UI PRD 复核。
3. 管理工作台模块 9 安全迁移做法复核。
4. 无损真实迁移总控 PRD 编写。
5. 今日执行日志同步。

### 13.2 明日继续方式

明天继续时，应从以下模块开始：

```text
模块 A：迁移前基线审计与文件清单冻结
```

模块 A 只允许更新 `docs/plans/` 下的审计和执行记录，不允许直接修改真实页面。模块 A 的输出必须包含：

1. 本次真实迁移的页面文件清单。
2. 每个后续模块允许修改的文件。
3. 每个后续模块明确不修改的业务链路。
4. 当前真实页面使用的 feature / ViewModel / CloudBase facade 接入点。
5. 真实业务代码 diff 为空的证据。

### 13.3 明日禁止直接开始的事情

在模块 A 未完成并获得用户确认前，禁止直接执行：

```text
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/staff/image-tasks/index.vue
```

也禁止修改：

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

### 13.4 明日第一条验证命令

模块 A 开始时先运行或等效核对：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

预期结果为空。若不为空，必须先解释差异来源，并确认是否与真实迁移相关；不得在未确认的情况下继续实现。
