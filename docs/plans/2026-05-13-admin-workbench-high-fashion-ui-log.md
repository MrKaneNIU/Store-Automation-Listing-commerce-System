# 高端女装商城管理工作台 UI 执行日志

## 2026-05-13 模块 1：PRD 复核与原型范围审计

### 本模块目标

按 `docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md` 的模块 1 执行，重新阅读管理工作台 PRD 与客户商城 UI PRD，确认后续只在 HTTP 原型内制作管理工作台，不进入真实小程序迁移。

### 已复核文档

1. `docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md`
2. `docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md`

### 本轮结论

1. V4 管理工作台已定稿为高端女装商城风格，不做传统后台表格。
2. 后续先做 HTTP 原型，不改真实小程序业务代码。
3. 管理端必须继承客户商城的黑白、高留白、圆角卡片、轻阴影和底部导航规格。
4. 客户首页右上角“管理”进入管理工作台；管理端右上角“商城”返回客户商城。
5. 管理端底部导航为 `工作台 / 商品管理 / 订单确认`。
6. 工作台首页只保留 `截图识别 / 草稿确认 / 店员补图` 三个功能入口。
7. 商品管理与订单确认迁入底部导航独占页面。

### 模块 2 预计改动范围

模块 2 只允许修改 HTTP 原型文件：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
```

模块 2 的目标是建立管理端原型壳与双向入口：

1. 客户首页右上角有“管理”入口。
2. 管理工作台右上角有“商城”入口。
3. 两个入口只在原型内切换视图。
4. 不触发真实登录、权限、路由写入或后端调用。

### 明确不改范围

后续原型模块继续不改：

```text
src/
backend/
cloudfunctions/
src/pages.json
package.json
pnpm-lock.yaml
```

本轮确认的真实页面锚点仅作为后续迁移参考，不在当前原型阶段修改：

```text
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
src/pages/staff/image-tasks/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
```

### 业务合同保持不变

1. 客户浏览商品不触发登录。
2. 只有下单时触发微信登录和手机号授权。
3. 取消授权不创建订单。
4. 客户侧只展示已上架商品。
5. 商品、SKU、订单、库存、OCR、上传、权限、授权的数据结构不变。
6. 页面层不直接写 repository、mockDb 或 CloudBase 集合。
7. 原型阶段不调用真实服务。

### 审计结果

1. 当前 HTTP 原型目录存在：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
```

2. 原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

3. 本模块没有修改真实业务代码。

### 模块 1 验收状态

模块 1 已完成，等待用户确认后进入模块 2。

## 2026-05-13 模块 2：管理端原型壳与双向入口

### 本模块目标

在 HTTP 原型中建立管理端壳层，实现客户首页“管理”到管理端、管理端“商城”回客户首页。

### 本模块改动范围

本模块只修改 HTTP 原型文件：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
```

### 已完成内容

1. 为客户商城首页右上角“管理”按钮接入 `show-admin` 原型内切换动作。
2. 新增 `data-view="admin"` 管理工作台壳层。
3. 管理工作台壳层顶部展示 `Oh My Fish`、`管理工作台` 和右上角“商城”按钮。
4. “商城”按钮接入 `show-home`，可回到客户商城首页。
5. 管理工作台视图中隐藏客户侧底部导航，回到客户首页后恢复客户侧底部导航。
6. 本模块只建立双向入口和管理端壳层，底部导航、业务流进度和具体功能入口留给后续模块。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 首页可见右上角“管理”按钮。
2. 点击“管理”后进入“管理工作台”视图。
3. 管理端可见右上角“商城”按钮。
4. 管理端视图中客户购物底部导航隐藏。
5. 点击“商城”后返回客户商城首页。
6. 返回首页后客户购物底部导航恢复显示。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

本模块未修改真实业务代码。

### 模块 2 验收状态

模块 2 已完成，等待用户确认后进入模块 3。

## 2026-05-13 模块 3：管理端底部导航

### 本模块目标

实现管理端底部导航，尺寸、高度、圆角和客户商城底部导航一致，并让 `工作台 / 商品管理 / 订单确认` 三个管理端页面可在原型内切换。

### 本模块改动范围

本模块只修改 HTTP 原型文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 新增管理端底部导航 `admin-bottom-nav`。
2. 管理端底部导航只包含三个主项：

```text
工作台
商品管理
订单确认
```

3. 新增管理端内部占位面板：

```text
工作台占位页
商品管理占位页
订单确认占位页
```

4. 点击 `工作台 / 商品管理 / 订单确认` 可在管理端原型内切换对应面板。
5. 底部导航没有承载 `截图识别 / 草稿确认 / 店员补图`，这三项继续留给工作台首页后续模块。
6. 商品管理与订单确认目前仅作为独占页占位，不展开真实商品管理或订单确认内容。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 点击首页“管理”后进入管理工作台。
2. 管理端底部导航显示 `工作台 / 商品管理 / 订单确认`。
3. 点击“商品管理”后显示“商品管理占位页”。
4. 点击“订单确认”后显示“订单确认占位页”。
5. 点击“工作台”后回到“工作台占位页”。
6. 375px、390px、414px 视口下 `scrollWidth` 均等于视口宽度，无横向滚动。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

### 模块 3 验收状态

模块 3 已完成，等待用户确认后进入模块 4。

## 2026-05-13 模块 4：工作台首页 V4 顶部与业务流进度

### 本模块目标

完成 V4 工作台首页顶部与业务流进度模块。只实现 `业务流进度` 和三项指标，不提前制作模块 5 的三个功能入口卡。

### 本模块改动范围

本模块只修改 HTTP 原型文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 工作台面板保留顶部 `Oh My Fish` 与单行 `管理工作台`。
2. 将模块 3 的工作台占位内容替换为 `业务流进度`。
3. 新增三项业务流指标：

```text
截图识别：可上传 13 张
草稿确认：待确认 6 条
店员补图：待补图 4 件
```

4. 截图识别指标按 PRD 规则计算：

```text
maxUploadCount = 18
selectedUploadCount = 5
remainingCount = max(0, 18 - 5) = 13
显示文案 = 可上传 13 张
```

5. 本模块没有加入 `截图识别 / 草稿确认 / 店员补图` 三个功能入口卡；入口卡留给模块 5。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. `管理工作台` 标题保持单行。
2. 页面出现 `业务流进度`。
3. 页面出现 `可上传 13 张`。
4. 页面出现 `待确认 6 条`。
5. 页面出现 `待补图 4 件`。
6. 页面不出现 `ADMIN`。
7. 页面不出现 `入口保留`。
8. 375px、390px、414px 视口下 `scrollWidth` 均等于视口宽度，无横向滚动。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

### 模块 4 验收状态

模块 4 已完成，等待用户确认后进入模块 5。

## 2026-05-13 模块 5：工作台首页三个功能入口

### 本模块目标

在业务流进度模块下完成三个工作台功能入口卡，只保留 `截图识别 / 草稿确认 / 店员补图`。不提前制作商品管理或订单确认独占页内容。

### 本模块改动范围

本模块只修改 HTTP 原型文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 在 `业务流进度` 指标下方新增 `工作台功能入口` 卡组。
2. 入口卡只包含：

```text
截图识别
草稿确认
店员补图
```

3. 没有在工作台入口卡组中加入 `商品管理`。
4. 没有在工作台入口卡组中加入 `订单确认`。
5. 三张入口卡均为白底、圆角、轻边线/轻阴影风格，与管理端高定商城视觉保持一致。
6. 点击入口卡只显示原型内 toast，例如 `截图识别 仅切换原型入口，不调用真实服务`，不调用真实上传、OCR、草稿、补图或数据服务。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 工作台入口卡数量为 3。
2. 三个入口分别为 `截图识别 / 草稿确认 / 店员补图`。
3. 工作台入口卡组不包含 `商品管理`。
4. 工作台入口卡组不包含 `订单确认`。
5. 点击“截图识别”后只出现原型 toast，不触发真实服务。
6. 375px、390px、414px 视口下 `scrollWidth` 均等于视口宽度，无横向滚动。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

### 模块 5 验收状态

模块 5 已完成，等待用户确认后进入模块 6。

## 2026-05-13 模块 6：商品管理独占页

### 本模块目标

完成管理端底部导航中的 `商品管理` 独占页面原型。页面继续保持高端女装商城风格，用状态摘要、胶囊筛选和商品卡片表达现有商品管理能力，不做传统后台表格首页。

### 本模块改动范围

本模块只修改 HTTP 原型文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 将 `商品管理占位页` 替换为 `商品管理` 独占页面。
2. 工作台首页仍然不重复展示 `商品管理` 入口卡。
3. 页面顶部使用 `PRODUCTS / 商品管理`，并延续管理端白底、高留白、圆角卡片、轻阴影视觉。
4. 新增商品状态摘要：

```text
待补图 1
可上架 1
已上架 1
```

5. 新增商品状态筛选胶囊：

```text
全部
待补图
可上架
已上架
```

6. 新增三张商品卡片：

```text
AL-2407 黑色廓形短外套：可上架 / 上架
IV-1182 象牙白垂坠半裙：待补图 / 去补图
NO-3921 法式收腰连衣裙：已上架 / 已上架
```

7. `上架`、`去补图` 只显示原型 toast，不写入商品、SKU、库存或发布状态。
8. 本模块没有新增商品字段，没有新增 SKU 规则，没有改变上架判断。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 点击首页“管理”后进入管理工作台。
2. 点击底部导航“商品管理”后进入 `商品管理` 独占页。
3. 页面可见状态摘要 `待补图 1 / 可上架 1 / 已上架 1`。
4. 页面可见筛选胶囊 `全部 / 待补图 / 可上架 / 已上架`。
5. `全部` 状态下显示 3 张商品卡。
6. 点击 `可上架` 筛选后只显示可上架商品卡。
7. 页面未出现传统后台 `table`。
8. 点击 `上架` 只出现 `上架仅为静态原型反馈，不写入商品数据` toast。
9. 375px、390px、414px 视口下 `scrollWidth` 均等于视口宽度，无横向滚动。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

本执行日志未命中未完成占位标记。

### 模块 6 验收状态

模块 6 已完成，等待用户确认后进入模块 7。

## 2026-05-13 模块 7：订单确认独占页

### 本模块目标

完成管理端底部导航中的 `订单确认` 独占页面原型。页面继续使用高定商城卡片式视觉，展示现有商家订单确认语义：待确认、确认、取消；不新增支付、物流、退款、优惠券等能力。

### 本模块改动范围

本模块只修改 HTTP 原型文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 将 `订单确认占位页` 替换为 `订单确认` 独占页面。
2. 工作台首页仍然不重复展示 `订单确认` 入口卡。
3. 页面顶部使用 `ORDERS / 订单确认`，并延续管理端白底、高留白、圆角卡片、轻阴影视觉。
4. 新增订单确认摘要：

```text
待确认 2
今日金额 ¥3,207
```

5. 新增两张待确认订单卡片：

```text
#OMF-0521 黑色廓形短外套：客户 林女士 / 尺码 M / 黑色 / x1 / ¥1,286
#OMF-0522 法式收腰连衣裙：客户 周女士 / 尺码 S / 雾白 / x1 / ¥1,921
```

6. 每张订单卡包含 `取消订单` 与 `确认订单` 两个原型按钮。
7. 点击 `确认订单` 只显示原型 toast：不写入订单或库存数据。
8. 点击 `取消订单` 只显示原型 toast：不触发退款或库存回滚。
9. 本模块没有新增支付、物流、退款、优惠券能力，没有改变订单状态流、库存扣减或审计规则。
10. 客户个人中心没有回流或重复展示管理端订单卡。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 点击首页“管理”后进入管理工作台。
2. 点击底部导航“订单确认”后进入 `订单确认` 独占页。
3. 页面可见 `待确认 2` 与 `今日金额 ¥3,207`。
4. 页面可见 2 张待确认订单卡。
5. 每张订单卡可见 `确认订单` 与 `取消订单` 按钮。
6. 页面未出现传统后台 `table`。
7. 点击 `确认订单` 只出现 `确认订单仅为静态原型反馈，不写入订单或库存数据` toast。
8. 点击 `取消订单` 只出现 `取消订单仅为静态原型反馈，不触发退款或库存回滚` toast。
9. 375px、390px、414px 视口下 `scrollWidth` 均等于视口宽度，无横向滚动。
10. 浏览器控制台无 error。
11. 客户个人中心中 `.admin-order-card` 数量为 0，未重复展示管理端订单卡。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

说明：本模块页面文案出现 `支付`、`物流`、`退款`、`优惠券` 是边界说明，用于声明不新增这些能力；没有新增相关入口、表单、状态或交互。

本执行日志未命中未完成占位标记。

### 模块 7 验收状态

模块 7 已完成，等待用户确认后进入模块 8。

## 2026-05-13 模块 8：视觉打磨与验收冻结

### 本模块目标

统一管理端与客户商城的视觉参数，并冻结 V4 管理工作台 HTTP 原型。模块 8 不新增业务功能，不进入真实小程序迁移；只做视觉一致性、响应式、触控、边界和冻结记录。

### 本模块改动范围

本模块只修改 HTTP 原型样式文件和本执行日志：

```text
docs/prototypes/high-fashion-mall-ui/styles.css
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 复核 `docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md` 模块 8 验收标准。
2. 复核管理端底部导航与客户商城底部导航的尺寸、高度、圆角、阴影和激活态保持一致。
3. 复核管理端三个主页面：

```text
工作台
商品管理
订单确认
```

4. 复核工作台首页只保留三个业务入口：

```text
截图识别
草稿确认
店员补图
```

5. 复核商品管理与订单确认都已迁入底部导航独占页面。
6. 复核商品管理和订单确认页面没有使用传统后台表格。
7. 微调管理端商品筛选胶囊与商品操作按钮的最小触控尺寸，使其达到 44px 触控基线。
8. 未新增任何真实业务能力、真实服务调用、真实数据写入或真实路由。

### 浏览器验证

验证地址：

```text
http://localhost:4177/
```

Playwright 验证结果：

1. 375px、390px、414px 视口下，客户侧 `首页 / 商品 / 购物袋 / 收藏 / 我的` 均无横向滚动。
2. 375px、390px、414px 视口下，管理端 `工作台 / 商品管理 / 订单确认` 均无横向滚动。
3. 管理端“管理”入口与“商城”返回入口可双向切换。
4. 管理端底部导航固定为 `工作台 / 商品管理 / 订单确认`。
5. 三个管理端底部导航页面均可切换。
6. 业务流进度不出现 `入口保留`。
7. 工作台首页只保留 `截图识别 / 草稿确认 / 店员补图` 三个入口。
8. 管理端页面没有传统后台 `table`。
9. 文字未检测到横向溢出。
10. 管理端主要内容未被底部导航遮挡。
11. 管理端商品筛选与操作按钮达到 44px 触控基线。
12. 浏览器控制台无 error。

### 安全与边界验证

原型文件未命中以下真实服务或越界关键词：

```text
CloudBase
cloudbase
repository
mockDb
OCR
OcrProvider
wx.
createOrder
submitCustomer
fetch(
XMLHttpRequest
axios
mallApi
```

页面文案级扫描未命中：

```text
>ADMIN<
入口保留
<table
商品管理占位页
订单确认占位页
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

本执行日志未命中未完成占位标记。

### 冻结结论

V4 管理工作台 HTTP 原型已完成冻结验收准备。当前冻结范围包括：

```text
客户首页“管理”入口
管理端“商城”返回入口
管理端底部导航：工作台 / 商品管理 / 订单确认
工作台首页：业务流进度 + 截图识别 / 草稿确认 / 店员补图
商品管理独占页
订单确认独占页
```

模块 8 已完成，等待用户确认后，才能进入模块 9：真实小程序迁移计划。

## 2026-05-13 模块 9：真实小程序迁移计划

### 本模块目标

按用户确认的安全做法，只编写真实小程序迁移计划，不进入真实页面实现，不修改真实业务代码。

### 本模块改动范围

本模块只新增迁移计划文档，并更新本执行日志：

```text
docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已核对真实锚点

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

真实 feature / ViewModel 锚点均存在：

```text
src/features/owner-screenshot-import/
src/features/owner-draft-review/
src/features/staff-image-tasks/
src/features/owner-products/
src/features/owner-orders/
src/features/cloudbase-mall/
```

真实页面当前已经通过 CloudBase facade / ViewModel 接入现有能力：

```text
getCloudBaseOwnerProductsView
publishCloudBaseOwnerProduct
publishReadyCloudBaseOwnerProducts
getCloudBaseOwnerOrdersView
confirmCloudBaseOwnerOrder
cancelCloudBaseOwnerOrder
startCloudBaseOwnerScreenshotRecognition
getCloudBaseOwnerDraftReviewView
confirmLatestCloudBaseOwnerDraftReviewBatch
getCloudBaseStaffImageTasksView
supplementCloudBaseStaffProductImages
```

### 已完成内容

1. 新增真实小程序迁移计划文档。
2. 重新列出后续真实页面预计影响文件。
3. 重新列出不改的业务层、服务层、后端、配置和依赖文件。
4. 明确每个页面后续应继续使用现有 feature / ViewModel / CloudBase facade。
5. 明确真实迁移继续拆成小模块执行：

```text
A：真实页面视觉令牌与导航基线
B：真实管理端底部导航
C：工作台业务流与三入口
D：商品管理页面视觉迁移
E：订单确认页面视觉迁移
F：截图识别、草稿确认、店员补图视觉对齐
```

6. 明确真实迁移模块必须运行 `pnpm.cmd run verify`，必要时运行 `pnpm.cmd run verify:full`。
7. 明确浏览器预览、WeChat DevTools 打开或构建启动不能替代完整验证。

### 安全与边界验证

本模块没有修改以下真实业务范围：

```text
src/
backend/
cloudfunctions/
src/pages.json
package.json
pnpm-lock.yaml
```

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

迁移计划文档未命中未完成占位标记。

### 模块 9 验收状态

模块 9 已完成。后续只有用户明确确认进入真实迁移实现，才能从迁移模块 A 开始；真实迁移仍需一次只做一个小模块。

## 2026-05-13 真实迁移前总控 PRD：无损迁移计划整合

### 本轮目标

在进入真实小程序迁移前，重新审阅以下文档，并整合为一份完整、安全、可无损执行的真实迁移总控 PRD：

```text
docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md
docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
```

### 本轮改动范围

本轮只新增总控 PRD，并更新本执行日志：

```text
docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
```

### 已完成内容

1. 重新审阅客户侧高端女装商城 UI PRD。
2. 重新审阅管理工作台 V4 UI PRD。
3. 结合模块 9 的安全迁移做法，新增真实小程序无损迁移总控 PRD。
4. 在总控 PRD 中明确不可破坏的链路：

```text
客户浏览与下单链路
老板端截图识别链路
老板端草稿确认链路
店员补图链路
商品管理链路
订单确认、库存与审计链路
```

5. 在总控 PRD 中明确真实迁移默认只改页面层，不改：

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

6. 在总控 PRD 中把真实迁移拆成 A-L 模块，要求每个模块单独执行、单独验证、单独停下等待用户确认。
7. 明确真实代码迁移模块必须运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

### 安全与边界验证

本轮没有修改真实业务代码。

真实业务代码 diff 为空：

```powershell
git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

总控 PRD 与执行日志未命中未完成占位标记。

### 当前状态

真实迁移总控 PRD 已完成。下一步如果用户确认进入真实迁移，应从总控 PRD 的模块 A：迁移前基线审计与文件清单冻结开始，不应直接进入页面实现。

## 2026-05-13 今日收尾与明日交接

### 今日完成总览

今天完成了高端女装商城客户侧 HTTP 原型、管理工作台 V4 HTTP 原型、真实迁移安全计划和总控 PRD 的串联整理。当前已经确认的核心交付物如下：

```text
docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md
docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md
docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
docs/prototypes/high-fashion-mall-ui/
```

### 今日已确认的产品结论

1. 客户侧采用高端女装商城视觉：黑白、高留白、圆角卡片、轻阴影、克制字号、底部悬浮导航。
2. 客户首页右上角保留 `管理` 入口，但不进入客户底部导航。
3. 管理端右上角保留 `商城` 入口，用于返回客户商城。
4. 管理工作台不做传统后台表格，而是继续高端女装商城风格。
5. 管理端底部导航固定为：

```text
工作台
商品管理
订单确认
```

6. 工作台首页只保留三项业务入口：

```text
截图识别
草稿确认
店员补图
```

7. 商品管理和订单确认迁入管理端底部导航独占页面，不再作为工作台首页入口卡重复出现。
8. 真实迁移不能损伤现有 OCR、草稿确认、补图、商品上架、订单确认、库存、审计、客户下单授权链路。

### 今日明确没有做的事情

1. 没有开始真实微信小程序页面迁移。
2. 没有修改 `src/` 下的真实业务页面。
3. 没有修改 `src/domain/`、`src/features/`、`src/services/`。
4. 没有修改 `backend/` 或 `cloudfunctions/`。
5. 没有修改 `src/pages.json`、`package.json`、`pnpm-lock.yaml`。
6. 没有新增购物袋、收藏、地址、支付、物流、退款、优惠券、评论等真实数据模型。
7. 没有把 HTTP 原型假数据迁入真实页面。

### 明日继续入口

明天如果继续做真实迁移，不要直接修改页面。第一步应打开并执行：

```text
docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md
模块 A：迁移前基线审计与文件清单冻结
```

模块 A 的目标是先冻结真实迁移文件清单，确认每个后续模块会改什么、不改什么，并再次核对真实业务代码 diff 为空。模块 A 完成并经用户确认后，才进入模块 B：客户首页与管理入口真实迁移。

### 明日开工前必须复核

1. 重新阅读真实迁移总控 PRD。
2. 重新阅读客户侧 UI PRD 与管理端 UI PRD。
3. 输出 Repository Impact Map。
4. 输出 Execution Plan。
5. 确认 `git diff -- src backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 为空。
6. 确认本轮只做一个模块，完成后停下等待用户验收。

### 明日仍然必须保护的链路

```text
客户浏览商品不触发登录
只有下单时触发微信登录和手机号授权
取消授权不创建订单
客户侧只展示已上架商品
截图识别继续走现有上传与 OCR 链路
草稿确认继续走现有草稿编辑和批量确认链路
店员补图继续走现有补图任务链路
商品上架继续走现有 owner-products / CloudBase facade
订单确认和取消继续走现有 owner-orders / CloudBase facade
库存扣减与审计规则不变
页面层不直接写 repository、mockDb 或 CloudBase 集合
```

### 今日最终状态

今天的工作已经记录完毕。真实迁移计划已具备明天继续执行的入口，但尚未进入实现阶段。下一次开工应从总控 PRD 模块 A 开始。
