# Page Feature Service Boundary Map

## customer-product-detail

### src/pages/customer/product-detail/index.vue

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../features/customer-product-detail/customer-product-detail`
- `../../../features/cloudbase-mall/customer-product-detail`
- `../../../features/cloudbase-mall/customer-favorites`
- `../../../features/customer-favorites/customer-favorites`
- `../../../features/cloudbase-mall/customer-shopping-bag`
- `../../../services/auth/cloudbase-wechat-auth-service`
- ViewModel/Facade calls/import hints: `../../../features/customer-product-detail/customer-product-detail`, `../../../features/cloudbase-mall/customer-product-detail`, `../../../features/cloudbase-mall/customer-favorites`, `../../../features/customer-favorites/customer-favorites`, `../../../features/cloudbase-mall/customer-shopping-bag`
- business-judgment keywords in page: cloudbase, phone, stock, order, publish
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=true, OCR=false, upload=false
- direct stock/order/draft/publish judgment hints: stock=true, order=true, draft=false, publish=true
- risk: P2

## customer product list

### src/pages/customer/product-list/index.vue

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../features/customer-product-list/customer-product-list`
- `../../../features/cloudbase-mall/customer-product-list`
- `../../../features/cloudbase-mall/customer-favorites`
- `../../../features/customer-favorites/customer-favorites`
- `../customer-bottom-nav`
- ViewModel/Facade calls/import hints: `../../../features/customer-product-list/customer-product-list`, `../../../features/cloudbase-mall/customer-product-list`, `../../../features/cloudbase-mall/customer-favorites`, `../../../features/customer-favorites/customer-favorites`, `../customer-bottom-nav`
- business-judgment keywords in page: cloudbase, order
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=false, upload=false
- direct stock/order/draft/publish judgment hints: stock=false, order=true, draft=false, publish=false
- risk: P2

## owner-draft-review

### src/pages/owner/draft-review/index.vue

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../features/admin-workbench-auth/admin-workbench-guard`
- `../../../features/owner-draft-review/owner-draft-review`
- `../../../features/cloudbase-mall/owner-draft-review`
- ViewModel/Facade calls/import hints: `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-draft-review/owner-draft-review`, `../../../features/cloudbase-mall/owner-draft-review`
- business-judgment keywords in page: cloudbase, ocr, stock, order, draft
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=true, upload=false
- direct stock/order/draft/publish judgment hints: stock=true, order=true, draft=true, publish=false
- risk: P2

## owner-products

### src/pages/owner/products/index.vue

- imports:
- `./useOwnerProductsPageState`
- ViewModel/Facade calls/import hints: `./useOwnerProductsPageState`
- business-judgment keywords in page: stock, order, draft, publish
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=false
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=false, upload=false
- direct stock/order/draft/publish judgment hints: stock=true, order=true, draft=true, publish=true
- risk: P2

### src/pages/owner/products/useOwnerProductsPageState.ts

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../app/routes`
- `../../../features/admin-workbench-auth/admin-workbench-guard`
- `../../../features/owner-products/owner-products`
- `../../../features/cloudbase-mall/owner-products`
- `../../../services/storage/product-image-url`
- ViewModel/Facade calls/import hints: `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-products/owner-products`, `../../../features/cloudbase-mall/owner-products`
- business-judgment keywords in page: cloudbase, stock, draft, publish
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=false, upload=false
- direct stock/order/draft/publish judgment hints: stock=true, order=false, draft=true, publish=true
- risk: P2

## owner-orders

### src/pages/owner/orders/index.vue

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../app/routes`
- `../../../features/admin-workbench-auth/admin-workbench-guard`
- `../../../features/owner-orders/owner-orders`
- `../../../features/cloudbase-mall/owner-orders`
- ViewModel/Facade calls/import hints: `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-orders/owner-orders`, `../../../features/cloudbase-mall/owner-orders`
- business-judgment keywords in page: cloudbase, phone, order
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=true, OCR=false, upload=false
- direct stock/order/draft/publish judgment hints: stock=false, order=true, draft=false, publish=false
- risk: P2

## owner screenshot import

### src/pages/owner/import-upload/index.vue

- imports:
- `@dcloudio/uni-app`
- `vue`
- `../../../domain/batch/types`
- `../../../domain/draft/types`
- `../../../app/navigation`
- `../../../app/routes`
- `../../../features/admin-workbench-auth/admin-workbench-guard`
- `../../../features/owner-screenshot-import/owner-screenshot-import`
- `../../../features/cloudbase-mall/owner-screenshot-import`
- `../../../services/storage/runtime-upload-service`
- ViewModel/Facade calls/import hints: `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-screenshot-import/owner-screenshot-import`, `../../../features/cloudbase-mall/owner-screenshot-import`
- business-judgment keywords in page: cloudbase, ocr, upload, order, draft
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=true, upload=true
- direct stock/order/draft/publish judgment hints: stock=false, order=true, draft=true, publish=false
- risk: P2

## staff-image-tasks

### src/pages/staff/image-tasks/index.vue

- imports:
- `vue`
- `@dcloudio/uni-app`
- `../../../features/admin-workbench-auth/admin-workbench-guard`
- `../../../features/staff-image-tasks/staff-image-tasks`
- `../../../features/cloudbase-mall/staff-image-tasks`
- ViewModel/Facade calls/import hints: `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/staff-image-tasks/staff-image-tasks`, `../../../features/cloudbase-mall/staff-image-tasks`
- business-judgment keywords in page: cloudbase, ocr, order
- direct bottom-layer calls: repository=false, wx.cloud=false, mock=false, cloudbase-name=true
- generates identity/phone/OCR/upload values: openid=false, customerId=false, phone=false, OCR=true, upload=false
- direct stock/order/draft/publish judgment hints: stock=false, order=true, draft=false, publish=false
- risk: P2