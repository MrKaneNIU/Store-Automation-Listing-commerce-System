# Domain Contract

This document records the current business contract. It describes current facts,
not a future target architecture.

## Core Entities

### OcrBatch

Defined in `src/domain/batch/types.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Batch identifier |
| `status` | Current OCR batch status |
| `imageUrls` | Source screenshot URLs |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last update timestamp |

### ProductDraft

Defined in `src/domain/draft/types.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Draft identifier |
| `batchId` | Source batch |
| `productCode` | Product code extracted from screenshot |
| `productName` | Product name extracted from screenshot |
| `salePrice` | Sale price |
| `spec` | SKU specification text |
| `stock` | Stock quantity represented by the draft row |
| `confidence` | OCR confidence |
| `sourceImageUrl` | Source image for the draft |
| `status` | Draft review status |

### Product

Defined in `src/domain/catalog/types.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Product identifier |
| `productCode` | SPU grouping key |
| `productName` | Display name |
| `mainImageUrl` | Main product image |
| `imageUrls` | Detail images |
| `status` | Product lifecycle status |
| `createdFromBatchId` | Source OCR batch |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last update timestamp |

### Sku

Defined in `src/domain/catalog/types.ts`.

| Field | Meaning |
| --- | --- |
| `id` | SKU identifier |
| `productId` | Parent product |
| `productCode` | Product code copy for grouping/search |
| `spec` | Specification text |
| `salePrice` | SKU sale price |
| `stock` | Available stock |

### Order

Defined in `src/domain/order/types.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Order identifier |
| `customerName` | Customer display name |
| `customerPhone` | Authorized customer phone number |
| `customerId` | Optional internal customer ID |
| `customerAuthSource` | Optional customer auth source |
| `status` | Order status |
| `items` | Order items |
| `totalAmount` | Sum of item price times quantity |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last update timestamp |

### CustomerSession

Defined in `src/services/auth/customer-session.ts`.

| Field | Meaning |
| --- | --- |
| `customerId` | Internal customer ID |
| `openid` | WeChat identity, mock in the MVP |
| `phoneNumber` | Phone number after authorization |
| `nickname` | Optional nickname |
| `authSource` | `mock_wechat` or future `wechat` |
| `loggedInAt` | Login timestamp |
| `phoneAuthorizedAt` | Phone authorization timestamp |

## Core Business Rules

- A draft cannot be confirmed unless product code, product name, sale price, and
  spec are present and valid.
- Drafts with missing required fields are marked `needs_completion`.
- Deleted drafts are ignored by validation and product creation.
- The same `productCode` creates one product.
- The same `productCode + spec` creates one SKU.
- Repeated SKU rows merge stock.
- Products start as `pending_images` after draft confirmation.
- A product can publish only when it has a main image and at least one priced
  SKU.
- Customers can browse published products without login.
- Login and phone authorization are required only when submitting an order.
- Orders can be created only for published products with enough stock and a
  positive quantity.
- Creating an order reserves SKU stock immediately.
- Canceling a pending merchant-confirmation order restores reserved stock.
- Only `pending_merchant_confirm` orders may be confirmed or canceled.

## Core Statuses

### OcrBatchStatus

```text
uploaded
recognized
confirmed
```

### ProductDraftStatus

```text
pending
needs_completion
confirmed
deleted
```

### ProductStatus

```text
pending_images
ready_to_publish
published
```

### OrderStatus

```text
pending_merchant_confirm
confirmed
canceled
```

## State Transitions

### OCR Batch

```text
uploaded -> recognized -> confirmed
```

### Product Draft

```text
pending -> needs_completion
needs_completion -> pending
pending -> confirmed
needs_completion -> confirmed only after required fields are fixed
pending -> deleted
needs_completion -> deleted
```

### Product

```text
pending_images -> ready_to_publish -> published
```

### Order

```text
pending_merchant_confirm -> confirmed
pending_merchant_confirm -> canceled
```

## Forbidden State Transitions

- `confirmed` batch must not create duplicate products or SKUs when confirmed
  again.
- `deleted` draft must not become a product or SKU.
- `pending_images` product must not publish without a main image.
- `published` product must not return to `pending_images` in the current MVP.
- `confirmed` order must not be canceled.
- `canceled` order must not be confirmed.
- An order without authorized phone data must not be created by the authorized
  order path.
- Canceling authorization must not create an order and must not reserve stock.

## Key Business Invariants

- Product code is the SPU grouping key.
- Product code plus spec is the SKU grouping key.
- Order total equals item sale price times quantity for the current single-item
  order shape.
- Stock cannot be reserved if available stock is lower than requested quantity.
- Stock reservation and order creation must happen in the same use-case flow.
- Stock restoration happens only for pending order cancellation.
- Pages must not bypass workflow stock checks.

