# VX Close System

## Harness Engineering Baseline

The current MVP is protected by the repository harness documented in:

- `AGENTS.md`
- `docs/plans/2026-05-08-harness-hardening-delivery-log.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/module-boundaries.md`
- `docs/testing/test-strategy.md`
- `docs/quality/review-checklist.md`

Routine verification:

```powershell
pnpm.cmd run verify
```

Full build-affecting verification:

```powershell
pnpm.cmd run verify:full
```

uni-app + Vue 3 + TypeScript 的微信小程序工程骨架，已预装 TDesign MiniProgram 和 Vant Weapp。

## 技术栈

- uni-app Vue 3 Vite 模板
- TypeScript
- TDesign MiniProgram
- Vant Weapp
- 微信小程序构建目标：`mp-weixin`

## 常用命令

```bash
pnpm install
pnpm run dev:mp-weixin
pnpm run build:mp-weixin
pnpm run type-check
```

也可以使用 npm。Windows PowerShell 如遇到 npm 脚本执行策略限制，可使用 `npm.cmd`：

```powershell
npm.cmd install
npm.cmd run dev:mp-weixin
npm.cmd run build:mp-weixin
npm.cmd run type-check
```

## 微信开发者工具

1. 运行 `npm.cmd run dev:mp-weixin` 或 `npm.cmd run build:mp-weixin`。
2. 在微信开发者工具中导入 `dist/dev/mp-weixin` 或 `dist/build/mp-weixin`。
3. 在 `src/manifest.json` 的 `mp-weixin.appid` 中填写真实小程序 AppID。

## 组件接入

首页已在 `src/pages.json` 的页面级 `usingComponents` 中声明：

- `t-button`: `tdesign-miniprogram/button/button`
- `van-button`: `@vant/weapp/button/index`

新增页面时，建议继续按页面级 `usingComponents` 声明所需组件，避免全局组件过多。

## 产品级目录边界

```text
docs/prd/          每次任务前指定的 PRD 文档
docs/plans/        已确认的开发计划
src/app/           路由、导航、角色等应用级配置
src/domain/        领域类型和核心业务规则
src/features/      跨领域业务流程编排
src/services/      OCR、上传、仓储等可替换服务
src/pages/         小程序页面，保持展示和交互为主
```

当前 MVP 先使用 mock 服务跑通闭环：

```text
批量截图上传 -> Mock OCR -> 商品草稿 -> 老板确认 -> SPU/SKU -> 店员补图 -> 老板上架 -> 客户下单 -> 商家确认订单
```

客户侧下单已从“手填姓名/手机号”升级为 Mock 微信快捷登录和 Mock 微信手机号授权：

```text
客户浏览商品 -> 选择规格 -> 点击微信手机号下单 -> Mock 微信登录 -> Mock 手机号授权 -> 创建待商家确认订单
```

后续接真实 OCR/AI 时，优先替换 `src/services/ocr`，不把识别逻辑写进页面。

后续接真实微信登录/手机号授权时，优先替换 `src/services/auth`，不重写客户商品详情页主流程。

## 验证

```powershell
pnpm.cmd run type-check
pnpm.cmd test
pnpm.cmd run build:mp-weixin
```

## 当前验收基线

2026-05-08 已完成客户侧微信快捷登录与手机号授权下单闭环，并完成全量功能测试。当前基线包括：

1. 2026-05-07 已跑通商城 MVP Mock 闭环，并完成一次人工验收。
2. 2026-05-08 已完成 Mock 微信登录、Mock 手机号授权、授权客户下单、订单手机号兼容展示，以及取消授权不创建订单/不扣库存保护。
3. 当前验证结果：7 个测试文件、27 条测试全部通过；类型检查通过；生产依赖和全量依赖审计无已知漏洞；`mp-weixin` 构建通过。

交付记录见：

- `docs/plans/2026-05-07-mall-mvp-delivery-log.md`
- `docs/plans/2026-05-08-customer-wechat-auth-order-delivery-log.md`
