import { backendErrorCodes } from '../../http/errors'
import { createErrorEnvelope, createSuccessEnvelope, sendJson } from '../../http/response'
import { conflictError, notFoundError, unauthorizedError, validationError, type ApiError } from '../errors'
import {
  parseClearSkuStockInput,
  parseCreateOcrBatchInput,
  parseCustomerOrderInput,
  parseDraftPatchInput,
  parseProductDescriptionInput,
  parseRestockSkusInput,
  parseSkuUpdateInput,
  parseSupplementImagesInput,
} from '../schemas'

type BatchStatus = 'uploaded' | 'recognized' | 'confirmed'
type OcrJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying'
type DraftStatus = 'pending' | 'confirmed' | 'deleted' | 'needs_completion'
type ProductStatus = 'pending_images' | 'ready_to_publish' | 'published'
type OrderStatus = 'pending_merchant_confirm' | 'confirmed' | 'canceled'

type OcrBatch = {
  id: string
  status: BatchStatus
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

type OcrJob = {
  id: string
  batchId: string
  status: OcrJobStatus
  failureReason?: string
  retryCount: number
  createdAt: string
  updatedAt: string
}

type ProductDraft = {
  id: string
  batchId: string
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  fieldConfidence?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', number>>
  fieldSources?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', string>>
  correctionState?: 'ocr_raw' | 'manual_corrected'
  status: DraftStatus
}

type Product = {
  id: string
  productCode: string
  productName: string
  description: string
  mainImageUrl: string
  imageUrls: string[]
  status: ProductStatus
  createdFromBatchId: string
  createdAt: string
  updatedAt: string
}

type Sku = {
  id: string
  productId: string
  productCode: string
  spec: string
  salePrice: number
  stock: number
}

type OrderItem = {
  skuId: string
  productId: string
  productName: string
  productCode: string
  spec: string
  salePrice: number
  quantity: number
}

type Order = {
  id: string
  customerName: string
  customerPhone: string
  customerId?: string
  customerAuthSource?: 'mock_wechat' | 'wechat'
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export type MallApiRepository = {
  saveBatch: (batch: OcrBatch) => Promise<OcrBatch>
  updateBatch: (batch: OcrBatch) => Promise<OcrBatch>
  listBatches: () => Promise<OcrBatch[]>
  saveOcrJob: (job: OcrJob) => Promise<OcrJob>
  updateOcrJob: (job: OcrJob) => Promise<OcrJob>
  listOcrJobs: (batchId?: string) => Promise<OcrJob[]>
  saveDrafts: (drafts: ProductDraft[]) => Promise<ProductDraft[]>
  replaceDrafts: (batchId: string, drafts: ProductDraft[]) => Promise<ProductDraft[]>
  listDrafts: (batchId?: string) => Promise<ProductDraft[]>
  saveProducts: (products: Product[], skus: Sku[]) => Promise<{ products: Product[]; skus: Sku[] }>
  updateProduct: (product: Product) => Promise<Product>
  listProducts: () => Promise<Product[]>
  listSkus: (productId?: string) => Promise<Sku[]>
  updateSku: (sku: Sku) => Promise<Sku>
  saveOrder: (order: Order) => Promise<Order>
  updateOrder: (order: Order) => Promise<Order>
  listOrders: () => Promise<Order[]>
  saveInventoryLedgerEntry: (entry: {
    id: string
    skuId: string
    orderId?: string
    action: 'reserve' | 'release' | 'confirm' | 'adjust'
    quantityDelta: number
    sourceType: 'order' | 'manual'
    sourceId: string
    note: string
    createdAt: string
  }) => Promise<unknown>
}

export type MallApiContext = {
  repository: MallApiRepository
  createId: (prefix: string) => string
  now: () => string
}

type RouteRequest = {
  method?: string
  body: unknown
  params: Record<string, string>
  response: Parameters<typeof sendJson>[0]
}

type RouteHandler = (request: RouteRequest, context: MallApiContext) => Promise<void>

const sendSuccess = <T>(response: Parameters<typeof sendJson>[0], status: number, data: T): void => {
  sendJson(response, status, createSuccessEnvelope(data))
}

const sendError = (response: Parameters<typeof sendJson>[0], error: ApiError): void => {
  sendJson(response, error.statusCode, createErrorEnvelope(error.code, error.message))
}

const isApiError = (error: unknown): error is ApiError => {
  return error !== null && typeof error === 'object' && 'statusCode' in error && 'code' in error
}

export const handleApiError = (response: Parameters<typeof sendJson>[0], error: unknown): void => {
  if (isApiError(error)) {
    sendError(response, error)
    return
  }

  sendJson(
    response,
    500,
    createErrorEnvelope(backendErrorCodes.INTERNAL_ERROR, 'Internal server error'),
  )
}

const findLatestBatch = async (repository: MallApiRepository): Promise<OcrBatch | undefined> => {
  const batches = await repository.listBatches()
  return batches.at(-1)
}

const findOcrJob = async (repository: MallApiRepository, jobId: string): Promise<OcrJob> => {
  const job = (await repository.listOcrJobs()).find((item) => item.id === jobId)
  if (!job) {
    throw notFoundError('OCR job not found')
  }

  return job
}

const findDraft = async (
  repository: MallApiRepository,
  draftId: string,
): Promise<{ draft: ProductDraft; batchDrafts: ProductDraft[] }> => {
  const drafts = await repository.listDrafts()
  const draft = drafts.find((item) => item.id === draftId)
  if (!draft) {
    throw notFoundError('Draft not found')
  }

  return {
    draft,
    batchDrafts: drafts.filter((item) => item.batchId === draft.batchId),
  }
}

const listProductOrThrow = async (repository: MallApiRepository, productId: string): Promise<Product> => {
  const product = (await repository.listProducts()).find((item) => item.id === productId)
  if (!product) {
    throw notFoundError('Product not found')
  }

  return product
}

const listSkuOrThrow = async (repository: MallApiRepository, productId: string, skuId: string): Promise<Sku> => {
  const sku = (await repository.listSkus(productId)).find((item) => item.id === skuId)
  if (!sku) {
    throw notFoundError('SKU not found')
  }

  return sku
}

export const validateProductForPublish = (product: Product, skus: Sku[]): string[] => {
  const productSkus = skus.filter((sku) => sku.productId === product.id)
  const saleableSkus = productSkus.filter((sku) => sku.stock > 0)
  const normalizedSpecs = productSkus.map((sku) => sku.spec.trim()).filter(Boolean)
  const messages: string[] = []

  if (!product.mainImageUrl.trim()) {
    messages.push('缺少主图，无法上架')
  }
  if (productSkus.length === 0) {
    messages.push('没有可售规格，无法上架')
  } else if (saleableSkus.length === 0) {
    messages.push('全部规格暂无库存，请先补库存')
  }
  if (saleableSkus.some((sku) => sku.salePrice <= 0)) {
    messages.push('存在价格为 0 的规格，请先补全售价')
  }
  if (saleableSkus.some((sku) => !sku.spec.trim())) {
    messages.push('存在规格名为空的规格，请先补全规格名')
  }
  if (normalizedSpecs.length !== new Set(normalizedSpecs).size) {
    messages.push('存在重复规格，请先合并或修改')
  }

  return messages
}

const saveManualInventoryLedgerEntry = (
  context: MallApiContext,
  sku: Sku,
  quantityDelta: number,
  reason: string,
): Promise<unknown> => {
  return context.repository.saveInventoryLedgerEntry({
    id: context.createId('ledger'),
    skuId: sku.id,
    action: 'adjust',
    quantityDelta,
    sourceType: 'manual',
    sourceId: sku.id,
    note: reason,
    createdAt: context.now(),
  })
}

const listOrderOrThrow = async (repository: MallApiRepository, orderId: string): Promise<Order> => {
  const order = (await repository.listOrders()).find((item) => item.id === orderId)
  if (!order) {
    throw notFoundError('Order not found')
  }

  return order
}

const validateDraftForConfirmation = (draft: ProductDraft): string[] => {
  const issues: string[] = []
  if (!draft.productCode.trim()) issues.push('productCode is required')
  if (!draft.productName.trim()) issues.push('productName is required')
  if (!draft.spec.trim()) issues.push('spec is required')
  if (draft.salePrice <= 0) issues.push('salePrice must be greater than 0')
  return issues
}

const createProductsFromDrafts = (
  drafts: ProductDraft[],
  context: MallApiContext,
): { products: Product[]; skus: Sku[] } => {
  const productByCode = new Map<string, Product>()
  const skuByKey = new Map<string, Sku>()

  drafts
    .filter((draft) => draft.status === 'confirmed')
    .forEach((draft) => {
      let product = productByCode.get(draft.productCode)
      if (!product) {
        product = {
          id: context.createId('product'),
          productCode: draft.productCode,
          productName: draft.productName,
          description: '',
          mainImageUrl: '',
          imageUrls: [],
          status: 'pending_images',
          createdFromBatchId: draft.batchId,
          createdAt: context.now(),
          updatedAt: context.now(),
        }
        productByCode.set(draft.productCode, product)
      }

      const skuKey = `${draft.productCode}::${draft.spec}`
      const existingSku = skuByKey.get(skuKey)
      if (existingSku) {
        skuByKey.set(skuKey, { ...existingSku, stock: existingSku.stock + draft.stock })
        return
      }

      skuByKey.set(skuKey, {
        id: context.createId('sku'),
        productId: product.id,
        productCode: draft.productCode,
        spec: draft.spec,
        salePrice: draft.salePrice,
        stock: draft.stock,
      })
    })

  return {
    products: [...productByCode.values()],
    skus: [...skuByKey.values()],
  }
}

export const apiHandlers: Record<string, RouteHandler> = {
  async createOcrBatch(request, context) {
    const input = parseCreateOcrBatchInput(request.body)
    const timestamp = context.now()
    const batch = await context.repository.saveBatch({
      id: context.createId('batch'),
      status: input.drafts.length > 0 ? 'recognized' : 'uploaded',
      imageUrls: input.imageUrls,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    const drafts = await context.repository.saveDrafts(
      input.drafts.map((draft) => ({
        id: context.createId('draft'),
        batchId: batch.id,
        ...draft,
        status: 'pending',
      })),
    )
    const job = await context.repository.saveOcrJob({
      id: `job-${batch.id}`,
      batchId: batch.id,
      status: 'queued',
      retryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    sendSuccess(request.response, 201, { batch, job, drafts })
  },

  async listOcrJobs(request, context) {
    sendSuccess(request.response, 200, { jobs: await context.repository.listOcrJobs(request.params.batchId) })
  },

  async retryOcrJob(request, context) {
    const job = await findOcrJob(context.repository, request.params.jobId)
    if (job.status !== 'failed') {
      throw conflictError('Only failed OCR jobs can be retried')
    }

    const updated = await context.repository.updateOcrJob({
      ...job,
      status: 'retrying',
      failureReason: undefined,
      retryCount: job.retryCount + 1,
      updatedAt: context.now(),
    })
    sendSuccess(request.response, 200, { job: updated, drafts: await context.repository.listDrafts(job.batchId) })
  },

  async listOcrBatches(request, context) {
    sendSuccess(request.response, 200, { batches: await context.repository.listBatches() })
  },

  async getCurrentOcrBatch(request, context) {
    const batch = await findLatestBatch(context.repository)
    sendSuccess(request.response, 200, { batch: batch ?? null })
  },

  async getLatestDrafts(request, context) {
    const batch = await findLatestBatch(context.repository)
    const drafts = batch ? await context.repository.listDrafts(batch.id) : []
    sendSuccess(request.response, 200, { batch: batch ?? null, drafts })
  },

  async updateDraft(request, context) {
    const patch = parseDraftPatchInput(request.body)
    const { draft, batchDrafts } = await findDraft(context.repository, request.params.draftId)
    const updatedDraft = { ...draft, ...patch }
    await context.repository.replaceDrafts(
      draft.batchId,
      batchDrafts.map((item) => (item.id === draft.id ? updatedDraft : item)),
    )

    sendSuccess(request.response, 200, { draft: updatedDraft })
  },

  async deleteDraft(request, context) {
    const { draft, batchDrafts } = await findDraft(context.repository, request.params.draftId)
    const deletedDraft = { ...draft, status: 'deleted' as const }
    await context.repository.replaceDrafts(
      draft.batchId,
      batchDrafts.map((item) => (item.id === draft.id ? deletedDraft : item)),
    )

    sendSuccess(request.response, 200, { draft: deletedDraft })
  },

  async confirmBatch(request, context) {
    const batch = (await context.repository.listBatches()).find((item) => item.id === request.params.batchId)
    if (!batch) {
      throw notFoundError('Batch not found')
    }
    if (batch.status === 'confirmed') {
      sendSuccess(request.response, 200, { issues: [], products: [], skus: [] })
      return
    }

    const currentDrafts = await context.repository.listDrafts(batch.id)
    const issues = currentDrafts
      .filter((draft) => draft.status !== 'deleted')
      .flatMap((draft) => validateDraftForConfirmation(draft).map((message) => ({ draftId: draft.id, message })))
    const confirmedDrafts = currentDrafts.map((draft) => {
      if (draft.status === 'deleted') return draft
      return { ...draft, status: issues.some((issue) => issue.draftId === draft.id) ? 'needs_completion' : 'confirmed' } as ProductDraft
    })
    await context.repository.replaceDrafts(batch.id, confirmedDrafts)

    if (issues.length > 0) {
      sendSuccess(request.response, 200, { issues, products: [], skus: [] })
      return
    }

    const catalog = createProductsFromDrafts(confirmedDrafts, context)
    await context.repository.saveProducts(catalog.products, catalog.skus)
    await context.repository.updateBatch({ ...batch, status: 'confirmed', updatedAt: context.now() })
    sendSuccess(request.response, 200, { issues: [], ...catalog })
  },

  async listProducts(request, context) {
    sendSuccess(request.response, 200, { products: await context.repository.listProducts() })
  },

  async listPublishedProducts(request, context) {
    const products = await context.repository.listProducts()
    const skus = await context.repository.listSkus()
    const publishedProducts = products.filter((product) => product.status === 'published' && validateProductForPublish(product, skus).length === 0)
    sendSuccess(request.response, 200, { products: publishedProducts })
  },

  async updateProductDescription(request, context) {
    const input = parseProductDescriptionInput(request.body)
    const product = await listProductOrThrow(context.repository, request.params.productId)
    const updated = await context.repository.updateProduct({
      ...product,
      description: input.description,
      updatedAt: context.now(),
    })
    sendSuccess(request.response, 200, { product: updated })
  },

  async publishProduct(request, context) {
    const product = await listProductOrThrow(context.repository, request.params.productId)
    const skus = await context.repository.listSkus(product.id)
    const publishMessages = validateProductForPublish(product, skus)
    if (publishMessages.length > 0) {
      throw conflictError(publishMessages[0])
    }

    const updated = await context.repository.updateProduct({
      ...product,
      status: 'published',
      updatedAt: context.now(),
    })
    sendSuccess(request.response, 200, { product: updated })
  },

  async listSkus(request, context) {
    await listProductOrThrow(context.repository, request.params.productId)
    sendSuccess(request.response, 200, { skus: await context.repository.listSkus(request.params.productId) })
  },

  async updateSku(request, context) {
    const input = parseSkuUpdateInput(request.body)
    await listProductOrThrow(context.repository, request.params.productId)
    const sku = await listSkuOrThrow(context.repository, request.params.productId, request.params.skuId)
    const updated = await context.repository.updateSku({
      ...sku,
      spec: input.spec,
      salePrice: input.salePrice,
      stock: input.stock,
    })
    const quantityDelta = input.stock - sku.stock
    if (quantityDelta !== 0) {
      await saveManualInventoryLedgerEntry(context, sku, quantityDelta, input.reason)
    }

    sendSuccess(request.response, 200, { sku: updated })
  },

  async restockSkus(request, context) {
    const input = parseRestockSkusInput(request.body)
    await listProductOrThrow(context.repository, request.params.productId)
    const updatedSkus: Sku[] = []

    for (const sku of await context.repository.listSkus(request.params.productId)) {
      updatedSkus.push(await context.repository.updateSku({ ...sku, stock: sku.stock + input.quantity }))
      await saveManualInventoryLedgerEntry(context, sku, input.quantity, input.reason)
    }

    sendSuccess(request.response, 200, { skus: updatedSkus })
  },

  async clearSkuStock(request, context) {
    const input = parseClearSkuStockInput(request.body)
    await listProductOrThrow(context.repository, request.params.productId)
    const updatedSkus: Sku[] = []

    for (const sku of await context.repository.listSkus(request.params.productId)) {
      updatedSkus.push(await context.repository.updateSku({ ...sku, stock: 0 }))
      if (sku.stock !== 0) {
        await saveManualInventoryLedgerEntry(context, sku, -sku.stock, input.reason)
      }
    }

    sendSuccess(request.response, 200, { skus: updatedSkus })
  },

  async listPendingImageTasks(request, context) {
    const products = (await context.repository.listProducts()).filter((product) => product.status === 'pending_images')
    sendSuccess(request.response, 200, { products })
  },

  async supplementProductImages(request, context) {
    const input = parseSupplementImagesInput(request.body)
    const product = await listProductOrThrow(context.repository, request.params.productId)
    const updated = await context.repository.updateProduct({
      ...product,
      mainImageUrl: input.mainImageUrl,
      imageUrls: input.imageUrls,
      status: 'ready_to_publish',
      updatedAt: context.now(),
    })
    sendSuccess(request.response, 200, { product: updated })
  },

  async createCustomerOrder(request, context) {
    const input = parseCustomerOrderInput(request.body)
    if (!input.session.phoneNumber) {
      throw unauthorizedError('Wechat phone authorization is required before ordering')
    }

    const product = await listProductOrThrow(context.repository, input.productId)
    const sku = (await context.repository.listSkus(product.id)).find((item) => item.id === input.skuId)
    if (!sku) {
      throw notFoundError('SKU not found')
    }
    if (product.status !== 'published' || sku.stock < input.quantity) {
      throw conflictError('Product is unpublished or stock is insufficient')
    }

    const timestamp = context.now()
    const order: Order = {
      id: context.createId('order'),
      customerName: input.session.nickname ?? 'Wechat Customer',
      customerPhone: input.session.phoneNumber,
      customerId: input.session.customerId,
      customerAuthSource: input.session.authSource ?? 'mock_wechat',
      status: 'pending_merchant_confirm',
      items: [
        {
          skuId: sku.id,
          productId: product.id,
          productName: product.productName,
          productCode: product.productCode,
          spec: sku.spec,
          salePrice: sku.salePrice,
          quantity: input.quantity,
        },
      ],
      totalAmount: sku.salePrice * input.quantity,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await context.repository.updateSku({ ...sku, stock: sku.stock - input.quantity })
    const saved = await context.repository.saveOrder(order)
    sendSuccess(request.response, 201, { order: saved })
  },

  async getCustomerOrder(request, context) {
    sendSuccess(request.response, 200, { order: await listOrderOrThrow(context.repository, request.params.orderId) })
  },

  async listMerchantOrders(request, context) {
    sendSuccess(request.response, 200, { orders: await context.repository.listOrders() })
  },

  async confirmMerchantOrder(request, context) {
    const order = await listOrderOrThrow(context.repository, request.params.orderId)
    if (order.status !== 'pending_merchant_confirm') {
      throw conflictError('Only pending merchant-confirmation orders can be confirmed')
    }

    const updated = await context.repository.updateOrder({ ...order, status: 'confirmed', updatedAt: context.now() })
    sendSuccess(request.response, 200, { order: updated })
  },

  async cancelMerchantOrder(request, context) {
    const order = await listOrderOrThrow(context.repository, request.params.orderId)
    if (order.status !== 'pending_merchant_confirm') {
      throw conflictError('Only pending merchant-confirmation orders can be canceled')
    }

    for (const item of order.items) {
      const sku = (await context.repository.listSkus()).find((currentSku) => currentSku.id === item.skuId)
      if (sku) {
        await context.repository.updateSku({ ...sku, stock: sku.stock + item.quantity })
      }
    }

    const updated = await context.repository.updateOrder({ ...order, status: 'canceled', updatedAt: context.now() })
    sendSuccess(request.response, 200, { order: updated })
  },
}

export const methodNotAllowed = (response: Parameters<typeof sendJson>[0]): void => {
  sendJson(response, 405, createErrorEnvelope(backendErrorCodes.METHOD_NOT_ALLOWED, 'Method not allowed'))
}

export const routeNotFound = (response: Parameters<typeof sendJson>[0]): void => {
  sendJson(response, 404, createErrorEnvelope(backendErrorCodes.NOT_FOUND, 'Route not found'))
}

export const ensurePathParam = (value: string | undefined, name: string): string => {
  if (!value) {
    throw validationError(`${name} path parameter is required`)
  }

  return value
}
