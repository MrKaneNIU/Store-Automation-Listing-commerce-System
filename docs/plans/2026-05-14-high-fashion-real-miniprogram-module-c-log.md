# 高端女装商城真实小程序迁移模块 C 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 C：客户商品列表真实迁移。

模块 C 的目标是将客户商品列表页迁移为高端女装商城列表视觉，同时保留已上架商品列表能力和进入商品详情的路径。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/customer/product-list/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-c-log.md
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
getCloudBaseCustomerProductListView()
uni.navigateTo({ url: `/pages/customer/product-detail/index?id=${productId}` })
```

## 2. 实施内容

1. 将 `src/pages/customer/product-list/index.vue` 从基础纵向卡片改为高端女装商城双列商品列表。
2. 保留 `products` 来自 `getCloudBaseCustomerProductListView()` 的数据流。
3. 保留 `openDetail(product.id)` 中的详情页跳转。
4. 增加无图商品占位，避免空图片导致卡片破版。
5. 对长商品名使用两行截断和 `overflow-wrap`，对货号使用单行省略。
6. 使用黑白、高留白、圆角、轻阴影、胶囊筛选感视觉，但不新增真实筛选逻辑。
7. 使用固定商品图高度和安全区底部 padding，降低 375px、390px、414px 宽度下的横向滚动风险。

## 3. 保留业务合同

1. 页面不直接读 repository、mockDb 或 CloudBase 集合。
2. 商品数据继续来自现有 ViewModel / CloudBase facade。
3. 客户侧仍只展示已上架商品，规则由现有 feature/facade 保持。
4. 点击商品仍进入现有商品详情页面。
5. 不新增购物袋、收藏、个人中心、筛选、排序或视觉搜索真实能力。
6. 不新增登录、授权、权限或订单创建逻辑。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 页面不直接读 repository | 未新增 repository / mockDb / CloudBase 集合访问 |
| 商品数据来自现有 ViewModel | 保留 `getCloudBaseCustomerProductListView()` |
| 保留详情路径 | 保留 `uni.navigateTo({ url: \`/pages/customer/product-detail/index?id=${productId}\` })` |
| 无图商品不破版 | 增加 `image-placeholder` 固定区域 |
| 长商品名不破版 | `name` 两行截断并允许长词换行 |
| 375px、390px、414px 无横向滚动 | 使用双列 `minmax(0, 1fr)`、固定图高、文本溢出保护；待人工验收确认 |
| `pnpm.cmd run verify` | 通过 |
| `pnpm.cmd run verify:full` | 通过 |

## 5. 验证证据

已运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `verify` 通过：lint、boundary-check、29 个前端/云函数测试文件共 120 个测试、coverage、type-check、12 个后端测试文件共 46 个测试、backend build、`audit:prod`、`audit:all` 均通过。
2. `verify:full` 通过：再次执行 `verify` 后，`build:mp-weixin` 完成，`smoke:mp-weixin` 报告 `E2E smoke passed: mp-weixin build artifacts and page routes are present.`。
3. `build:mp-weixin` 输出 uni-app 新版本提示，但命令退出成功，不影响本模块验证。
4. 受保护范围 diff 复核为空：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

## 6. 下一步

验证通过后，用户确认模块 C，才能进入模块 D：客户商品详情与下单授权视觉迁移。
