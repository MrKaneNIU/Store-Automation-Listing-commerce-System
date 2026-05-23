# 2026-05-21 管理工作台账号密码登录执行日志

## 模块 1

### 已完成
- 新增管理工作台账号密码会话服务，支持 `admin / 123456` 初始账号。
- 新增管理工作台登录页 `/pages/login/index`。
- 将管理工作台首页加上未登录回跳门禁，未登录时先回到登录页。
- 补齐模块 1 对应单测。

### 验证
- `pnpm.cmd run test -- src/services/auth/admin-workbench-session.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/pages/login/index.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run type-check`

### 明确未做
- 未进入模块 2。
- 未改动客户侧浏览、OCR、商品、订单、库存主链。
- 未引入新的 CloudBase 账号体系实现。

## 模块 2

### 已完成
- 为所有管理端页面新增统一门禁。
- 未登录时统一回跳 `/pages/login/index`。

### 验证
- `pnpm.cmd run test -- src/features/admin-workbench-auth/admin-workbench-guard.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run type-check`

### 明确未做
- 未改动任何业务页面逻辑。
- 未进入权限管理、首页设置、账号管理模块。

## 模块 3

### 已完成
- 底部导航统一为四项：工作台、商品管理、订单确认、更多。
- 新增 `更多` 页，且只承载三个设置入口占位。

### 验证
- `pnpm.cmd run test -- src/app/routes-more.test.ts src/app/navigation.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run type-check`

### 明确未做
- 未实现权限管理、首页设置、账号管理的真实配置功能。
- 未改动客户侧业务链路。

## 模块 4

### 已完成
- 新增管理账号权限模型，覆盖创建者、老板、员工三类角色。
- 支持创建者授权老板、老板在自身范围内授权员工。
- 支持禁用账号权限，并记录授权/禁用操作日志。
- 新增权限管理页面，并从 `更多` 页进入。
- 登录会话接入授权账号校验，已授权账号可使用初始密码登录。

### 验证
- `pnpm.cmd run test -- src/features/admin-permissions/admin-permissions.test.ts src/services/auth/admin-workbench-session.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/features/admin-workbench-auth/admin-workbench-guard.test.ts src/app/routes-more.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run type-check`

### 明确未做
- 未进入首页设置模块。
- 未进入账号改密模块。
- 未改动客户侧、OCR、商品、订单、库存主链。

## 模块 5

### 已完成
- 新增首页设置功能模块，支持背景、标题第一行、标题第二行、宣传内容的读取、预览与保存。
- 新增管理端首页设置页，可从“更多”页进入，页面继续走管理工作台登录门禁。
- 首页展示层改为读取首页设置，保存后再次展示首页会反映最新标题、宣传内容与背景样式。
- “更多”页第二个入口已接到首页设置页；同时恢复该页底部导航“工作台”入口到工作台路由，避免破坏模块 3 导航语义。
- 修复模块 4 遗留的 session service 反向依赖 feature 的边界问题：会话服务只保存会话，账号密码与权限校验回到 admin-workbench-auth feature。
- 修复工作台页一个已存在的底部导航模板闭合标签破损，使 mp-weixin 构建可以继续。

### 验证
- `pnpm.cmd run test -- src/features/homepage-settings/homepage-settings.test.ts src/app/routes-more.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run type-check`
- `pnpm.cmd run test -- src/services/auth/admin-workbench-session.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/features/admin-workbench-auth/admin-workbench-guard.test.ts src/features/admin-permissions/admin-permissions.test.ts src/features/homepage-settings/homepage-settings.test.ts src/app/routes-more.test.ts`
- `pnpm.cmd run verify:full`：lint、boundary-check、test、coverage、type-check、backend:test、backend:build 已通过；停在 `audit:prod`。
- `pnpm.cmd run e2e:smoke`：通过，mp-weixin 构建产物与页面路由存在。
- `pnpm.cmd run audit:prod`：失败，既有生产依赖链 `. > tencentcloud-sdk-nodejs > uuid` 存在 `uuid < 11.1.1` moderate 漏洞（GHSA-w5hq-g745-h8pq）。

### 明确未做
- 未进入模块 6 账号管理/改密码。
- 未改商品、订单、OCR、客户会话、库存、上传等业务语义。
- 首页设置当前为 MVP 内存态配置，未扩展 CloudBase 持久化或后台数据模型。
- 未处理 `tencentcloud-sdk-nodejs > uuid` 依赖审计阻塞；该项需单独依赖治理任务。

### 模块 5 剩余缺口补齐
- 针对 `audit:prod` 阻塞，确认漏洞来自生产依赖链 `. > tencentcloud-sdk-nodejs > uuid@9.0.1`。
- 在 `package.json` 的 `pnpm.overrides` 中将 `uuid` 固定到 `11.1.1`，并同步更新 `pnpm-lock.yaml` 与本地安装面。
- `pnpm.cmd why uuid` 已确认 `tencentcloud-sdk-nodejs@4.1.235` 解析到 `uuid@11.1.1`。
- `pnpm.cmd run audit:prod`：通过，无已知漏洞。
- `pnpm.cmd run verify:full`：通过，覆盖 lint、boundary-check、test、coverage、type-check、backend test/build、audit:prod、audit:all、mp-weixin build 与 e2e smoke。

## 模块 6

### 已完成
- 账号管理第一版只实现“修改密码”。
- 登录密码从固定常量升级为运行期账号密码表，默认账号仍支持 `admin / 123456`。
- 修改密码必须校验旧密码，新密码至少 6 位，并校验两次输入一致。
- 修改成功后当前管理会话立即失效，旧密码无法再次登录，新密码可重新登录。
- 新增账号管理页，可从“更多”页第三个入口进入；页面继续走管理工作台登录门禁。
- 新增账号管理路由与页面注册。

### 验证
- `pnpm.cmd run test -- src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/features/admin-workbench-auth/admin-workbench-guard.test.ts src/app/routes-more.test.ts src/pages/login/index.test.ts`：通过，40 个测试文件、178 个测试通过。
- `pnpm.cmd run lint`：通过。
- `pnpm.cmd run type-check`：通过。
- `pnpm.cmd run verify:full`：通过，覆盖 lint、boundary-check、test、coverage、type-check、backend test/build、audit:prod、audit:all、mp-weixin build 与 e2e smoke。

### 明确未做
- 未进入模块 7 验证与文档同步之外的额外收尾。
- 未实现找回密码闭环、第三方登录、微信登录或 CloudBase 持久化账号体系。
- 未改商品、订单、OCR、客户侧、首页设置、权限授权语义。

## 模块 7

### 已完成
- 对模块 1 至模块 6 的实现进行统一自动化验证。
- 确认执行日志已记录各模块独立验证结果与明确未做边界。
- 保持 PRD、实现与交付状态同步：模块 1-6 已实现，模块 7 完成本轮验证与文档同步收尾。

### 验证
- `pnpm.cmd run verify:full`：通过。
  - `lint`：通过。
  - `boundary-check`：通过。
  - `test`：通过，40 个测试文件、178 个测试通过。
  - `coverage`：通过，全量语句覆盖率 88.29%。
  - `type-check`：通过。
  - `backend:test`：通过，12 个测试文件、49 个测试通过。
  - `backend:build`：通过。
  - `audit:prod`：通过，无已知漏洞。
  - `audit:all`：通过，无已知漏洞。
  - `mp-weixin build`：通过。
  - `e2e smoke`：通过，构建产物与页面路由存在。

### 人工验收状态
- 尚未执行真机或微信开发者工具人工验收。
- 本次不把 `mp-weixin build` 或 `e2e smoke` 记作人工验收，只记录为自动化构建/路由 smoke。

### 明确未做
- 未新增模块 7 之外的新业务能力。
- 未改商品、订单、OCR、客户侧、库存、上传、首页设置、权限授权、账号改密之外的业务语义。
- 未实现 CloudBase 持久化账号体系、找回密码闭环、第三方登录、微信登录、支付、物流、购物车、收藏等非目标能力。

### 收尾结论
- `2026-05-21-admin-workbench-account-auth-prd.md` 对应的模块化实现已完成到模块 7 自动验证与文档同步边界。
- 下一步如需继续，应先进行微信开发者工具/真机人工验收，并在通过后再考虑持久化账号体系或生产化安全加固。
