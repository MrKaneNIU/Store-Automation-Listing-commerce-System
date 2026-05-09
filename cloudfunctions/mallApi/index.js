const SUPPORTED_ACTIONS = [
  'health',
  'listContracts',
  'createOcrBatch',
  'listOcrBatches',
  'getCurrentOcrBatch',
  'getLatestDrafts',
  'updateDraft',
  'deleteDraft',
  'confirmBatch',
  'listProducts',
  'listPublishedProducts',
  'publishProduct',
  'listSkus',
  'listPendingImageTasks',
  'supplementProductImages',
  'createCustomerOrder',
  'getCustomerOrder',
  'listMerchantOrders',
  'confirmMerchantOrder',
  'cancelMerchantOrder',
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
    throw new Error('Request event must be a JSON object')
  }
  if (typeof event.action !== 'string' || event.action.trim() === '') {
    throw new Error('action is required')
  }
  return event.action
}

const createHealthData = () => ({
  service: 'mall-api',
  envId: process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || 'shop-d0gl83cca8b2777b5',
  route: 'cloudbase-function',
  supportedActions: SUPPORTED_ACTIONS.length,
})

exports.main = async (event = {}) => {
  try {
    const action = readAction(event)

    if (action === 'health') {
      return createSuccessEnvelope(createHealthData())
    }

    if (action === 'listContracts') {
      return createSuccessEnvelope({ actions: SUPPORTED_ACTIONS })
    }

    if (!SUPPORTED_ACTIONS.includes(action)) {
      return createErrorEnvelope('NOT_FOUND', `Unsupported mallApi action: ${action}`)
    }

    return createErrorEnvelope(
      'NOT_IMPLEMENTED',
      `mallApi action is contracted but not wired to CloudBase repository yet: ${action}`,
    )
  } catch (error) {
    return createErrorEnvelope('VALIDATION_ERROR', error.message)
  }
}
