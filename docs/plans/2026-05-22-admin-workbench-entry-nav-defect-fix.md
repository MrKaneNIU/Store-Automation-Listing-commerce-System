# 2026-05-22 管理工作台入口与底部导航缺陷修复

## 问题

- 实机/开发者工具截图显示小程序启动后直接进入管理登录页，不符合 PRD “点击管理工作台入口且无会话时显示登录页”的门禁边界。
- 管理工作台底部导航在截图中显示为 `?????`，不符合 PRD 固定四项：“工作台 / 商品管理 / 订单确认 / 更多”。

## 修复

- `src/pages.json` 将 `pages/index/index` 恢复为首个页面，`pages/login/index` 仅保留为管理域登录页，不再作为小程序启动页。
- `src/pages.json` 页面标题统一修复为可读中文，避免路由标题继续携带乱码或英文占位。
- `src/pages/owner/dashboard/index.vue`、`src/pages/owner/products/index.vue`、`src/pages/owner/orders/index.vue` 的底部导航文案修复为四项中文，并保持 4 列布局。
- 新增 `src/app/pages-config.test.ts` 覆盖启动页顺序，防止登录页再次被放到第一项。

## 验证

- `pnpm.cmd run test -- src/app/pages-config.test.ts src/app/routes-more.test.ts`：通过，41 个测试文件、180 个测试通过。
- `pnpm.cmd run verify:full`：通过，覆盖 lint、boundary-check、test、coverage、type-check、backend:test、backend:build、audit:prod、audit:all、mp-weixin build 与 e2e smoke。
- 文本核对：`dist/build/mp-weixin/app.json` 首项为 `pages/index/index`，第二项为 `pages/login/index`。
- 文本核对：`dist/build/mp-weixin/pages/owner/**` 未再命中 `???`，构建产物中的“工作台 / 商品管理 / 订单确认 / 更多”均为中文。

## 未完成

- 仍需在微信开发者工具或真机重新导入/刷新 `dist/build/mp-weixin` 后做人工验收。
- 本记录不把 `mp-weixin build` 或 `e2e smoke` 视为人工验收。
