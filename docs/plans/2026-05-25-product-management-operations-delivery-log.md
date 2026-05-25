# 2026-05-25 商品管理运营能力补齐交付日志

## Repository Impact Map

本轮 PRD 约束文件：

```text
docs/prd/2026-05-25-product-management-operations-prd.md
```

本轮完成范围：

```text
src/domain/catalog/
src/domain/order/
src/features/owner-products/
src/features/customer-product-detail/
src/features/customer-product-list/
src/features/cloudbase-mall/
src/features/mall-workflow/
src/pages/owner/products/
src/pages/customer/product-detail/
src/services/cloudbase/
src/services/repositories/
backend/src/api/
backend/src/cloudbase/
backend/src/db/
backend/src/repositories/
cloudfunctions/mallApi/
docs/prd/
docs/plans/2026-05-25-product-management-operations-delivery-log.md
```

明确未进入范围：

```text
payment
cart
logistics
coupons
refunds
multi-warehouse inventory
Cloud e Bao real-time inventory sync
new order authorization semantics
new customer checkout flow
new modules outside Product Management Operations PRD
```

保留的业务契约：

- 页面层继续走 page-facing ViewModel / facade，不直接写 repository、CloudBase 集合或订单数据。
- 客户下单授权、订单库存预占、取消释放库存语义不变。
- 商品管理增强只覆盖商品简介、SKU/库存工作台、上架前校验和客户详情展示规则。
- 客户侧只能看到已上架且满足可售过滤的商品信息。
- 生产密钥仍只通过环境变量/云端配置进入运行时，仓库不保存真实密钥。

## 模块 A：商品简介可编辑

### 已完成

- Product 主档补齐 `description` 字段。
- 商品创建、mock/repository、CloudBase/API 读写链路补齐简介传递。
- 老板商品管理页支持查看和编辑商品简介。
- 客户商品详情页展示真实商品简介；简介为空时使用兜底文案。
- 补齐 domain、feature、page-facing、CloudBase/API 与页面测试。

### 明确未做

- 未改变 SKU 合并、库存计算、订单创建或微信授权语义。
- 未引入复杂富文本、图片详情或营销文案系统。

## 模块 B：规格库存编辑工作台

### 已完成

- 老板商品管理页增加 SKU/库存工作台入口。
- 支持查看 SKU 规格、售价、库存和客户侧状态预览。
- 支持编辑规格名、售价、库存，并支持补货、清零与调整原因。
- 库存调整写入仓储/API/CloudFunction 链路，保留可审计字段。
- 补齐本地仓储、CloudBase facade、HTTP API、CloudFunction 与页面测试。

### 明确未做

- 未做多仓库、多门店库存。
- 未做云 e 宝实时库存同步。
- 未扩展支付、购物车、物流、优惠券、售后或退款。

## 模块 C：上架前校验

### 已完成

- 增加商品发布前校验规则，覆盖主图、SKU、可售库存、价格、规格名和重复规格。
- 单品上架和批量上架复用同一类校验语义。
- 老板商品管理页展示阻断原因，避免不合格商品进入客户侧。
- 后端 API 与 CloudFunction 同步执行发布校验，防止绕过前端提示。
- 客户侧列表和详情只展示真正可售的已上架商品。
- 售罄 SKU 可被选中查看状态，但不能进入下单流程。

### 明确未做

- 未进入 PRD 之外的新模块。
- 未改变订单库存预占、取消释放库存和客户下单授权主链。

## 自动化验证

本次交付收口以以下命令作为最终自动化门禁：

```powershell
pnpm.cmd run verify:full
```

结果：待本次工作树收口运行后补记。

收口运行结果：通过。

覆盖：

- `lint`：通过。
- `boundary-check`：通过。
- `test`：通过，51 个测试文件、250 个测试通过。
- `coverage`：通过，全量语句覆盖率 89.25%，分支覆盖率 76.54%。
- `type-check`：通过。
- `backend:test`：通过，12 个测试文件、51 个测试通过。
- `backend:build`：通过。
- `audit:prod`：通过，无已知漏洞。
- `audit:all`：通过，无已知漏洞。
- `mp-weixin build`：通过。
- `e2e smoke`：通过，构建产物与页面路由存在。

## 人工验收状态

- 尚未执行微信开发者工具或真机人工验收。
- 不把 `mp-weixin build` 或 `e2e smoke` 记作人工验收；它们只代表自动化构建/路由 smoke。

建议人工验收清单：

1. 老板编辑商品简介，客户详情页正确展示。
2. 老板将某个 SKU 库存改为 0，客户侧可选中查看但不可下单。
3. 老板将全部 SKU 清零，商品无法通过上架前校验。
4. 老板补库存后重新上架，客户侧可选择规格并进入下单授权流程。

## 收尾结论

- `2026-05-25-product-management-operations-prd.md` 对应的三个模块 A/B/C 已完成到自动化验证边界。
- 下一步应先做微信开发者工具/真机人工验收；通过后再考虑发布校验去重、老板商品页拆分或后续生产化优化。
