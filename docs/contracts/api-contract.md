# Phase 2 API Contract

## Scope

This document defines the Phase 2.4 BFF/API contract. The API uses the backend
response envelope and maps validation, authorization, missing-resource, and
business-state failures to stable error codes.

The API is not wired into mini-program pages yet. Frontend HTTP adapters belong
to a later module.

## Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-safe message"
  },
  "meta": {}
}
```

## Stable Error Codes

| Code | HTTP status | Meaning |
| --- | ---: | --- |
| `VALIDATION_ERROR` | 400 | Request body, path, or field validation failed |
| `UNAUTHORIZED` | 401 | Required mock WeChat phone authorization is missing |
| `NOT_FOUND` | 404 | Route or requested entity does not exist |
| `METHOD_NOT_ALLOWED` | 405 | Route exists but does not support the HTTP method |
| `CONFLICT` | 409 | Current resource state blocks the command |
| `INTERNAL_ERROR` | 500 | Unexpected backend failure with no stack trace exposed |

## Route Groups

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |

### OCR Batches

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/ocr-batches` | Create a mock-backed OCR batch and optional draft rows |
| `GET` | `/api/ocr-batches` | List OCR batches |
| `GET` | `/api/ocr-batches/current` | Get the latest OCR batch |

`POST /api/ocr-batches` body:

```json
{
  "imageUrls": ["cloud://page-1.png"],
  "drafts": [
    {
      "productCode": "A1023",
      "productName": "Cotton Shirt",
      "salePrice": 129,
      "spec": "Black/M",
      "stock": 2,
      "confidence": 0.96,
      "sourceImageUrl": "cloud://page-1.png"
    }
  ]
}
```

### Draft Review

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/drafts/latest` | Get latest batch and draft rows |
| `PATCH` | `/api/drafts/:draftId` | Update editable draft fields |
| `DELETE` | `/api/drafts/:draftId` | Mark a draft as deleted |
| `POST` | `/api/batches/:batchId/confirm` | Confirm draft rows and create products/SKUs |

Editable draft fields:

- `productCode`
- `productName`
- `salePrice`
- `spec`
- `stock`
- `confidence`
- `sourceImageUrl`

Batch confirmation is idempotent. Confirming an already confirmed batch returns
empty `products` and `skus` arrays and does not create duplicates.

### Products And SKUs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/published` | List published products |
| `POST` | `/api/products/:productId/publish` | Publish a product that has a main image and SKU |
| `GET` | `/api/products/:productId/skus` | List product SKUs |

### Image Tasks

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/image-tasks/pending` | List products waiting for image supplementation |
| `POST` | `/api/image-tasks/:productId/supplement` | Mark images supplemented through current mock behavior |

`POST /api/image-tasks/:productId/supplement` body:

```json
{
  "mainImageUrl": "cloud://main.png",
  "imageUrls": ["cloud://main.png", "cloud://detail.png"]
}
```

### Customer Orders

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/customer-orders` | Create an authorized mock WeChat order |
| `GET` | `/api/customer-orders/:orderId` | Get one order result |

`POST /api/customer-orders` body:

```json
{
  "productId": "product-1",
  "skuId": "sku-1",
  "quantity": 1,
  "session": {
    "customerId": "mock-customer-001",
    "nickname": "Wechat Customer",
    "phoneNumber": "13800000000",
    "authSource": "mock_wechat"
  }
}
```

`session.phoneNumber` is required. Missing phone authorization returns
`UNAUTHORIZED` and must not create an order.

### Merchant Orders

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/merchant-orders` | List merchant-visible orders |
| `POST` | `/api/merchant-orders/:orderId/confirm` | Confirm a pending order |
| `POST` | `/api/merchant-orders/:orderId/cancel` | Cancel a pending order and restore stock |

Only `pending_merchant_confirm` orders can be confirmed or canceled. Other
states return `CONFLICT`.

## Current Boundaries

- API handlers are backend-only and use the Phase 2 database repository.
- The mini-program still uses the existing in-memory repository path.
- No real WeChat auth, real OCR jobs, real object storage, payment, or UI
  adapter is included in this contract.
