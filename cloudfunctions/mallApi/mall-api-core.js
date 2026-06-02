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
  'getLatestDraftReviewSnapshot',
  'updateDraft',
  'deleteDraft',
  'confirmBatch',
  'listProducts',
  'listOwnerProductCards',
  'listPublishedProducts',
  'listPublishedProductSummaries',
  'getPublishedProductDetail',
  'updateProductBasics',
  'updateProductDescription',
  'updateSku',
  'restockSkus',
  'clearSkuStock',
  'publishProduct',
  'unpublishProduct',
  'deleteProduct',
  'listSkus',
  'listPendingImageTasks',
  'getStaffImageTaskSnapshot',
  'supplementProductImages',
  'createCustomerOrder',
  'getCustomerOrder',
  'getOwnerOrderSnapshot',
  'getOwnerDashboardSnapshot',
  'getCustomerMineSnapshot',
  'getCustomerShoppingBagSnapshot',
  'addCustomerShoppingBagItem',
  'updateCustomerShoppingBagItemQuantity',
  'selectCustomerShoppingBagItem',
  'removeCustomerShoppingBagItem',
  'clearUnavailableCustomerShoppingBagItems',
  'getCustomerFavoriteProductsSnapshot',
  'favoriteCustomerProduct',
  'unfavoriteCustomerProduct',
  'removeCustomerFavoriteProduct',
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
  'shopping_bag_items',
  'customer_favorites',
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

const createHandlerResult = (data, meta = {}) => ({
  __mallApiHandlerResult: true,
  data,
  meta,
})

const isHandlerResult = (value) =>
  isRecord(value) && value.__mallApiHandlerResult === true && isRecord(value.meta)

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

const rawCloudBaseSchemaErrorPattern =
  /DATABASE_COLLECTION_NOT_EXIST|Db or Table not exist|ResourceNotFound|collection.*not exist|table.*not exist|cloud\.tencent\.com\/document/i

const isCloudBaseSchemaMissingError = (error) => {
  if (!error) return false
  return rawCloudBaseSchemaErrorPattern.test([
    error.code,
    error.name,
    error.message,
    error.stack,
  ].filter(Boolean).join('\n'))
}

const normalizeMallApiError = (error) => {
  if (isCloudBaseSchemaMissingError(error)) {
    return {
      code: 'INFRA_SCHEMA_MISSING',
      message: 'Customer data storage is not ready',
    }
  }

  if (error?.code) {
    return {
      code: error.code,
      message: rawCloudBaseSchemaErrorPattern.test(error.message || '')
        ? 'Request failed'
        : error.message,
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  }
}

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

const parseProductBasicsInput = (value) => {
  const descriptionInput = parseProductDescriptionInput(value)
  const productName = typeof value.productName === 'string' ? value.productName.trim() : null
  if (productName === null) throw validationError('productName must be a string')
  if (!productName) throw validationError('productName is required')
  return {
    productName,
    description: descriptionInput.description,
  }
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

const parseShoppingBagItemInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    productId: readString(value, 'productId'),
    skuId: readString(value, 'skuId'),
    quantity: readPositiveInteger(value, 'quantity'),
  }
}

const parseFavoriteProductInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  const allowed = ['productId']
  Object.keys(value).forEach((field) => {
    if (!allowed.includes(field)) throw validationError(`${field} is not a favorite product field`)
  })
  return {
    productId: readString(value, 'productId'),
  }
}

const parseShoppingBagQuantityInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  return {
    quantity: readPositiveInteger(value, 'quantity'),
  }
}

const parseShoppingBagSelectionInput = (value) => {
  if (!isRecord(value)) throw validationError('Request body must be a JSON object')
  if (typeof value.isSelected !== 'boolean') throw validationError('isSelected must be a boolean')
  return {
    isSelected: value.isSelected,
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

const toShoppingBagItemDocument = (item) => ({
  _id: item.id,
  customer_id: item.customerId,
  product_id: item.productId,
  sku_id: item.skuId,
  quantity: item.quantity,
  is_selected: item.isSelected,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
})

const toShoppingBagItem = (document) => ({
  id: document._id,
  customerId: document.customer_id,
  productId: document.product_id,
  skuId: document.sku_id,
  quantity: document.quantity,
  isSelected: document.is_selected !== false,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toCustomerFavoriteDocument = (favorite) => ({
  _id: favorite.id,
  customer_id: favorite.customerId,
  product_id: favorite.productId,
  created_at: favorite.createdAt,
  updated_at: favorite.updatedAt,
})

const toCustomerFavorite = (document) => ({
  id: document._id,
  customerId: document.customer_id,
  productId: document.product_id,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const createCustomerFavoriteId = (customerId, productId) =>
  `favorite-${Buffer.from(`${customerId}:${productId}`).toString('hex')}`

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

const ownerProductStatusLabels = {
  pending_images: '待补图',
  ready_to_publish: '可上架',
  published: '已上架',
}

const toOwnerProductCard = (product, skus) => {
  const productSkus = skus.filter((sku) => sku.productId === product.id)
  const publishBlockReasons = validateProductForPublish(product, skus)
  const canPublish = product.status === 'ready_to_publish' && publishBlockReasons.length === 0

  return {
    ...product,
    statusLabel: ownerProductStatusLabels[product.status],
    skuCount: productSkus.length,
    canPublish,
    publishBlockReasons: canPublish ? [] : publishBlockReasons,
  }
}

const shoppingBagAvailabilityLabels = {
  available: 'Available',
  unpublished: 'Unavailable',
  skuUnavailable: 'SKU unavailable',
  outOfStock: 'Out of stock',
}

const favoriteAvailabilityLabels = {
  available: 'Available',
  unpublished: 'Unavailable',
  deleted: 'Deleted',
}

const getShoppingBagAvailability = (product, sku) => {
  if (!product || product.status !== 'published') return 'unpublished'
  if (!sku || sku.productId !== product.id) return 'skuUnavailable'
  if (sku.stock <= 0) return 'outOfStock'
  return 'available'
}

const getFavoriteAvailability = (product, skus) => {
  if (!product) return 'deleted'
  if (product.status !== 'published' || validateProductForPublish(product, skus).length > 0) return 'unpublished'
  return 'available'
}

const orderStatusLabels = {
  pending_merchant_confirm: 'Pending merchant confirmation',
  confirmed: 'Confirmed',
  canceled: 'Canceled',
}

const maskOpenid = (openid) => {
  if (typeof openid !== 'string' || openid.length <= 8) return openid || ''
  return `${openid.slice(0, 4)}...${openid.slice(-4)}`
}

const maskPhoneNumber = (phoneNumber) => {
  if (typeof phoneNumber !== 'string' || phoneNumber.length < 7) return ''
  return phoneNumber.replace(/^(\d{3})\d+(\d{4})$/, '$1****$2')
}

const createCustomerMineRecentOrderSummary = (order) => ({
  orderId: order.id,
  status: order.status,
  statusLabel: orderStatusLabels[order.status] || order.status,
  totalAmount: order.totalAmount,
  itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  primaryProductName: order.items[0]?.productName || '',
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
})

const settleCustomerMineList = async (readList) => {
  const result = await Promise.allSettled([readList()])
  return result[0].status === 'fulfilled' && Array.isArray(result[0].value) ? result[0].value : []
}

const createCustomerMineSnapshot = async (customer, context) => {
  const [orders, shoppingBagItems, favorites] = await Promise.all([
    settleCustomerMineList(() => context.repository.listOrders()),
    settleCustomerMineList(() => context.repository.listShoppingBagItems(customer.id)),
    settleCustomerMineList(() => context.repository.listCustomerFavorites(customer.id)),
  ])
  const recentOrders = orders
    .filter((order) => order.customerId === customer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    customerId: customer.id,
    identity: {
      isSignedIn: true,
      displayName: customer.phoneNumber ? maskPhoneNumber(customer.phoneNumber) : 'Wechat Customer',
      authSource: customer.authSource,
      openidMasked: maskOpenid(customer.openid),
    },
    phone: {
      isBound: Boolean(customer.phoneNumber),
      maskedPhoneNumber: maskPhoneNumber(customer.phoneNumber),
      statusLabel: customer.phoneNumber ? 'Phone bound' : 'Phone not bound',
    },
    recentOrders: recentOrders.slice(0, 3).map(createCustomerMineRecentOrderSummary),
    recentOrderTotalCount: recentOrders.length,
    utilities: [
      {
        key: 'favorites',
        label: 'Favorites',
        route: '/pages/customer/favorites/index',
        count: favorites.length,
        isEnabled: true,
      },
      {
        key: 'shoppingBag',
        label: 'Shopping bag',
        route: '/pages/customer/shopping-bag/index',
        count: shoppingBagItems.reduce((sum, item) => sum + item.quantity, 0),
        isEnabled: true,
      },
    ],
    serverTime: context.now(),
  }
}

const createShoppingBagSnapshot = async (customerId, context) => {
  const [items, products, skus] = await Promise.all([
    context.repository.listShoppingBagItems(customerId),
    context.repository.listProducts(),
    context.repository.listSkus(),
  ])
  const productById = new Map(products.map((product) => [product.id, product]))
  const skuById = new Map(skus.map((sku) => [sku.id, sku]))
  const snapshotItems = items.map((item) => {
    const product = productById.get(item.productId)
    const sku = skuById.get(item.skuId)
    const availability = getShoppingBagAvailability(product, sku)
    const unitPrice = sku ? sku.salePrice : 0

    return {
      id: item.id,
      productId: item.productId,
      skuId: item.skuId,
      productName: product ? product.productName : 'Unavailable product',
      skuSpec: sku ? sku.spec : 'Unavailable SKU',
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      mainImageUrl: product ? product.mainImageUrl : '',
      availability,
      availabilityLabel: shoppingBagAvailabilityLabels[availability],
      isAvailableForCheckout: availability === 'available',
      isSelected: item.isSelected,
    }
  })

  return {
    customerId,
    items: snapshotItems,
    totalQuantity: snapshotItems.reduce((sum, item) => sum + item.quantity, 0),
    selectedQuantity: snapshotItems
      .filter((item) => item.isSelected)
      .reduce((sum, item) => sum + item.quantity, 0),
    selectedSubtotal: snapshotItems
      .filter((item) => item.isSelected && item.isAvailableForCheckout)
      .reduce((sum, item) => sum + item.lineTotal, 0),
    unavailableCount: snapshotItems.filter((item) => !item.isAvailableForCheckout).length,
    serverTime: context.now(),
  }
}

const createFavoriteProductsSnapshot = async (customerId, context) => {
  const [favorites, products, skus] = await Promise.all([
    context.repository.listCustomerFavorites(customerId),
    context.repository.listProducts(),
    context.repository.listSkus(),
  ])
  const productById = new Map(products.map((product) => [product.id, product]))
  const snapshotItems = favorites.map((favorite) => {
    const product = productById.get(favorite.productId)
    const productSkus = product ? skus.filter((sku) => sku.productId === product.id) : []
    const availability = getFavoriteAvailability(product, productSkus)
    const summary = product ? toPublishedProductSummary(product, productSkus) : null

    return {
      favoriteId: favorite.id,
      productId: favorite.productId,
      productCode: product ? product.productCode : '',
      productName: product ? product.productName : 'Unavailable product',
      mainImageUrl: product ? product.mainImageUrl : '',
      minPrice: summary ? summary.minPrice : '-',
      availability,
      availabilityLabel: favoriteAvailabilityLabels[availability],
      canOpenDetail: availability === 'available',
      favoritedAt: favorite.createdAt,
    }
  })

  return {
    customerId,
    items: snapshotItems,
    totalCount: snapshotItems.length,
    availableCount: snapshotItems.filter((item) => item.availability === 'available').length,
    unavailableCount: snapshotItems.filter((item) => item.availability !== 'available').length,
    serverTime: context.now(),
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
  deleteProduct: async (productId) => {
    const product = (await store.list('products', { _id: productId }))[0]
    await store.deleteByField('products', '_id', productId)
    return product ? toProduct(product) : null
  },
  listProducts: async () => (await store.list('products')).map(toProduct).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  listSkus: async (productId) => {
    const documents = productId ? await store.list('skus', { product_id: productId }) : await store.list('skus')
    return documents.map(toSku).sort((a, b) => a.id.localeCompare(b.id))
  },
  deleteSkus: async (productId) => {
    const skus = (await store.list('skus', { product_id: productId })).map(toSku).sort((a, b) => a.id.localeCompare(b.id))
    await store.deleteByField('skus', 'product_id', productId)
    return skus
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
  listShoppingBagItems: async (customerId) =>
    (await store.list('shopping_bag_items', { customer_id: customerId }))
      .map(toShoppingBagItem)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  saveShoppingBagItem: async (item) => toShoppingBagItem(await store.insert('shopping_bag_items', toShoppingBagItemDocument(item))),
  updateShoppingBagItem: async (item) => toShoppingBagItem(await store.replace('shopping_bag_items', toShoppingBagItemDocument(item))),
  deleteShoppingBagItem: async (itemId) => {
    const item = (await store.list('shopping_bag_items', { _id: itemId }))[0]
    await store.deleteByField('shopping_bag_items', '_id', itemId)
    return item ? toShoppingBagItem(item) : null
  },
  listCustomerFavorites: async (customerId) =>
    (await store.list('customer_favorites', { customer_id: customerId }))
      .map(toCustomerFavorite)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  saveCustomerFavorite: async (favorite) => toCustomerFavorite(await store.upsert('customer_favorites', toCustomerFavoriteDocument(favorite))),
  deleteCustomerFavorite: async (favoriteId) => {
    const favorite = (await store.list('customer_favorites', { _id: favoriteId }))[0]
    await store.deleteByField('customer_favorites', '_id', favoriteId)
    return favorite ? toCustomerFavorite(favorite) : null
  },
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
const isReviewableDraft = (draft) => draft.status !== 'deleted' && draft.status !== 'confirmed'

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

const resolveShoppingBagCustomer = async (event, context) => {
  const identity = await requireResolvedIdentity(event, context)
  return upsertCustomerFromIdentity(context.repository, identity, context)
}

const resolveFavoriteCustomer = async (event, context) => {
  const identity = await requireResolvedIdentity(event, context)
  return upsertCustomerFromIdentity(context.repository, identity, context)
}

const resolveMineCustomer = async (event, context) => {
  const identity = await requireResolvedIdentity(event, context)
  return upsertCustomerFromIdentity(context.repository, identity, context)
}

const findShoppingBagItemForCustomer = async (context, customerId, itemId) => {
  const item = (await context.repository.listShoppingBagItems(customerId)).find((current) => current.id === itemId)
  if (!item) throw notFoundError('Shopping-bag item not found')
  return item
}

const findCustomerFavoriteByProduct = async (context, customerId, productId) =>
  (await context.repository.listCustomerFavorites(customerId)).find((favorite) => favorite.productId === productId) || null

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
  async getCustomerShoppingBagSnapshot(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    return createShoppingBagSnapshot(customer.id, context)
  },
  async getCustomerMineSnapshot(event, context) {
    const customer = await resolveMineCustomer(event, context)
    const snapshot = await createCustomerMineSnapshot(customer, context)
    return createHandlerResult(snapshot, {
      snapshotKey: `customer-mine:${customer.id}:v1`,
    })
  },
  async addCustomerShoppingBagItem(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    const input = parseShoppingBagItemInput(event.payload)
    const product = await findProduct(context.repository, input.productId)
    const sku = await findSku(context.repository, product.id, input.skuId)
    if (product.status !== 'published') throw conflictError('Only published products can be added to the shopping bag')
    const timestamp = context.now()
    const existing = (await context.repository.listShoppingBagItems(customer.id))
      .find((item) => item.productId === product.id && item.skuId === sku.id)
    const item = existing
      ? await context.repository.updateShoppingBagItem({
          ...existing,
          quantity: existing.quantity + input.quantity,
          isSelected: true,
          updatedAt: timestamp,
        })
      : await context.repository.saveShoppingBagItem({
          id: context.createId('bag-item'),
          customerId: customer.id,
          productId: product.id,
          skuId: sku.id,
          quantity: input.quantity,
          isSelected: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        })

    return {
      item,
      snapshot: await createShoppingBagSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-shopping-bag:${customer.id}:v1`],
    }
  },
  async updateCustomerShoppingBagItemQuantity(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    const item = await findShoppingBagItemForCustomer(context, customer.id, readString(event.params || {}, 'itemId'))
    const input = parseShoppingBagQuantityInput(event.payload)
    const updated = await context.repository.updateShoppingBagItem({
      ...item,
      quantity: input.quantity,
      updatedAt: context.now(),
    })

    return {
      item: updated,
      snapshot: await createShoppingBagSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-shopping-bag:${customer.id}:v1`],
    }
  },
  async selectCustomerShoppingBagItem(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    const item = await findShoppingBagItemForCustomer(context, customer.id, readString(event.params || {}, 'itemId'))
    const input = parseShoppingBagSelectionInput(event.payload)
    const updated = await context.repository.updateShoppingBagItem({
      ...item,
      isSelected: input.isSelected,
      updatedAt: context.now(),
    })

    return {
      item: updated,
      snapshot: await createShoppingBagSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-shopping-bag:${customer.id}:v1`],
    }
  },
  async removeCustomerShoppingBagItem(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    const item = await findShoppingBagItemForCustomer(context, customer.id, readString(event.params || {}, 'itemId'))
    const removed = await context.repository.deleteShoppingBagItem(item.id)

    return {
      item: removed,
      snapshot: await createShoppingBagSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-shopping-bag:${customer.id}:v1`],
    }
  },
  async clearUnavailableCustomerShoppingBagItems(event, context) {
    const customer = await resolveShoppingBagCustomer(event, context)
    const snapshot = await createShoppingBagSnapshot(customer.id, context)
    const unavailableItems = snapshot.items.filter((item) => !item.isAvailableForCheckout)
    for (const item of unavailableItems) {
      await context.repository.deleteShoppingBagItem(item.id)
    }

    return {
      removedItemIds: unavailableItems.map((item) => item.id),
      snapshot: await createShoppingBagSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-shopping-bag:${customer.id}:v1`],
    }
  },
  async getCustomerFavoriteProductsSnapshot(event, context) {
    const customer = await resolveFavoriteCustomer(event, context)
    return createFavoriteProductsSnapshot(customer.id, context)
  },
  async favoriteCustomerProduct(event, context) {
    const customer = await resolveFavoriteCustomer(event, context)
    const input = parseFavoriteProductInput(event.payload)
    const product = await findProduct(context.repository, input.productId)
    const skus = await context.repository.listSkus(product.id)
    if (getFavoriteAvailability(product, skus) !== 'available') {
      throw conflictError('Only published products can be favorited')
    }

    const timestamp = context.now()
    const existing = await findCustomerFavoriteByProduct(context, customer.id, product.id)
    const favorite = existing || await context.repository.saveCustomerFavorite({
      id: createCustomerFavoriteId(customer.id, product.id),
      customerId: customer.id,
      productId: product.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    return {
      favorite,
      snapshot: await createFavoriteProductsSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [
        `customer-favorites:${customer.id}:v1`,
        `customer-product-detail:${product.id}:v1`,
      ],
    }
  },
  async unfavoriteCustomerProduct(event, context) {
    const customer = await resolveFavoriteCustomer(event, context)
    const input = parseFavoriteProductInput(event.payload)
    const favorite = await findCustomerFavoriteByProduct(context, customer.id, input.productId)
    const removedFavorite = favorite ? await context.repository.deleteCustomerFavorite(favorite.id) : null

    return {
      removedFavorite,
      snapshot: await createFavoriteProductsSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [
        `customer-favorites:${customer.id}:v1`,
        `customer-product-detail:${input.productId}:v1`,
      ],
    }
  },
  async removeCustomerFavoriteProduct(event, context) {
    const customer = await resolveFavoriteCustomer(event, context)
    const input = parseFavoriteProductInput(event.payload)
    const favorite = await findCustomerFavoriteByProduct(context, customer.id, input.productId)
    const removedFavorite = favorite ? await context.repository.deleteCustomerFavorite(favorite.id) : null

    return {
      removedFavorite,
      snapshot: await createFavoriteProductsSnapshot(customer.id, context),
      invalidatedSnapshotKeys: [`customer-favorites:${customer.id}:v1`],
    }
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
  async getLatestDraftReviewSnapshot(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const batch = await findLatestBatch(context.repository)
    const drafts = batch ? await context.repository.listDrafts(batch.id) : []
    return {
      batch: batch || null,
      drafts: drafts.filter(isReviewableDraft),
      serverTime: context.now(),
    }
  },
  async getOwnerDashboardSnapshot(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'workbenchAccess')
    const batches = await context.repository.listBatches()
    const batch = batches[batches.length - 1] || null
    const drafts = batch ? await context.repository.listDrafts(batch.id) : []
    const products = await context.repository.listProducts()
    const orders = await context.repository.listOrders()

    return {
      pendingDraftCount: drafts.filter((draft) => draft.status === 'pending' || draft.status === 'needs_completion').length,
      pendingImageTaskCount: products.filter((product) => product.status === 'pending_images').length,
      pendingOrderCount: orders.filter((order) => order.status === 'pending_merchant_confirm').length,
      serverTime: context.now(),
    }
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
  async listOwnerProductCards(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const products = await context.repository.listProducts()
    const skus = await context.repository.listSkus()
    const cards = products.map((product) => toOwnerProductCard(product, skus))

    return {
      products: cards,
      readyProductCount: cards.filter((product) => product.canPublish).length,
      serverTime: context.now(),
    }
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
  async getPublishedProductDetail(event, context) {
    const productId = readString(event.params || {}, 'productId')
    const products = await context.repository.listProducts()
    const product = products.find((item) => item.id === productId) || null
    const skus = await context.repository.listSkus(productId)

    if (!product || product.status !== 'published' || validateProductForPublish(product, skus).length > 0) {
      return {
        product: null,
        skus: [],
        serverTime: context.now(),
      }
    }

    return {
      product,
      skus,
      serverTime: context.now(),
    }
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
  async updateProductBasics(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const input = parseProductBasicsInput(event.payload)
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    return {
      product: await context.repository.updateProduct({
        ...product,
        productName: input.productName,
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
  async unpublishProduct(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    if (product.status !== 'published') {
      throw conflictError('Product is not published')
    }
    return { product: await context.repository.updateProduct({ ...product, status: 'ready_to_publish', updatedAt: context.now() }) }
  },
  async deleteProduct(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'productManagement')
    const product = await findProduct(context.repository, readString(event.params || {}, 'productId'))
    const deletedSkus = await context.repository.deleteSkus(product.id)
    const deletedProduct = await context.repository.deleteProduct(product.id)
    return { product: deletedProduct || product, deletedSkuCount: deletedSkus.length }
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
  async getStaffImageTaskSnapshot(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner', 'staff'], 'productManagement')
    return {
      batches: await context.repository.listBatches(),
      products: (await context.repository.listProducts()).filter((product) => product.status === 'pending_images'),
      serverTime: context.now(),
    }
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
    if (input.session.authSource !== 'wechat' && !context.allowMockCustomerOrder) {
      throw unauthorizedError('Verified WeChat identity is required before ordering')
    }
    const customer = input.session.authSource === 'wechat'
      ? await resolveWechatCustomerForOrder(event, context)
      : null
    const phoneNumber = customer ? customer.phoneNumber : input.session.phoneNumber
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
  async getOwnerOrderSnapshot(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'orderConfirmation')
    return {
      orders: await context.repository.listOrders(),
      serverTime: context.now(),
    }
  },
  async listMerchantOrders(_event, context) {
    await requireAdminOrResolvedAnyRole(_event, context, ['owner'], 'orderConfirmation')
    return { orders: await context.repository.listOrders() }
  },
  async confirmMerchantOrder(event, context) {
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'orderConfirmation')
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
    await requireAdminOrResolvedAnyRole(event, context, ['owner'], 'orderConfirmation')
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
    allowMockCustomerOrder: options.allowMockCustomerOrder === true,
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
      const result = await handler(event, context)
      if (isHandlerResult(result)) return createSuccessEnvelope(result.data, result.meta)
      return createSuccessEnvelope(result)
    } catch (error) {
      const safeError = normalizeMallApiError(error)
      return createErrorEnvelope(safeError.code, safeError.message)
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
    async upsert(name, document) {
      const exists = state[name].some((item) => item._id === document._id)
      state[name] = exists
        ? state[name].map((item) => (item._id === document._id ? clone(document) : item))
        : [...state[name], clone(document)]
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
