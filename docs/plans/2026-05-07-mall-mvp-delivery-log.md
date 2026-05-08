# 2026-05-07 商城 MVP 交付记录

## 今日目标

围绕服装店老板的小程序商城 MVP，先用 Mock OCR 跑通从截图导入到商家确认订单的完整闭环，并在人工验收前修复代码审查发现的业务与依赖安全问题。

## 已完成闭环

1. 老板端批量截图导入：支持选择、预览、删除截图并创建 OCR 批次。
2. Mock OCR 草稿生成：通过可替换的 OCR Provider 输出商品货号、商品名称、销售价、规格等草稿字段。
3. 老板端草稿确认：支持按货号分组查看、编辑、删除、提示低置信度和缺字段，并批量确认。
4. 商品与 SKU 创建：按同一 `productCode` 创建 SPU，按同一 `productCode + spec` 创建 SKU，重复 SKU 合并库存。
5. 店员补图：支持查看待补图商品、按货号/批次筛选，并通过 Mock 上传补主图和详情图。
6. 老板上架：支持查看商品状态、单个上架和批量上架。
7. 客户下单：客户侧只展示已上架商品，支持查看详情、选择规格并提交待商家确认订单。
8. 商家确认订单：支持查看订单、确认订单、取消订单。

## 今日修复的审查问题

1. 批次确认幂等：已确认批次再次确认时不会重复创建商品和 SKU。
2. 本地库存占用：客户提交订单后会扣减 SKU 本地库存，库存不足时禁止继续下单。
3. 订单状态保护：只有 `pending_merchant_confirm` 订单可以被确认或取消。
4. 取消释放库存：取消待确认订单时，会把订单占用的 SKU 库存释放回去。
5. 依赖审计：生产依赖已收敛到微信小程序目标，并通过 `pnpm audit --prod --audit-level moderate`。

## 依赖与工程收敛

1. `package.json` 只保留微信小程序目标脚本：
   - `dev:mp-weixin`
   - `build:mp-weixin`
   - `test`
   - `type-check`
2. 生产依赖裁剪为微信小程序相关包：
   - `@dcloudio/uni-app`
   - `@dcloudio/uni-components`
   - `@dcloudio/uni-mp-weixin`
   - `@vant/weapp`
   - `tdesign-miniprogram`
   - `vue`
   - `vue-i18n`
3. 通过 `pnpm.overrides` 固定审计中暴露的传递依赖安全版本。
4. 升级开发工具链以兼容审计和 TypeScript 5：
   - `typescript@5.9.3`
   - `vite@6.4.2`
   - `vue-tsc@2.2.12`
   - `@vue/tsconfig@0.9.1`

## 验证结果

人工验收前已执行以下命令并通过：

```powershell
pnpm.cmd test
pnpm.cmd run type-check
pnpm.cmd audit --prod --audit-level moderate
pnpm.cmd audit --audit-level low
pnpm.cmd run build:mp-weixin
```

结果：

- 单元测试：5 个测试文件，18 个测试全部通过。
- 类型检查：通过。
- 生产依赖审计：无已知漏洞。
- 全量依赖审计：无已知漏洞。
- 微信小程序构建：通过，输出目录为 `dist/build/mp-weixin`。

## 人工验收结论

用户已反馈：验收基本通过。

当前可作为明天继续迭代的基线。下一轮开发前仍建议先阅读：

- `docs/prd/2026-05-07-mall-mvp-prd.md`
- `docs/plans/2026-05-07-mall-mvp-framework.md`
- 本文件

## 明日建议入口

1. 先决定下一轮只做两个模块或两个任务，继续保持小步验收。
2. 若继续业务闭环，优先补充持久化方案或真实页面体验打磨。
3. 若继续 UI，优先从老板端草稿确认页、商品管理页、客户商品详情页三个高频页面开始。
4. 若准备接真实 OCR，必须只替换 `src/services/ocr` 下的 Provider，不把 OCR 调用写进页面层。

## 仍需遵守的产品边界

1. 不接入云 e 宝 API。
2. 不爬取云 e 宝数据。
3. 不保存云 e 宝账号密码。
4. 云 e 宝只作为老板主动上传截图的来源。
5. MVP 订单仍不接微信支付，订单状态先停留在商家确认流程。
