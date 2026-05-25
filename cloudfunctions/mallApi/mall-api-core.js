const SUPPORTED_ACTIONS = [
  'health',
  'listContracts',
  'createOcrBatch',
  'listOcrJobs',
  'processOcrJob',
  'retryOcrJob',
  'listOcrBatches',
  'getCurrentOcrBatch',
  'getLatestDrafts',
  'updateDraft',
  'deleteDraft',
  'confirmBatch',
  'listProducts',
  'listPublishedProducts',
  'listPublishedProductSummaries',
  'updateProductDescription',
  'updateSku',
  'restockSkus',
  'clearSkuStock',
  'publishProduct',
  'listSkus',
  'listPendingImageTasks',
  'supplementProductImages',
  'createCustomerOrder',
  'getCustomerOrder',
  'listMerchantOrders',
  'confirmMerchantOrder',
  'cancelMerchantOrder',
  'getCurrentCustomer',
  'bindCustomerPhone',
  'bindStaff',
]

const { createTencentCloudOcrProviderFromEnv } = require('./tencentcloud-ocr-provider')

const COLLECTIONS = [
  'ocr_batches',
  'product_drafts',
  'products',
  'skus',
  'orders',
  'order_items',
  'customers',
  'merchant_users',
  'staff_users',
  'role_assignments',
  'inventory_ledger',
  'operation_audit_logs',
  'uploaded_assets',
  'ocr_jobs',
]

const createSuccessEnvelope = (data, meta = {}) => ({
  success: true,
  data,
  error: null,
  meta,
})

const createErrorEnvelope = (code, message, meta = {}) => ({
  success: false,
  data: null,
  error: {
    code,
    message,
  },
  meta,
})

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const readAction = (event) => {
  if (!isRecord(event)) {
    throw validationError('Request event must be a JSON object')
  }
  if (typeof event.action !== 'string' || event.action.trim() === '') {
    throw validationError('action is required')
  }
  return event.action
}

const validationError = (message) => Object.assign(new Error(message), { code: 'VALIDATION_ERROR' })
const notFoundError = (message) => Object.assign(new Error(message), { code: 'NOT_FOUND' })
const conflictError = (message) => Object.assign(new Error(message), { code: 'CONFLICT' })
const unauthorizedError = (message) => Object.assign(new Error(message), { code: 'UNAUTHORIZED' })
const forbiddenError = (message) => Object.assign(new Error(message), { code: 'FORBIDDEN' })
const externalServiceError = (message) => Object.assign(new Error(message), { code: 'EXTERNAL_SERVICE_ERROR' })

const createHealthData = () => ({
  service: 'mall-api',
    envId: process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || 'cloud1-d7gifjyzl7721b383',
  route: 'cloudbase-function',
  supportedActions: SUPPORTED_ACTIONS.length,
})

const readString = (input, field) => {
  const value = input[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${field} is required`)
  }
  return value
}

const readOptionalString = (input, field) => {
  const value = input[field]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${field} must be a non-empty string`)
  }
  return value
}

const readOptionalStringFromRecord = (input, field) => {
  if (!isRecord(input)) return undefined
  return readOptionalString(input, field)
}

const readPositiveNumber = (input, field) => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw validationError(`${field} must be greater than 0`)
  }
  return value
}

const readNonNegativeInteger = (input, field) => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw validationError(`${field} must be a non-negative integer`)
  }
  return value
}

const readPositiveInteger = (input, field) => {
  const value = input[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw validationError(`${field} must be a positive integer`)
  }
  return value
}

const readStringArray = (input, field, message) => {
  const value = input[field]
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw validationError(message)
  }
  return value
}

const parseCreateOcrBatchInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  const drafts = value.drafts === undefined ? [] : value.drafts
  if (!Array.isArray(drafts)) throw validationError('drafts must be an array')

  return {
    imageUrls: readStringArray(value, 'imageUrls', 'imageUrls must contain at least one image URL'),
    imageAssetIds: Array.isArray(value.imageAssetIds)
      ? value.imageAssetIds.filter((assetId) => typeof assetId === 'string' && assetId.trim() !== '')
      : [],
    drafts: drafts.map((draft) => {
      if (!isRecord(draft)) throw validationError('drafts must contain draft objects')
      const confidence = draft.confidence
      if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        throw validationError('confidence must be between 0 and 1')
      }
      return {
        productCode: readString(draft, 'productCode'),
        productName: readString(draft, 'productName'),
        salePrice: readPositiveNumber(draft, 'salePrice'),
        spec: readString(draft, 'spec'),
        stock: readNonNegativeInteger(draft, 'stock'),
        confidence,
        sourceImageUrl: readString(draft, 'sourceImageUrl'),
        correctionState: ['manual_corrected', 'accepted'].includes(draft.correctionState) ? draft.correctionState : 'ocr_raw',
      }
    }),
  }
}

const parseDraftPatchInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  const allowed = ['productCode', 'productName', 'salePrice', 'spec', 'stock', 'confidence', 'sourceImageUrl', 'correctionState']
  Object.keys(value).forEach((field) => {
    if (!allowed.includes(field)) throw validationError(`${field} is not an editable draft field`)
  })
  const result = {}
  if (value.productCode !== undefined) result.productCode = readString(value, 'productCode')
  if (value.productName !== undefined) result.productName = readString(value, 'productName')
  if (value.salePrice !== undefined) result.salePrice = readPositiveNumber(value, 'salePrice')
  if (value.spec !== undefined) result.spec = readString(value, 'spec')
  if (value.stock !== undefined) result.stock = readNonNegativeInteger(value, 'stock')
  if (value.confidence !== undefined) {
    if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
      throw validationError('confidence must be between 0 and 1')
    }
    result.confidence = value.confidence
  }
  if (value.sourceImageUrl !== undefined) result.sourceImageUrl = readString(value, 'sourceImageUrl')
  if (value.correctionState !== undefined) {
    if (!['ocr_raw', 'manual_corrected', 'accepted'].includes(value.correctionState)) {
      throw validationError('correctionState must be ocr_raw, manual_corrected, or accepted')
    }
    result.correctionState = value.correctionState
  }
  if (Object.keys(result).length === 0) throw validationError('At least one draft field is required')
  return result
}

const parseSupplementImagesInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    mainImageUrl: readString(value, 'mainImageUrl'),
    imageUrls: readStringArray(value, 'imageUrls', 'imageUrls must contain at least one image URL'),
  }
}

const parseProductDescriptionInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  const description = typeof value.description === 'string' ? value.description.trim() : null
  if (description === null) throw validationError('description must be a string')
  if (description.length > 120) throw validationError('description must be 120 characters or fewer')
  return { description }
}

const parseSkuUpdateInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    spec: readString(value, 'spec').trim(),
    salePrice: readPositiveNumber(value, 'salePrice'),
    stock: readNonNegativeInteger(value, 'stock'),
    reason: readString(value, 'reason').trim(),
  }
}

const parseRestockSkusInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    quantity: readPositiveInteger(value, 'quantity'),
    reason: readString(value, 'reason').trim(),
  }
}

const parseClearSkuStockInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    reason: readString(value, 'reason').trim(),
  }
}

const parseCustomerOrderInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  if (!isRecord(value.session)) throw validationError('session is required')
  const authSource = value.session.authSource
  if (authSource !== undefined && authSource !== 'mock_wechat' && authSource !== 'wechat') {
    throw validationError('session.authSource must be mock_wechat or wechat')
  }
  return {
    productId: readString(value, 'productId'),
    skuId: readString(value, 'skuId'),
    quantity: readPositiveInteger(value, 'quantity'),
    idempotencyKey: readOptionalString(value, 'idempotencyKey'),
    session: {
      customerId: readOptionalString(value.session, 'customerId'),
      nickname: readOptionalString(value.session, 'nickname'),
      phoneNumber: readOptionalString(value.session, 'phoneNumber'),
      authSource,
    },
  }
}

const parseBindCustomerPhoneInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    phoneCode: readString(value, 'phoneCode'),
  }
}

const parseBindStaffInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    openid: readString(value, 'openid'),
    reason: readOptionalString(value, 'reason') || 'owner staff binding',
  }
}

const resolvePhoneNumberFromCode = async (phoneCode, context) => {
  if (typeof context.exchangePhoneCode === 'function') {
    try {
      return await context.exchangePhoneCode(phoneCode)
    } catch (_error) {
      throw externalServiceError('Wechat phone code exchange failed')
    }
  }
  throw validationError('Wechat phone code exchange is not configured')
}

const normalizeIdentity = (identity) => {
  if (!isRecord(identity)) return null
  const openid = readOptionalStringFromRecord(identity, 'openid') || readOptionalStringFromRecord(identity, 'OPENID')
  if (!openid) return null
  const roles = Array.isArray(identity.roles)
    ? identity.roles.filter((role) => typeof role === 'string')
    : ['customer']
  return {
    openid,
    appid: readOptionalStringFromRecord(identity, 'appid') || readOptionalStringFromRecord(identity, 'APPID'),
    unionid: readOptionalStringFromRecord(identity, 'unionid') || readOptionalStringFromRecord(identity, 'UNIONID'),
    roles: roles.length > 0 ? roles : ['customer'],
  }
}

const requireIdentity = (event) => {
  const identity = normalizeIdentity(event.identity)
  if (!identity) {
    throw unauthorizedError('Verified WeChat identity is required')
  }
  return identity
}

const hasRole = (identity, role) => identity.roles.includes(role)

const requireAnyRole = (event, roles) => {
  const identity = requireIdentity(event)
  if (!roles.some((role) => hasRole(identity, role))) {
    throw forbiddenError('Permission denied')
  }
  return identity
}

const normalizeAdminSession = (session) => {
  if (!isRecord(session)) return null
  const account = readOptionalStringFromRecord(session, 'account')
  const role = readOptionalStringFromRecord(session, 'role')
  const permissions = Array.isArray(session.permissions)
    ? session.permissions.filter((permission) => typeof permission === 'string')
    : []
  if (!account || !['creator', 'owner', 'staff'].includes(role)) return null
  return { account, role, permissions }
}

const hasAdminPermission = (session, permission) =>
  session.role === 'creator' || session.permissions.includes(permission)

const requireAdminOrResolvedAnyRole = async (event, context, roles, permission) => {
  const adminSession = normalizeAdminSession(event.adminSession)
  if (adminSession) {
    if (!hasAdminPermission(adminSession, permission)) throw forbiddenError('Permission denied')
    return adminSession
  }
  return requireResolvedAnyRole(event, context, roles)
}

const createIdFactory = () => {
  let counter = Number(process.env.MALL_API_ID_SEED || 0)
  return (prefix) => `${prefix}-${Date.now().toString(36)}-${++counter}`
}

const toBatchDocument = (batch) => ({
  _id: batch.id,
  status: batch.status,
  image_urls: batch.imageUrls,
  ...(Array.isArray(batch.imageAssetIds) ? { image_asset_ids: batch.imageAssetIds } : {}),
  created_at: batch.createdAt,
  updated_at: batch.updatedAt,
})

const toBatch = (document) => ({
  id: document._id,
  status: document.status,
  imageUrls: document.image_urls,
  ...(Array.isArray(document.image_asset_ids) ? { imageAssetIds: document.image_asset_ids } : {}),
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toOcrJobDocument = (job) => ({
  _id: job.id,
  batch_id: job.batchId,
  status: job.status,
  ...(job.failureReason ? { failure_reason: job.failureReason } : {}),
  retry_count: job.retryCount,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
})

const toOcrJob = (document) => ({
  id: document._id,
  batchId: document.batch_id,
  status: document.status,
  ...(document.failure_reason ? { failureReason: document.failure_reason } : {}),
  retryCount: document.retry_count,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toDraftDocument = (draft) => ({
  _id: draft.id,
  batch_id: draft.batchId,
  product_code: draft.productCode,
  product_name: draft.productName,
  sale_price: draft.salePrice,
  spec: draft.spec,
  stock: draft.stock,
  confidence: draft.confidence,
  source_image_url: draft.sourceImageUrl,
  ...(draft.fieldConfidence ? { field_confidence: draft.fieldConfidence } : {}),
  ...(draft.fieldSources ? { field_sources: draft.fieldSources } : {}),
  ...(draft.correctionState ? { correction_state: draft.correctionState } : {}),
  status: draft.status,
})

const toDraft = (document) => ({
  id: document._id,
  batchId: document.batch_id,
  productCode: document.product_code,
  productName: document.product_name,
  salePrice: document.sale_price,
  spec: document.spec,
  stock: document.stock,
  confidence: document.confidence,
  sourceImageUrl: document.source_image_url,
  ...(document.field_confidence ? { fieldConfidence: document.field_confidence } : {}),
  ...(document.field_sources ? { fieldSources: document.field_sources } : {}),
  ...(document.correction_state ? { correctionState: document.correction_state } : {}),
  status: document.status,
})

const markDraftCompletion = (drafts) => drafts.map((draft) => {
  if (draft.status === 'deleted') return draft
  const needsCompletion = !draft.productCode.trim()
    || !draft.productName.trim()
    || draft.salePrice <= 0
    || !draft.spec.trim()
  return { ...draft, status: needsCompletion ? 'needs_completion' : 'pending' }
})

const createOcrProviderError = (code, message) => ({
  ok: false,
  error: { code, message, recoverable: true },
})

const createHttpOcrProviderFromEnv = (env = process.env, fetcher = fetch, options = {}) => {
  if (env.OCR_PROVIDER === 'tencentcloud-general-basic') {
    return createTencentCloudOcrProviderFromEnv(env, { resolveImageUrl: options.resolveImageUrl })
  }

  return {
  async recognizeBatch(input, context) {
    const provider = env.OCR_PROVIDER || ''
    const endpoint = env.OCR_PROVIDER_ENDPOINT || ''
    const apiKey = env.OCR_PROVIDER_API_KEY || ''
    if (!provider || !endpoint || !apiKey) {
      return createOcrProviderError('configuration_error', 'OCR provider production configuration is incomplete')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Number(env.OCR_PROVIDER_TIMEOUT_MS || 10000))
    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-OCR-Provider': provider,
        },
        body: JSON.stringify({
          batchId: input.batchId,
          jobId: input.context.jobId,
          images: input.images,
        }),
        signal: controller.signal,
      })
      if (response.status === 429) return createOcrProviderError('rate_limited', 'OCR provider rate limited the request')
      if (!response.ok) return createOcrProviderError('service_error', 'OCR provider returned a service error')
      const data = await response.json()
      if (!data || !Array.isArray(data.drafts) || data.drafts.some((draft) => !draft || typeof draft !== 'object' || Array.isArray(draft))) {
        return createOcrProviderError('invalid_response', 'OCR provider response format is invalid')
      }
      return {
        ok: true,
        drafts: markDraftCompletion(data.drafts.map((draft) =>
          normalizeProviderDraft(input.batchId, draft, input.images[0]?.url || '', context.createId))),
      }
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return createOcrProviderError('timeout', 'OCR provider request timed out')
      }
      return createOcrProviderError('service_error', 'OCR provider request failed')
    } finally {
      clearTimeout(timeout)
    }
  },
  }
}

const toProductDocument = (product) => ({
  _id: product.id,
  product_code: product.productCode,
  product_name: product.productName,
  description: product.description || '',
  main_image_url: product.mainImageUrl,
  image_urls: product.imageUrls,
  status: product.status,
  created_from_batch_id: product.createdFromBatchId,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
})

const toProduct = (document) => ({
  id: document._id,
  productCode: document.product_code,
  productName: document.product_name,
  description: document.description || '',
  mainImageUrl: document.main_image_url,
  imageUrls: document.image_urls,
  status: document.status,
  createdFromBatchId: document.created_from_batch_id,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toSkuDocument = (sku) => ({
  _id: sku.id,
  product_id: sku.productId,
  product_code: sku.productCode,
  spec: sku.spec,
  sale_price: sku.salePrice,
  stock: sku.stock,
})

const toSku = (document) => ({
  id: document._id,
  productId: document.product_id,
  productCode: document.product_code,
  spec: document.spec,
  salePrice: document.sale_price,
  stock: document.stock,
})

const toOrderDocument = (order) => ({
  _id: order.id,
  customer_name: order.customerName,
  customer_phone: order.customerPhone,
  ...(order.customerId ? { customer_id: order.customerId } : {}),
  ...(order.customerAuthSource ? { customer_auth_source: order.customerAuthSource } : {}),
  ...(order.idempotencyKey ? { idempotency_key: order.idempotencyKey } : {}),
  status: order.status,
  total_amount: order.totalAmount,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
})

const toOrderItemDocument = (orderId, item) => ({
  _id: `${orderId}:${item.skuId}`,
  order_id: orderId,
  sku_id: item.skuId,
  product_id: item.productId,
  product_name: item.productName,
  product_code: item.productCode,
  spec: item.spec,
  sale_price: item.salePrice,
  quantity: item.quantity,
})

const toOrderItem = (document) => ({
  skuId: document.sku_id,
  productId: document.product_id,
  productName: document.product_name,
  productCode: document.product_code,
  spec: document.spec,
  salePrice: document.sale_price,
  quantity: document.quantity,
})

const toOrder = (document, items) => ({
  id: document._id,
  customerName: document.customer_name,
  customerPhone: document.customer_phone,
  ...(document.customer_id ? { customerId: document.customer_id } : {}),
  ...(document.customer_auth_source ? { customerAuthSource: document.customer_auth_source } : {}),
  ...(document.idempotency_key ? { idempotencyKey: document.idempotency_key } : {}),
  status: document.status,
  items,
  totalAmount: document.total_amount,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toInventoryLedgerDocument = (entry) => ({
  _id: entry.id,
  sku_id: entry.skuId,
  ...(entry.orderId ? { order_id: entry.orderId } : {}),
  action: entry.action,
  quantity_delta: entry.quantityDelta,
  source_type: entry.sourceType,
  source_id: entry.sourceId,
  note: entry.note,
  created_at: entry.createdAt,
})

const toInventoryLedgerEntry = (document) => ({
  id: document._id,
  skuId: document.sku_id,
  ...(document.order_id ? { orderId: document.order_id } : {}),
  action: document.action,
  quantityDelta: document.quantity_delta,
  sourceType: document.source_type,
  sourceId: document.source_id,
  note: document.note,
  createdAt: document.created_at,
})

const toCustomerDocument = (customer) => ({
  _id: customer.id,
  openid: customer.openid,
  ...(customer.appid ? { appid: customer.appid } : {}),
  ...(customer.unionid ? { unionid: customer.unionid } : {}),
  ...(customer.phoneNumber ? { phone_number: customer.phoneNumber } : {}),
  auth_source: customer.authSource,
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
})

const toCustomer = (document) => ({
  id: document._id,
  openid: document.openid,
  ...(document.appid ? { appid: document.appid } : {}),
  ...(document.unionid ? { unionid: document.unionid } : {}),
  ...(document.phone_number ? { phoneNumber: document.phone_number } : {}),
  authSource: document.auth_source,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toRoleAssignmentDocument = (assignment) => ({
  _id: assignment.id,
  openid: assignment.openid,
  role: assignment.role,
  status: assignment.status,
  ...(assignment.createdBy ? { created_by: assignment.createdBy } : {}),
  ...(assignment.updatedBy ? { updated_by: assignment.updatedBy } : {}),
  ...(assignment.reason ? { reason: assignment.reason } : {}),
  created_at: assignment.createdAt,
  updated_at: assignment.updatedAt,
})

const toRoleAssignment = (document) => ({
  id: document._id,
  openid: document.openid,
  role: document.role,
  status: document.status,
  ...(document.created_by ? { createdBy: document.created_by } : {}),
  ...(document.updated_by ? { updatedBy: document.updated_by } : {}),
  ...(document.reason ? { reason: document.reason } : {}),
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toAuditLogDocument = (auditLog) => ({
  _id: auditLog.id,
  action: auditLog.action,
  operator_openid: auditLog.operatorOpenid,
  target_openid: auditLog.targetOpenid,
  target_role: auditLog.targetRole,
  reason: auditLog.reason,
  created_at: auditLog.createdAt,
})

const toPublishedProductSummary = (product, skus) => {
  const prices = skus.filter((sku) => sku.productId === product.id && sku.stock > 0).map((sku) => sku.salePrice)

  return {
    ...product,
    minPrice: prices.length > 0 ? Math.min(...prices) : '-',
  }
}

const validateProductForPublish = (product, skus) => {
  const productSkus = skus.filter((sku) => sku.productId === product.id)
  const saleableSkus = productSkus.filter((sku) => sku.stock > 0)
  const normalizedSpecs = productSkus.map((sku) => sku.spec.trim()).filter(Boolean)
  const messages = []

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

const createRepository = (store) => ({
  saveBatch: async (batch) => toBatch(await store.insert('ocr_batches', toBatchDocument(batch))),
  updateBatch: async (batch) => toBatch(await store.replace('ocr_batches', toBatchDocument(batch))),
  listBatches: async () => (await store.list('ocr_batches')).map(toBatch).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  saveOcrJob: async (job) => toOcrJob(await store.insert('ocr_jobs', toOcrJobDocument(job))),
  updateOcrJob: async (job) => toOcrJob(await store.replace('ocr_jobs', toOcrJobDocument(job))),
  listOcrJobs: async (batchId) => {
    const documents = batchId ? await store.list('ocr_jobs', { batch_id: batchId }) : await store.list('ocr_jobs')
    return documents.map(toOcrJob).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
  saveDrafts: async (drafts) => {
    const saved = []
    for (const draft of drafts) saved.push(toDraft(await store.insert('product_drafts', toDraftDocument(draft))))
    return saved
  },
  replaceDrafts: async (batchId, drafts) => {
    await store.deleteByField('product_drafts', 'batch_id', batchId)
    const saved = []
    for (const draft of drafts) saved.push(toDraft(await store.insert('product_drafts', toDraftDocument(draft))))
    return saved
  },
  listDrafts: async (batchId) => {
    const documents = batchId ? await store.list('product_drafts', { batch_id: batchId }) : await store.list('product_drafts')
    return documents.map(toDraft).sort((a, b) => a.id.localeCompare(b.id))
  },
  saveProducts: async (products, skus) =>
    store.transaction(async () => {
      const savedProducts = []
      const savedSkus = []
      for (const sku of skus) {
        if (sku.stock < 0) throw validationError('SKU stock must not be negative')
      }
      for (const product of products) savedProducts.push(toProduct(await store.insert('products', toProductDocument(product))))
      for (const sku of skus) savedSkus.push(toSku(await store.insert('skus', toSkuDocument(sku))))
      return { products: savedProducts, skus: savedSkus }
    }),
  updateProduct: async (product) => toProduct(await store.replace('products', toProductDocument(product))),
  listProducts: async () => (await store.list('products')).map(toProduct).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  listSkus: async (productId) => {
    const documents = productId ? await store.list('skus', { product_id: productId }) : await store.list('skus')
    return documents.map(toSku).sort((a, b) => a.id.localeCompare(b.id))
  },
  updateSku: async (sku) => {
    if (sku.stock < 0) throw validationError('SKU stock must not be negative')
    return toSku(await store.replace('skus', toSkuDocument(sku)))
  },
  saveOrder: async (order) => {
    await store.insert('orders', toOrderDocument(order))
    for (const item of order.items) await store.insert('order_items', toOrderItemDocument(order.id, item))
    return order
  },
  updateOrder: async (order) => {
    await store.replace('orders', toOrderDocument(order))
    await store.deleteByField('order_items', 'order_id', order.id)
    for (const item of order.items) await store.insert('order_items', toOrderItemDocument(order.id, item))
    return order
  },
  listOrders: async () => {
    const items = (await store.list('order_items')).map((document) => ({
      orderId: document.order_id,
      item: toOrderItem(document),
    }))
    return (await store.list('orders'))
      .map((order) => toOrder(order, items.filter((item) => item.orderId === order._id).map((item) => item.item)))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
  saveInventoryLedgerEntry: async (entry) => toInventoryLedgerEntry(await store.insert('inventory_ledger', toInventoryLedgerDocument(entry))),
  listInventoryLedgerEntries: async (skuId) => {
    const documents = skuId ? await store.list('inventory_ledger', { sku_id: skuId }) : await store.list('inventory_ledger')
    return documents.map(toInventoryLedgerEntry).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
  findCustomerByOpenid: async (openid) => {
    const customer = (await store.list('customers', { openid })).at(0)
    return customer ? toCustomer(customer) : null
  },
  saveCustomer: async (customer) => toCustomer(await store.insert('customers', toCustomerDocument(customer))),
  updateCustomer: async (customer) => toCustomer(await store.replace('customers', toCustomerDocument(customer))),
  saveRoleAssignment: async (assignment) => toRoleAssignment(await store.insert('role_assignments', toRoleAssignmentDocument(assignment))),
  updateRoleAssignment: async (assignment) => toRoleAssignment(await store.replace('role_assignments', toRoleAssignmentDocument(assignment))),
  listRoleAssignmentsByOpenid: async (openid) =>
    (await store.list('role_assignments', { openid })).map(toRoleAssignment),
  saveAuditLog: async (auditLog) => store.insert('operation_audit_logs', toAuditLogDocument(auditLog)),
})

const createProductsFromDrafts = (drafts, context) => {
  const productByCode = new Map()
  const skuByKey = new Map()
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
      const existing = skuByKey.get(skuKey)
      skuByKey.set(skuKey, existing ? { ...existing, stock: existing.stock + draft.stock } : {
        id: context.createId('sku'),
        productId: product.id,
        productCode: draft.productCode,
        spec: draft.spec,
        salePrice: draft.salePrice,
        stock: draft.stock,
      })
    })
  return { products: [...productByCode.values()], skus: [...skuByKey.values()] }
}

const validateDraftForConfirmation = (draft) => {
  const issues = []
  if (!draft.productCode.trim()) issues.push('productCode is required')
  if (!draft.productName.trim()) issues.push('productName is required')
  if (!draft.spec.trim()) issues.push('spec is required')
  if (draft.salePrice <= 0) issues.push('salePrice must be greater than 0')
  if (draft.confidence < 0.8 && draft.correctionState !== 'manual_corrected' && draft.correctionState !== 'accepted') {
    issues.push('low confidence drafts must be manually corrected or explicitly accepted before confirmation')
  }
  return issues
}

const findLatestBatch = async (repository) => (await repository.listBatches()).at(-1)

const findOcrJob = async (repository, jobId) => {
  const job = (await repository.listOcrJobs()).find((item) => item.id === jobId)
  if (!job) throw notFoundError('OCR job not found')
  return job
}

const findDraft = async (repository, draftId) => {
  const drafts = await repository.listDrafts()
  const draft = drafts.find((item) => item.id === draftId)
  if (!draft) throw notFoundError('Draft not found')
  return { draft, batchDrafts: drafts.filter((item) => item.batchId === draft.batchId) }
}

const findProduct = async (repository, productId) => {
  const product = (await repository.listProducts()).find((item) => item.id === productId)
  if (!product) throw notFoundError('Product not found')
  return product
}

const findSku = async (repository, productId, skuId) => {
  const sku = (await repository.listSkus(productId)).find((item) => item.id === skuId)
  if (!sku) throw notFoundError('SKU not found')
  return sku
}

const saveManualInventoryLedgerEntry = async (context, sku, quantityDelta, reason) =>
  context.repository.saveInventoryLedgerEntry({
    id: context.createId('ledger'),
    skuId: sku.id,
    action: 'adjust',
    quantityDelta,
    sourceType: 'manual',
    sourceId: sku.id,
    note: reason,
    createdAt: context.now(),
  })

const findOrder = async (repository, orderId) => {
  const order = (await repository.listOrders()).find((item) => item.id === orderId)
  if (!order) throw notFoundError('Order not found')
  return order
}

const upsertCustomerFromIdentity = async (repository, identity, context) => {
  const existing = await repository.findCustomerByOpenid(identity.openid)
  if (existing) {
    return repository.updateCustomer({
      ...existing,
      appid: identity.appid,
      unionid: identity.unionid,
      authSource: 'wechat',
      updatedAt: context.now(),
    })
  }

  const timestamp = context.now()
  return repository.saveCustomer({
    id: context.createId('customer'),
    openid: identity.openid,
    appid: identity.appid,
    unionid: identity.unionid,
    authSource: 'wechat',
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

const resolveWechatCustomerForOrder = async (event, context) => {
  const identity = requireIdentity(event)
  return upsertCustomerFromIdentity(context.repository, identity, context)
}

const resolveIdentityRoles = async (identity, context) => {
  if (context.allowTestIdentityRoles && identity.roles.length > 0) return identity

  const activeAssignments = await context.repository.listRoleAssignmentsByOpenid(identity.openid)
  const roles = activeAssignments
    .filter((assignment) => assignment.status === 'active')
    .map((assignment) => assignment.role)
  return {
    ...identity,
    roles: roles.length > 0 ? roles : ['customer'],
  }
}

const requireResolvedIdentity = async (event, context) =>
  resolveIdentityRoles(requireIdentity(event), context)

const requireResolvedAnyRole = async (event, context, roles) => {
  const identity = await requireResolvedIdentity(event, context)
  if (!roles.some((role) => hasRole(identity, role))) {
    throw forbiddenError('Permission denied')
  }
  return identity
}

const upsertRoleAssignment = async (repository, input, context) => {
  const existing = (await repository.listRoleAssignmentsByOpenid(input.openid))
    .find((assignment) => assignment.role === input.role)
  const timestamp = context.now()

  if (existing) {
    return repository.updateRoleAssignment({
      ...existing,
      status: 'active',
      updatedBy: input.operatorOpenid,
      reason: input.reason,
      updatedAt: timestamp,
    })
  }

  return repository.saveRoleAssignment({
    id: context.createId(`role-${input.role}`),
    openid: input.openid,
    role: input.role,
    status: 'active',
    createdBy: input.operatorOpenid,
    updatedBy: input.operatorOpenid,
    reason: input.reason,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

const apiHandlers = {
  async getCurrentCustomer(event, context) {
    const identity = await requireResolvedIdentity(event, context)
    return { customer: await upsertCustomerFromIdentity(context.repository, identity, context) }
  },
  async bindCustomerPhone(event, context) {
    const identity = await requireResolvedIdentity(event, context)
    const input = parseBindCustomerPhoneInput(event.payload)
    const phoneNumber = await resolvePhoneNumberFromCode(input.phoneCode, context)
    const customer = await upsertCustomerFromIdentity(context.repository, identity, context)
    return {
      customer: await context.repository.updateCustomer({
        ...customer,
        phoneNumber,
        updatedAt: context.now(),
      }),
    }
  },
  async bindStaff(event, context) {
    const ownerIdentity = await requireResolvedAnyRole(event, context, ['owner'])
    const input = parseBindStaffInput(event.payload)
    if (input.openid === ownerIdentity.openid) throw validationError('owner cannot bind self as staff')
    const roleAssignment = await upsertRoleAssignment(context.repository, {
      openid: input.openid,
      role: 'staff',
      operatorOpenid: ownerIdentity.openid,
      reason: input.reason,
    }, context)
    await context.repository.saveAuditLog({
      id: context.createId('audit'),
      action: 'bind_staff',
      operatorOpenid: ownerIdentity.openid,
      targetOpenid: input.openid,
      targetRole: 'staff',
      reason: input.reason,
      createdAt: context.now(),
    })
    return { roleAssignment }
  },
  async createOcrBatch(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const input = parseCreateOcrBatchInput(event.payload)
    const timestamp = context.now()
    const batch = await context.repository.saveBatch({
      id: context.createId('batch'),
      status: input.drafts.length > 0 ? 'recognized' : 'uploaded',
      imageUrls: input.imageUrls,
      imageAssetIds: input.imageAssetIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    const drafts = await context.repository.saveDrafts(input.drafts.map((draft) => ({
      id: context.createId('draft'),
      batchId: batch.id,
      ...draft,
      status: 'pending',
    })))
    const job = await context.repository.saveOcrJob({
      id: `job-${batch.id}`,
      batchId: batch.id,
      status: 'queued',
      retryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return { batch, job, drafts }
  },
  async listOcrJobs(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    return { jobs: await context.repository.listOcrJobs(readOptionalString(event.params || {}, 'batchId')) }
  },
  async retryOcrJob(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const job = await findOcrJob(context.repository, readString(event.params || {}, 'jobId'))
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
    return { job: updated, drafts: await context.repository.listDrafts(job.batchId) }
  },
  async processOcrJob(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const job = await findOcrJob(context.repository, readString(event.params || {}, 'jobId'))
    if (!['queued', 'retrying'].includes(job.status)) {
      throw conflictError('Only queued or retrying OCR jobs can be processed')
    }
    const batch = (await context.repository.listBatches()).find((item) => item.id === job.batchId)
    if (!batch) throw notFoundError('Batch not found')
    const running = await context.repository.updateOcrJob({
      ...job,
      status: 'running',
      failureReason: undefined,
      updatedAt: context.now(),
    })
    const result = await context.ocrProvider.recognizeBatch({
      batchId: batch.id,
      images: batch.imageUrls.map((url, index) => ({
        id: `image-${index + 1}`,
        url,
        name: `image-${index + 1}`,
        assetId: Array.isArray(batch.imageAssetIds) ? batch.imageAssetIds[index] : undefined,
      })),
      context: {
        jobId: running.id,
        requestedAt: running.updatedAt,
      },
    }, context)
    if (!result.ok) {
      const failed = await context.repository.updateOcrJob({
        ...running,
        status: 'failed',
        failureReason: `${result.error.code}: ${result.error.message}`,
        updatedAt: context.now(),
      })
      return { job: failed, drafts: await context.repository.listDrafts(batch.id) }
    }

    const existingDrafts = await context.repository.listDrafts(batch.id)
    const drafts = existingDrafts.length > 0 ? existingDrafts : await context.repository.saveDrafts(result.drafts)
    const succeeded = await context.repository.updateOcrJob({
      ...running,
      status: 'succeeded',
      failureReason: undefined,
      updatedAt: context.now(),
    })
    await context.repository.updateBatch({ ...batch, status: 'recognized', updatedAt: context.now() })
    return { job: succeeded, drafts }
  },
  async listOcrBatches(_event, context) {
    return { batches: await context.repository.listBatches() }
  },
  async getCurrentOcrBatch(_event, context) {
    return { batch: (await findLatestBatch(context.repository)) || null }
  },
  async getLatestDrafts(_event, context) {
    const batch = await findLatestBatch(context.repository)
    return { batch: batch || null, drafts: batch ? await context.repository.listDrafts(batch.id) : [] }
  },
  async updateDraft(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const patch = parseDraftPatchInput(event.payload)
    const { draft, batchDrafts } = await findDraft(context.repository, readString(event.params || {}, 'draftId'))
    const updatedDraft = { ...draft, ...patch }
    await context.repository.replaceDrafts(draft.batchId, batchDrafts.map((item) => (item.id === draft.id ? updatedDraft : item)))
    return { draft: updatedDraft }
  },
  async deleteDraft(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const { draft, batchDrafts } = await findDraft(context.repository, readString(event.params || {}, 'draftId'))
    const deletedDraft = { ...draft, status: 'deleted' }
    await context.repository.replaceDrafts(draft.batchId, batchDrafts.map((item) => (item.id === draft.id ? deletedDraft : item)))
    return { draft: deletedDraft }
  },
  async confirmBatch(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const batchId = readString(event.params || {}, 'batchId')
    const batch = (await context.repository.listBatches()).find((item) => item.id === batchId)
    if (!batch) throw notFoundError('Batch not found')
    if (batch.status === 'confirmed') return { issues: [], products: [], skus: [] }

    const currentDrafts = await context.repository.listDrafts(batch.id)
    const issues = currentDrafts
      .filter((draft) => draft.status !== 'deleted')
      .flatMap((draft) => validateDraftForConfirmation(draft).map((message) => ({ draftId: draft.id, message })))
    const confirmedDrafts = currentDrafts.map((draft) => {
      if (draft.status === 'deleted') return draft
      return { ...draft, status: issues.some((issue) => issue.draftId === draft.id) ? 'needs_completion' : 'confirmed' }
    })
    await context.repository.replaceDrafts(batch.id, confirmedDrafts)
    if (issues.length > 0) return { issues, products: [], skus: [] }

    const existingProducts = (await context.repository.listProducts()).filter((product) => product.createdFromBatchId === batch.id)
    if (existingProducts.length > 0) {
      const allSkus = await context.repository.listSkus()
      await context.repository.updateBatch({ ...batch, status: 'confirmed', updatedAt: context.now() })
      return {
        issues: [],
        products: existingProducts,
        skus: allSkus.filter((sku) => existingProducts.some((product) => product.id === sku.productId)),
      }
    }

    const catalog = createProductsFromDrafts(confirmedDrafts, context)
    await context.repository.saveProducts(catalog.products, catalog.skus)
    await context.repository.updateBatch({ ...batch, status: 'confirmed', updatedAt: context.now() })
    return { issues: [], ...catalog }
  },
  async listProducts(_event, context) {
    return { products: await context.repository.listProducts() }
  },
  async listPublishedProducts(_event, context) {
    const products = await context.repository.listProducts()
    const skus = await context.repository.listSkus()
    return {
      products: products.filter((product) => product.status === 'published' && validateProductForPublish(product, skus).length === 0),
    }
  },
  async listPublishedProductSummaries(_event, context) {
    const allProducts = await context.repository.listProducts()
    const skus = await context.repository.listSkus()
    const products = allProducts.filter((product) => product.status === 'published' && validateProductForPublish(product, skus).length === 0)

    return { products: products.map((product) => toPublishedProductSummary(product, skus)) }
  },
  async updateProductDescription(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const input = parseProductDescriptionInput(event.payload)
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    return {
      product: await context.repository.updateProduct({
        ...product,
        description: input.description,
        updatedAt: context.now(),
      }),
    }
  },
  async publishProduct(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    const skus = await context.repository.listSkus(product.id)
    const publishMessages = validateProductForPublish(product, skus)
    if (publishMessages.length > 0) {
      throw conflictError(publishMessages[0])
    }
    return { product: await context.repository.updateProduct({ ...product, status: 'published', updatedAt: context.now() }) }
  },
  async listSkus(event, context) {
    const productId = readString(event.params || {}, 'productId')
    await findProduct(context.repository, productId)
    return { skus: await context.repository.listSkus(productId) }
  },
  async updateSku(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const productId = readString(event.params || {}, 'productId')
    const skuId = readString(event.params || {}, 'skuId')
    const input = parseSkuUpdateInput(event.payload)
    await findProduct(context.repository, productId)
    const sku = await findSku(context.repository, productId, skuId)
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
    return { sku: updated }
  },
  async restockSkus(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const productId = readString(event.params || {}, 'productId')
    const input = parseRestockSkusInput(event.payload)
    await findProduct(context.repository, productId)
    const skus = await context.repository.listSkus(productId)
    const updatedSkus = []
    for (const sku of skus) {
      updatedSkus.push(await context.repository.updateSku({ ...sku, stock: sku.stock + input.quantity }))
      await saveManualInventoryLedgerEntry(context, sku, input.quantity, input.reason)
    }
    return { skus: updatedSkus }
  },
  async clearSkuStock(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const productId = readString(event.params || {}, 'productId')
    const input = parseClearSkuStockInput(event.payload)
    await findProduct(context.repository, productId)
    const skus = await context.repository.listSkus(productId)
    const updatedSkus = []
    for (const sku of skus) {
      updatedSkus.push(await context.repository.updateSku({ ...sku, stock: 0 }))
      if (sku.stock !== 0) {
        await saveManualInventoryLedgerEntry(context, sku, -sku.stock, input.reason)
      }
    }
    return { skus: updatedSkus }
  },
  async listPendingImageTasks(_event, context) {
    await requireAdminOrResolvedAnyRole(_event, context, ['owner', 'staff'], 'productManagement')
    return { products: (await context.repository.listProducts()).filter((product) => product.status === 'pending_images') }
  },
  async supplementProductImages(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner', 'staff'], 'productManagement')
    const input = parseSupplementImagesInput(event.payload)
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    return {
      product: await context.repository.updateProduct({
        ...product,
        mainImageUrl: input.mainImageUrl,
        imageUrls: input.imageUrls,
        status: 'ready_to_publish',
        updatedAt: context.now(),
      }),
    }
  },
  async createCustomerOrder(event, context) {
    const input = parseCustomerOrderInput(event.payload)
    const customer = input.session.authSource === 'wechat'
      ? await resolveWechatCustomerForOrder(event, context)
      : null
    const phoneNumber = customer?.phoneNumber || input.session.phoneNumber
    if (!phoneNumber) throw unauthorizedError('Wechat phone authorization is required before ordering')
    const product = await findProduct(context.repository, input.productId)
    const sku = (await context.repository.listSkus(product.id)).find((item) => item.id === input.skuId)
    if (!sku) throw notFoundError('SKU not found')
    if (product.status !== 'published' || sku.stock < input.quantity) {
      throw conflictError('Product is unpublished or stock is insufficient')
    }
    if (input.idempotencyKey) {
      const existingOrder = (await context.repository.listOrders()).find((order) => order.idempotencyKey === input.idempotencyKey)
      if (existingOrder) {
        return { order: existingOrder }
      }
    }
    const timestamp = context.now()
    const order = {
      id: context.createId('order'),
      customerName: input.session.nickname || 'Wechat Customer',
      customerPhone: phoneNumber,
      customerId: customer?.id || input.session.customerId,
      customerAuthSource: customer ? 'wechat' : (input.session.authSource || 'mock_wechat'),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      status: 'pending_merchant_confirm',
      items: [{
        skuId: sku.id,
        productId: product.id,
        productName: product.productName,
        productCode: product.productCode,
        spec: sku.spec,
        salePrice: sku.salePrice,
        quantity: input.quantity,
      }],
      totalAmount: sku.salePrice * input.quantity,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await context.repository.updateSku({ ...sku, stock: sku.stock - input.quantity })
    await context.repository.saveInventoryLedgerEntry({
      id: context.createId('ledger'),
      skuId: sku.id,
      orderId: order.id,
      action: 'reserve',
      quantityDelta: -input.quantity,
      sourceType: 'order',
      sourceId: order.id,
      note: `reserve stock for order ${order.id}`,
      createdAt: timestamp,
    })
    return { order: await context.repository.saveOrder(order) }
  },
  async getCustomerOrder(event, context) {
    return { order: await findOrder(context.repository, readString(event.params || {}, 'orderId')) }
  },
  async listMerchantOrders(_event, context) {
    await requireResolvedAnyRole(_event, context, ['owner'])
    return { orders: await context.repository.listOrders() }
  },
  async confirmMerchantOrder(event, context) {
    await requireResolvedAnyRole(event, context, ['owner'])
    const order = await findOrder(context.repository, readString(event.params || {}, 'orderId'))
    if (order.status !== 'pending_merchant_confirm') {
      throw conflictError('Only pending merchant-confirmation orders can be confirmed')
    }
    const updatedAt = context.now()
    const confirmed = await context.repository.updateOrder({ ...order, status: 'confirmed', updatedAt })
    await context.repository.saveInventoryLedgerEntry({
      id: context.createId('ledger'),
      skuId: order.items[0].skuId,
      orderId: order.id,
      action: 'confirm',
      quantityDelta: 0,
      sourceType: 'order',
      sourceId: order.id,
      note: `confirm order ${order.id}`,
      createdAt: updatedAt,
    })
    return { order: confirmed }
  },
  async cancelMerchantOrder(event, context) {
    await requireResolvedAnyRole(event, context, ['owner'])
    const order = await findOrder(context.repository, readString(event.params || {}, 'orderId'))
    if (order.status !== 'pending_merchant_confirm') {
      throw conflictError('Only pending merchant-confirmation orders can be canceled')
    }
    const updatedAt = context.now()
    for (const item of order.items) {
      const sku = (await context.repository.listSkus()).find((currentSku) => currentSku.id === item.skuId)
      if (sku) {
        await context.repository.updateSku({ ...sku, stock: sku.stock + item.quantity })
        await context.repository.saveInventoryLedgerEntry({
          id: context.createId('ledger'),
          skuId: sku.id,
          orderId: order.id,
          action: 'release',
          quantityDelta: item.quantity,
          sourceType: 'order',
          sourceId: order.id,
          note: `release stock for order ${order.id}`,
          createdAt: updatedAt,
        })
      }
    }
    return { order: await context.repository.updateOrder({ ...order, status: 'canceled', updatedAt }) }
  },
}

const createMallApiHandler = (store, options = {}) => {
  const context = {
    repository: createRepository(store),
    createId: options.createId || createIdFactory(),
    now: options.now || (() => new Date().toISOString()),
    allowTestIdentityRoles: options.allowTestIdentityRoles === true,
    exchangePhoneCode: options.exchangePhoneCode,
    ocrProvider: options.ocrProvider || createHttpOcrProviderFromEnv(process.env, fetch, { resolveImageUrl: options.resolveImageUrl }),
  }

  return async (event = {}) => {
    try {
      const action = readAction(event)
      if (action === 'health') return createSuccessEnvelope(createHealthData())
      if (action === 'listContracts') return createSuccessEnvelope({ actions: SUPPORTED_ACTIONS })
      if (!SUPPORTED_ACTIONS.includes(action)) {
        return createErrorEnvelope('NOT_FOUND', `Unsupported mallApi action: ${action}`)
      }
      const handler = apiHandlers[action]
      const data = await handler(event, context)
      return createSuccessEnvelope(data)
    } catch (error) {
      return createErrorEnvelope(error.code || 'INTERNAL_ERROR', error.code ? error.message : 'Internal server error')
    }
  }
}

const createMemoryDocumentStore = () => {
  const state = Object.fromEntries(COLLECTIONS.map((name) => [name, []]))
  const clone = (value) => JSON.parse(JSON.stringify(value))
  return {
    async insert(name, document) {
      state[name] = [...state[name], clone(document)]
      return clone(document)
    },
    async replace(name, document) {
      state[name] = state[name].map((item) => (item._id === document._id ? clone(document) : item))
      return clone(document)
    },
    async deleteByField(name, field, value) {
      state[name] = state[name].filter((item) => item[field] !== value)
    },
    async list(name, query) {
      const items = query
        ? state[name].filter((item) => Object.entries(query).every(([field, value]) => item[field] === value))
        : state[name]
      return clone(items)
    },
    async transaction(work) {
      const snapshot = clone(state)
      try {
        return await work()
      } catch (error) {
        Object.keys(snapshot).forEach((key) => {
          state[key] = snapshot[key]
        })
        throw error
      }
    },
  }
}

module.exports = {
  SUPPORTED_ACTIONS,
  createHttpOcrProviderFromEnv,
  createMallApiHandler,
  createMemoryDocumentStore,
  validateProductForPublish,
}
