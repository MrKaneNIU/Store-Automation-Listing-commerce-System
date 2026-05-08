# 2026-05-08 客户微信授权下单交付记录

## 今日目标

围绕 `docs/prd/2026-05-08-customer-wechat-auth-order-prd.md`，在不破坏 2026-05-07 商城 MVP 主闭环的前提下，把客户侧下单身份来源从“手填姓名和手机号”改为“Mock 微信快捷登录 + Mock 微信手机号授权”。

## 已完成模块

1. 客户授权模型与 Mock Auth Service：
   - 新增 `CustomerSession` 和 `CustomerAuthSource`。
   - 新增 `WechatAuthService` 接口。
   - 新增内存版 `mockWechatAuthService`，支持 `getCurrentSession()`、`login()`、`authorizePhoneNumber()`、`logout()`。
2. 订单创建参数兼容：
   - `Order` 新增可选 `customerId` 和 `customerAuthSource`。
   - 保留 `customerName` 和 `customerPhone`，老板订单页继续展示手机号。
   - 新增 `mallWorkflow.createAuthorizedOrder()`，手机号未授权时不创建订单、不扣库存。
3. 客户商品详情页下单流程改造：
   - 删除客户侧姓名和手机号输入框。
   - 下单按钮改为“微信手机号下单”。
   - 点击下单后才触发 Mock 登录和 Mock 手机号授权。
   - 授权成功后继续调用既有订单创建链路。
   - 授权取消时停留在详情页，不创建订单、不扣库存。
4. 回归验证：
   - 覆盖 Auth Service、授权下单编排、订单兼容、库存保护、老板订单页手机号展示、原商城 MVP 主链规则。

## 当前业务闭环

```text
老板批量上传云 e 宝截图
-> Mock OCR 生成商品草稿
-> 老板复核并确认草稿
-> 系统创建 SPU/SKU
-> 店员补商品图片
-> 老板上架商品
-> 客户浏览已上架商品
-> 客户选择规格并点击微信手机号下单
-> Mock 微信登录
-> Mock 微信手机号授权
-> 创建待商家确认订单并扣减库存
-> 商家确认或取消订单
```

## 关键代码位置

- `src/services/auth/customer-session.ts`：客户授权会话类型。
- `src/services/auth/wechat-auth-service.ts`：微信授权服务接口。
- `src/services/auth/mock-wechat-auth-service.ts`：Mock 微信登录与手机号授权实现。
- `src/features/customer-order/customer-order.ts`：客户微信授权下单编排。
- `src/features/mall-workflow/mall-workflow.ts`：商城主业务编排和授权订单创建入口。
- `src/domain/order/types.ts`：订单客户授权兼容字段。
- `src/pages/customer/product-detail/index.vue`：客户商品详情页微信手机号下单入口。
- `src/pages/owner/orders/index.vue`：老板订单页继续展示客户手机号。

## 测试覆盖

当前测试文件：

- `src/services/auth/mock-wechat-auth-service.test.ts`
- `src/features/customer-order/customer-order.test.ts`
- `src/features/mall-workflow/mall-workflow.test.ts`
- `src/services/ocr/mock-ocr-provider.test.ts`
- `src/domain/draft/rules.test.ts`
- `src/domain/catalog/rules.test.ts`
- `src/domain/order/rules.test.ts`

覆盖重点：

1. 未登录时 `getCurrentSession()` 返回空。
2. Mock 登录后生成 `customerId`、`openid`、`authSource`。
3. Mock 手机号授权后写入 `phoneNumber`。
4. 已授权客户下单写入 `customerPhone`、`customerId`、`customerAuthSource`。
5. 已授权客户再次下单不重复弹登录和手机号授权。
6. 授权取消时不创建订单、不扣库存。
7. 下单继续扣减 SKU 库存并阻止超卖。
8. 取消待确认订单释放库存。
9. 已确认订单不能再次取消。
10. 商品 SPU/SKU 聚合、重复 SKU 合并库存、补图上架规则保持不变。

## 验证结果

已执行并通过：

```powershell
pnpm.cmd test
pnpm.cmd run type-check
pnpm.cmd audit --prod --audit-level moderate
pnpm.cmd audit --audit-level low
pnpm.cmd run build:mp-weixin
```

结果：

- 单元测试：7 个测试文件，27 条测试全部通过。
- 类型检查：通过。
- 生产依赖审计：无已知漏洞。
- 全量依赖审计：无已知漏洞。
- 微信小程序构建：通过，输出目录为 `dist/build/mp-weixin`。
- 构建产物中已无旧的“请输入姓名”“请输入手机号”文案。

## Git 工程化基线

本轮已将项目初始化为 Git 工程，并通过 `.gitignore` 排除无关文件：

- 依赖目录：`node_modules`
- 构建产物：`dist`、`unpackage`
- 覆盖率与测试临时输出：`coverage`、`.nyc_output`
- 日志：`logs`、`*.log`、`pnpm-debug.log*` 等
- 本地环境文件：`*.local`、`.env`、`.env.*`
- IDE/系统噪声：`.idea`、`.vscode`、`.DS_Store` 等

当前项目根目录不是外部远程仓库绑定状态；如后续需要推送，需要再添加远程地址。

## 仍需遵守的产品边界

1. 不接真实微信后端。
2. 不调用真实 `code2Session`。
3. 不调用真实手机号换取接口。
4. 不接微信支付。
5. 不做正式用户中心。
6. 不修改老板端 OCR、草稿确认、商品创建、补图、上架流程。
7. 不修改店员端补图流程。
8. 不改变现有库存扣减、防超卖、取消释放库存和订单状态保护规则。

## 下一轮建议

1. 用微信开发者工具导入 `dist/build/mp-weixin`，进行人工点击验收。
2. 若验收通过，下一轮优先补持久化或真实后端接口边界。
3. 若准备接真实微信授权，只替换 `src/services/auth` 下实现，不重写商品详情页主流程。
4. 若准备接真实 OCR/AI，只替换 `src/services/ocr` 下 Provider，不把识别逻辑写入页面层。
