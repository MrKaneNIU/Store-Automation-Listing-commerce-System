# 高端女装商城小程序 UI 重构 PRD

## 0. 文档定位

本文档根据 `D:\CodeX\高端女装线上商城App.zip` 中的参考图，定义本项目后续“小程序页面重做”的 UI 规格和原型优先工作流。

本轮只把参考 App 的布局、间距、圆角、卡片样式、字体层级和整体风格转成可执行 PRD，并明确下一步必须先做一个可通过本地 HTTP 预览的独立 UI 原型。不把任何 PNG 当作整页背景图，也不允许在用户认可原型前改真实小程序业务代码。

本 PRD 的核心目标是：先在独立原型中把 UI 视觉构建到用户认可，再在不改变业务逻辑、接口、数据结构的前提下，把最终确认的 UI 迁移到当前小程序客户侧商城页面和相关购物路径。

## 1. 参考来源

### 1.1 ZIP 内容

参考包包含以下主要页面：

1. 登录、注册、忘记密码。
2. 首页、商品分类、商品列表、筛选、排序。
3. 商品详情、尺码选择、收藏、评论。
4. 购物袋、优惠码、结账、收货地址、支付卡。
5. 收藏、个人中心、订单、设置。
6. 视觉搜索拍照、裁剪、查找。

### 1.2 尺寸换算

参考图统一为 `1500px` 宽，按微信小程序常用 `750rpx` 设计稿换算：

```text
1500px = 750rpx
1 PNG px = 0.5rpx
1rpx = 2 PNG px
```

后续实现时所有页面参数使用 `rpx`。优先验收 iPhone 12/13/14 的 390px 逻辑宽度，同时兼容 375px 和 414px 宽度，不允许横向滚动。

## 2. 实现边界

### 2.1 可以重做

后续分为两个阶段：先做独立 HTTP 原型，后做真实小程序迁移。原型阶段可以自由重做以下展示层内容：

1. 页面布局。
2. 标题、说明、按钮、标签、卡片的视觉呈现。
3. 商品列表的列表/双列网格切换样式。
4. 商品详情的图片画廊、规格选择、价格区、底部购买按钮。
5. 客户购物路径的底部导航视觉。
6. 空状态、加载态、错误态、Toast 文案呈现。
7. 页面本地状态，例如当前 tab、选中规格、弹窗打开状态、列表展示模式。

### 2.2 禁止修改

在用户确认“UI 构建完毕，可以写入真实项目”之前，禁止修改：

1. `src/domain/` 的实体类型和业务规则。
2. `src/features/` 的业务用例含义。
3. `src/services/` 的接口、provider、repository、CloudBase 调用方式。
4. `backend/`、`cloudfunctions/` 的 API 和数据结构。
5. 商品、SKU、订单、库存、OCR、权限、登录授权的数据合同。
6. 客户“浏览不登录，点击下单才触发微信登录和手机号授权”的规则。
7. 页面绕过 ViewModel / Facade 直接写 repository、mockDb 或 CloudBase 的边界。
8. `src/pages/` 中任何真实小程序页面。
9. `src/pages.json`、`package.json`、`pnpm-lock.yaml` 等真实项目配置。

### 2.3 明确禁止的实现方式

1. 不得把参考 PNG 作为整页背景图。
2. 不得把参考图切成大图覆盖页面。
3. 不得把静态假商品写进真实业务存储。
4. 不得新增重型 UI 依赖，除非单独说明原因并获得批准。
5. 不得为了视觉相似而改变路由、接口字段或业务数据结构。
6. 原型不得调用真实后端、CloudBase、OCR provider、上传服务、登录授权服务或 repository。

## 3. Repository Impact Map

### 3.1 本 PRD 阶段变更

本阶段只新增或修改：

```text
docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
```

### 3.2 原型阶段预计影响

用户确认进入可视化阶段后，先新增独立原型目录，例如：

```text
docs/prototypes/high-fashion-mall-ui/
```

建议文件：

```text
docs/prototypes/high-fashion-mall-ui/index.html
docs/prototypes/high-fashion-mall-ui/styles.css
docs/prototypes/high-fashion-mall-ui/app.js
docs/prototypes/high-fashion-mall-ui/assets/
```

原型目录只用于 HTTP 预览，不接入小程序运行时，不接入真实数据，不修改真实项目页面。

本地 HTTP 预览目标：

```powershell
python -m http.server 4177 --directory docs/prototypes/high-fashion-mall-ui
```

预览地址：

```text
http://localhost:4177
```

如果端口被占用，可换用其他端口，但必须把最终可访问地址告诉用户。

### 3.3 后续真实 UI 实装预计影响

只有当用户明确确认“HTTP 原型 UI 已构建完毕，可以写入真实项目”后，才允许进入真实小程序页面迁移。预计只影响页面层和必要的页面样式：

```text
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
```

如需要补齐购物袋、收藏、个人中心等小程序页面，必须另开实现计划，并先确认是否新增路由。新增路由属于 UI/导航范围，但仍不得改变业务模型。

### 3.4 后续明确不应影响

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

## 4. 设计总纲

### 4.1 整体风格

参考 App 的风格关键词：

1. 大留白。
2. 高对比黑白。
3. 极大的标题层级。
4. 圆角胶囊按钮。
5. 白色或浅灰底上的柔和卡片。
6. 商品图片占比高，文字信息克制。
7. 底部导航为大圆角悬浮容器。
8. 操作区使用大尺寸触控目标。

小程序实现时应保留这种气质：页面像“女装电商 App”，不是后台表单，也不是普通列表页。

### 4.2 色彩

```text
页面背景：#F8F8F8
主内容背景：#FFFFFF
卡片背景：#FFFFFF
商品图片占位背景：#F0F0F0
主文字：#222222
弱文字：#9A9A9A
分割线：#E8E8E8
主按钮：#050505
主按钮文字：#FFFFFF
收藏/选中黑：#050505
警示红：#E3322A
评分黄：#FDB43B
成功绿：#2FA85C
```

说明：参考图接近纯黑，但小程序实现统一使用 `#050505` 作为视觉黑，避免直接使用纯黑背景造成生硬边缘。

### 4.3 字体层级

使用微信小程序系统字体，不引入自定义字体。字号按参考图转为 `rpx`：

```text
超大首页标题：88rpx - 104rpx，line-height 1.05
页面大标题：72rpx - 88rpx，line-height 1.12
导航标题：40rpx - 44rpx
商品名：36rpx - 44rpx
品牌/副标题：28rpx - 32rpx
正文说明：28rpx - 32rpx
弱说明：24rpx - 28rpx
底部导航文字：24rpx - 28rpx
价格重点：44rpx - 64rpx
按钮文字：30rpx - 34rpx
```

字体权重：

```text
大标题：400 或 500
商品名：400 或 500
按钮：500
弱说明：400
```

不要用过多粗体。参考图的高级感来自大字号、留白和黑白对比，不来自粗重字重。

### 4.4 间距系统

```text
页面左右安全边距：32rpx
大标题顶部留白：120rpx - 180rpx，视是否使用自定义导航而定
区块间距：48rpx - 72rpx
卡片间距：28rpx - 40rpx
卡片内边距：28rpx - 40rpx
列表行内间距：20rpx - 28rpx
按钮顶部间距：32rpx - 48rpx
底部固定操作区预留：180rpx - 240rpx
```

### 4.5 圆角

```text
商品图片圆角：20rpx - 28rpx
商品列表卡片圆角：24rpx - 32rpx
输入框/选择框圆角：16rpx - 24rpx
主按钮圆角：999rpx
胶囊分类标签圆角：999rpx
底部导航容器顶部圆角：28rpx - 40rpx
悬浮收藏按钮圆角：999rpx
```

### 4.6 阴影

参考图阴影非常轻，主要用于卡片和悬浮按钮：

```text
轻卡片阴影：0 16rpx 48rpx rgba(0, 0, 0, 0.06)
悬浮按钮阴影：0 18rpx 44rpx rgba(0, 0, 0, 0.10)
底部导航阴影：0 -12rpx 32rpx rgba(0, 0, 0, 0.06)
主按钮红色氛围阴影：0 18rpx 44rpx rgba(227, 50, 42, 0.16)
```

不得使用蓝色发光、紫色渐变或重阴影。

## 5. 页面规格

### 5.1 首页

对应参考图：

```text
Main page.png
Main 2.png
Main 3.png
```

目标：进入小程序后第一屏呈现女装商城感，而不是工程入口页。

布局：

1. 顶部大图 Hero，高度建议 `1040rpx - 1120rpx`。
2. Hero 图片使用真实商品/活动图片或数据图片，不得使用整张参考 PNG。
3. Hero 底部覆盖大标题，标题字号 `88rpx - 104rpx`。
4. Hero 下方放主按钮，按钮高度 `88rpx - 96rpx`，宽度约 `320rpx`，圆角 `999rpx`。
5. 下方白色内容区展示 `New` 或中文“新品”，标题 `72rpx - 88rpx`。
6. 新品模块使用横向滚动商品卡片，卡片宽度 `296rpx - 336rpx`。
7. 底部导航悬浮在底部，容器高度 `144rpx - 168rpx`，顶部圆角 `32rpx`。

小程序映射建议：

1. `src/pages/index/index.vue` 改为商城入口首页。
2. 保留客户入口和管理入口，但管理入口只能作为右上角小入口，不抢占客户购物路径。
3. 如果暂不新增完整底部 tabbar，可先在页面内实现视觉底栏，不改业务路由。

### 5.2 商品分类/列表页

对应参考图：

```text
Catalog 1.png
Catalog 2.png
Categories.png
Categories 2.png
Filters.png
Sort by.png
```

目标：当前 `customer/product-list` 从普通纵向卡片重做为女装电商商品列表。

布局：

1. 顶部返回、标题、搜索入口，触控区不小于 `88rpx`。
2. 页面标题可使用 `40rpx - 44rpx`；大分类页可使用 `72rpx - 88rpx`。
3. 分类胶囊横向滚动，标签高度 `60rpx - 68rpx`，左右内边距 `44rpx - 56rpx`。
4. 工具栏高度 `96rpx - 112rpx`，包含筛选、排序、列表/网格切换。
5. 网格模式：双列，列间距 `34rpx - 40rpx`，图片宽约 `322rpx`，图片高约 `360rpx - 400rpx`。
6. 列表模式：卡片高度 `220rpx - 260rpx`，左图宽 `210rpx - 230rpx`，右侧展示品牌、商品名、评分、价格。
7. 收藏按钮为白色圆形悬浮按钮，尺寸 `72rpx - 84rpx`。
8. 折扣标签为红色胶囊，尺寸约 `92rpx x 48rpx`。

数据映射：

```text
product.productName -> 商品名
product.productCode -> 货号或弱信息
product.mainImageUrl -> 主图
product.minPrice -> 价格
```

禁止在页面层重新计算最低价或绕过 `getCloudBaseCustomerProductListView()`。

### 5.3 商品详情页

对应参考图：

```text
Product Card.png
Product Card/Select Size.png
Select size.png
Rating and Reviews .png
```

目标：当前 `customer/product-detail` 从基础卡片改成参考图的商品详情体验。

布局：

1. 顶部为返回、居中标题、分享或更多入口。
2. 商品图片画廊高度首屏建议 `900rpx - 1040rpx`，横向滑动。
3. 图片使用 `mode="aspectFill"` 或 `widthFix` 的真实商品图，不把参考图作为背景。
4. 图片下方规格选择区采用两个并排选择框：尺码、颜色/规格。
5. 选择框高度 `80rpx - 88rpx`，圆角 `18rpx - 24rpx`。
6. 收藏按钮尺寸 `72rpx - 84rpx`，与选择框同排或靠右悬浮。
7. 商品名使用 `64rpx - 72rpx`，价格使用 `64rpx - 76rpx`。
8. 描述文字 `30rpx - 34rpx`，line-height `1.55`。
9. 主按钮固定在底部，按钮高度 `92rpx - 104rpx`，左右边距 `32rpx`，圆角 `999rpx`。
10. 固定底部按钮必须给页面内容预留底部空间，不能遮挡描述、推荐商品或规格区。

业务映射：

```text
skus[].spec -> 规格选择
skus[].salePrice -> 价格
skus[].stock -> 是否可选由 ViewModel 提供的 isDisabled 决定
canSubmitOrder -> 主按钮是否可点
submitCustomerProductDetailOrder -> 下单命令
```

按钮文案本地化：

```text
ADD TO CART -> 加入购物袋 或 微信手机号下单
Shipping info -> 配送说明
Support -> 联系客服
```

### 5.4 购物袋/订单提交视觉

对应参考图：

```text
My Bag.png
My Bag（1）.png
My Bag/Checkout.png
My Bag/Promo Code.png
success.png
success（1）.png
```

当前项目没有完整购物袋数据模型，本 PRD 不要求新增购物袋业务结构。

后续实现选择：

1. 保守方案：商品详情点击主按钮后仍走现有“提交订单”逻辑，只把授权弹窗、订单反馈、成功反馈做成参考风格。
2. 扩展方案：新增购物袋页面前必须另写 PRD，明确是否新增本地购物袋状态、是否影响订单数据结构。

视觉规格：

1. 购物项卡片高度 `220rpx - 260rpx`。
2. 左图宽 `200rpx - 230rpx`，背景浅灰。
3. 商品名 `38rpx - 44rpx`。
4. 数量控制按钮为圆形，尺寸 `72rpx - 84rpx`。
5. 优惠码输入框高度 `88rpx - 104rpx`，右侧圆形提交按钮 `76rpx - 88rpx`。
6. 总价区大数字 `56rpx - 72rpx`。
7. 结账按钮高度 `96rpx - 104rpx`，固定底部或接近底部。

### 5.5 个人中心/收藏视觉

对应参考图：

```text
My Profile.png
My Profile/My Orders.png
Favorites/Lists.png
Favorites/Modules.png
Adding to favorites.png
```

当前项目若未实现收藏、个人中心完整功能，后续只允许做以下两类：

1. 视觉占位和入口展示。
2. 调用现有页面或现有 ViewModel 能力。

不得为了匹配参考图新增收藏、地址、支付卡等真实业务表结构。若要新增，必须单独开 PRD。

### 5.6 管理入口保留

当前项目仍有老板/店员/管理员链路。商城 UI 重做后必须保留管理入口，但不能影响客户购物体验。

建议：

1. 首页右上角放小号“管理”入口，尺寸约 `72rpx x 72rpx`。
2. 底部客户导航不放管理工作台。
3. 管理页面可后续单独重做，不套用客户侧底部导航。
4. 文案优先使用“管理员”，避免继续强化“老板”作为产品文案。

## 6. 组件规格

### 6.1 顶部栏

```text
高度：112rpx - 144rpx，不含安全区
左右边距：32rpx
图标触控区：88rpx x 88rpx
标题字号：40rpx - 44rpx
背景：#FFFFFF 或透明叠在 Hero 上
```

如果后续要实现完全自定义状态栏，需要明确修改 `pages.json` 的页面导航配置，并先确认范围。

### 6.2 底部导航

参考图底部导航是大圆角白色容器。

```text
容器高度：144rpx - 168rpx
顶部圆角：32rpx - 40rpx
容器阴影：0 -12rpx 32rpx rgba(0, 0, 0, 0.06)
单个 tab 宽度：等分
图标尺寸：48rpx - 60rpx
文字字号：24rpx - 28rpx
激活色：#050505
未激活色：#9A9A9A
底部安全区：使用 safe-area-inset-bottom
```

### 6.3 主按钮

```text
高度：92rpx - 104rpx
圆角：999rpx
背景：#050505
文字：#FFFFFF
字号：30rpx - 34rpx
左右边距：32rpx
active 态：轻微缩放到 0.98 或降低透明度
disabled 态：#D8D8D8 背景，#9A9A9A 文字
```

### 6.4 商品卡片

网格卡片：

```text
卡片宽：calc((750rpx - 32rpx * 2 - 36rpx) / 2)
图片高：360rpx - 420rpx
图片圆角：22rpx - 28rpx
商品名：38rpx - 44rpx
品牌/货号：28rpx - 32rpx，#9A9A9A
价格：40rpx - 48rpx
```

列表卡片：

```text
高度：220rpx - 260rpx
圆角：24rpx - 32rpx
内边距：20rpx - 28rpx
左图宽：210rpx - 230rpx
右侧间距：24rpx - 32rpx
```

### 6.5 表单/选择框

```text
输入框高度：120rpx - 128rpx
选择框高度：80rpx - 88rpx
圆角：18rpx - 24rpx
背景：#FFFFFF
标签字号：28rpx
输入文字：32rpx - 36rpx
边框：1rpx solid #D8D8D8
错误边框：1rpx solid #E3322A
```

## 7. 状态要求

后续 UI 实现必须覆盖：

1. 加载态：商品列表使用与卡片尺寸一致的骨架，不用全屏转圈替代。
2. 空状态：保留大留白、短文案、主操作按钮。
3. 错误态：文案说明失败原因和下一步动作。
4. 无图商品：使用浅灰占位，不破坏卡片比例。
5. 无库存 SKU：规格置灰，不允许页面自行判断库存规则。
6. 授权取消：保持现有不创建订单规则，并用参考风格展示反馈。

## 8. 验收标准

### 8.1 HTTP 原型验收

1. 必须能通过本地 HTTP 地址预览，例如 `http://localhost:4177`。
2. 原型必须是独立 HTML/CSS/JS 或同等独立静态预览，不依赖微信开发者工具。
3. 原型必须覆盖首页、商品列表、商品详情三个核心视图。
4. 原型必须支持移动端窄屏预览，重点检查 375px、390px、414px。
5. 原型不得调用真实后端、CloudBase、OCR provider、上传服务或登录授权服务。
6. 原型不得修改 `src/`、`backend/`、`cloudfunctions/`。
7. 原型中的商品、订单、收藏、购物袋都只能是假数据或静态交互，不代表真实业务实现。

### 8.2 视觉验收

1. 页面整体观感接近参考包，不再像工程 Demo。
2. 原型中可用 CSS 自定义变量模拟 `rpx` 设计参数；真实小程序迁移时全部尺寸必须使用 `rpx`。
3. iPhone 12/13/14 宽度下无横向滚动、无文字溢出。
4. 商品图、卡片、按钮、底部导航的比例接近参考图。
5. 不出现整页 PNG 背景。
6. 不出现紫蓝渐变、霓虹光效、过重阴影。
7. 商品列表和详情页在无图、长商品名、长规格名时仍不破版。
8. 用户明确认可 HTTP 原型后，才能进入真实小程序迁移。

### 8.3 工程验收

原型阶段验收：

1. HTTP 服务可启动。
2. 浏览器可打开预览地址。
3. 原型目录与真实项目代码隔离。
4. `git status` 显示真实业务代码未被改动。

后续真正改小程序代码时必须运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

如果只改文档，不需要运行上述命令，但需要核对 git diff 只包含目标文档。

### 8.4 业务验收

1. 客户仍只能看到已上架商品。
2. 客户浏览商品不触发登录。
3. 下单时才触发微信登录和手机号授权。
4. 取消授权不创建订单。
5. SKU 可选状态仍来自 ViewModel。
6. 页面不直接访问 repository、mockDb、OCR provider 或 CloudBase 集合。
7. 商品、SKU、订单、库存数据结构不变。

## 9. 分阶段建议

### 阶段 A：独立 HTTP 可视化原型

范围：

```text
docs/prototypes/high-fashion-mall-ui/
```

验收：

1. 用户能通过本地 HTTP 地址打开预览。
2. 首页、列表、详情三页接近参考 App。
3. 原型不接入真实业务代码。
4. 原型不修改 `src/`、`backend/`、`cloudfunctions/`。
5. 用户可以逐轮提出视觉修改，直到确认 UI 构建完毕。

### 阶段 B：HTTP 原型补齐购物反馈和授权视觉

范围：

1. 商品详情下单反馈静态交互。
2. 授权确认弹窗文案。
3. 订单成功反馈静态视图。
4. 购物袋、收藏、个人中心只做视觉占位，不做真实数据结构。

验收：

1. 视觉接近购物袋/成功页参考。
2. 不新增购物袋数据结构。
3. 不触发真实授权或真实订单创建。

### 阶段 C：用户确认与真实小程序迁移计划

只有在用户明确确认 HTTP 原型 UI 已构建完毕后才进入。

进入条件：

1. 用户确认最终原型版本。
2. 列出从原型迁移到真实小程序的文件清单。
3. 明确哪些只迁移视觉，哪些需要新增路由。
4. 明确仍不改变业务逻辑、接口和数据结构。
5. 明确测试策略。

### 阶段 D：真实小程序页面迁移

范围：

```text
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/customer/product-detail/index.vue
```

验收：

1. 迁移后的真实页面与已确认 HTTP 原型一致。
2. 不改业务逻辑、接口或数据结构。
3. 不新增未批准的真实业务功能。
4. `pnpm.cmd run verify` 通过。
5. `pnpm.cmd run verify:full` 通过。

## 10. 当前结论

可以按参考包重做页面视觉，但第一轮必须先做独立 HTTP 可视化原型，而不是直接写入真实小程序页面。原型先覆盖客户商城首页、商品列表、商品详情三页，让用户在浏览器中直接预览和反复调整，直到用户确认 UI 构建完毕。

只有用户确认原型后，才能把最终 UI 迁移进真实项目。不要在第一轮把购物袋、收藏、地址、支付卡、评论、视觉搜索全部做成真实业务功能。它们可以作为原型视觉参考或后续阶段，但不能混入当前已稳定的商品、订单、库存、授权业务合同。
