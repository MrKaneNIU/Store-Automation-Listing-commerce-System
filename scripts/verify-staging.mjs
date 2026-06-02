#!/usr/bin/env node

import {
  checkRequiredCollections,
  hasRawCloudBaseLeak,
  invokeMallApi,
  parseMallApiInvokeEnvelope,
  parseArgs,
  readSchemaManifest,
  resolveEnvId,
} from './cloudbase-schema-utils.mjs'

const manifest = await readSchemaManifest()
const args = parseArgs()
const envId = resolveEnvId(args, manifest)

if (!envId) {
  console.error('Missing CloudBase envId. Pass --envId or set CLOUDBASE_ENV_ID.')
  process.exit(1)
}

const requiredActions = [
  'getCurrentCustomer',
  'getCustomerShoppingBagSnapshot',
  'getCustomerFavoriteProductsSnapshot',
  'getCustomerMineSnapshot',
]

const invokeAndRecord = async (action) => {
  const result = await invokeMallApi(envId, { action })
  const output = `${result.stdout}\n${result.stderr}`.trim()
  const envelope = parseMallApiInvokeEnvelope(result)
  return {
    action,
    exitCode: result.code,
    transportOk: result.code === 0,
    envelope,
    apiSuccess: envelope?.success === true,
    apiErrorCode: envelope?.error?.code,
    rawErrorLeak: hasRawCloudBaseLeak(output),
    output,
  }
}

const isValidEmptyCustomerPayload = (result) => {
  if (!result.apiSuccess) return false
  const data = result.envelope?.data
  if (result.action === 'getCurrentCustomer') return Boolean(data?.customer?.id)
  if (result.action === 'getCustomerShoppingBagSnapshot') {
    return Array.isArray(data?.items) && data.items.length === 0 && data.totalQuantity === 0
  }
  if (result.action === 'getCustomerFavoriteProductsSnapshot') {
    return Array.isArray(data?.items) && data.items.length === 0 && data.totalCount === 0
  }
  if (result.action === 'getCustomerMineSnapshot') {
    return Array.isArray(data?.recentOrders) && Array.isArray(data?.utilities)
  }
  return false
}

console.log(`[verify:staging] envId=${envId}`)

const schemaResults = await checkRequiredCollections(envId, manifest)
const missingCollections = schemaResults.filter((result) => result.status === 'missing').map((result) => result.name)
const schemaProbeErrors = schemaResults.filter((result) => result.status === 'error').map((result) => result.name)

const health = await invokeAndRecord('health')
const contracts = await invokeAndRecord('listContracts')
const customerActions = []
for (const action of requiredActions) {
  customerActions.push(await invokeAndRecord(action))
}

const output = {
  ok: false,
  envId,
  schema: {
    ok: missingCollections.length === 0 && schemaProbeErrors.length === 0,
    missingCollections,
    probeErrors: schemaProbeErrors,
  },
  mallApi: {
    healthOk: health.transportOk && health.apiSuccess && !health.rawErrorLeak,
    listContractsOk: contracts.transportOk && contracts.apiSuccess && !contracts.rawErrorLeak,
    customerActionResults: customerActions.map((result) => ({
      action: result.action,
      exitCode: result.exitCode,
      transportOk: result.transportOk,
      apiSuccess: result.apiSuccess,
      apiErrorCode: result.apiErrorCode,
      emptyPayloadOk: isValidEmptyCustomerPayload(result),
      rawErrorLeak: result.rawErrorLeak,
    })),
  },
}

const contractOutput = contracts.output
const missingActions = requiredActions.filter((action) => !contractOutput.includes(action))
const rawLeaks = [health, contracts, ...customerActions].filter((result) => result.rawErrorLeak)
const failedInvocations = [health, contracts].filter((result) => !result.transportOk || !result.apiSuccess)
const failedCustomerApi = customerActions.filter((result) => !result.apiSuccess && !/UNAUTHORIZED|AUTH_REQUIRED/i.test(result.apiErrorCode || ''))
const invalidCustomerPayloads = customerActions.filter((result) => result.apiSuccess && !isValidEmptyCustomerPayload(result))

if (missingActions.length > 0) {
  output.mallApi.missingActions = missingActions
}

if (rawLeaks.length > 0) {
  output.mallApi.rawErrorLeakActions = rawLeaks.map((result) => result.action)
}

if (failedInvocations.length > 0) {
  output.mallApi.failedRequiredInvocations = failedInvocations.map((result) => result.action)
}

if (failedCustomerApi.length > 0) {
  output.mallApi.failedCustomerApi = failedCustomerApi.map((result) => ({
    action: result.action,
    code: result.apiErrorCode || 'UNKNOWN',
  }))
}

if (invalidCustomerPayloads.length > 0) {
  output.mallApi.invalidCustomerPayloads = invalidCustomerPayloads.map((result) => result.action)
}

const customerSmokeBlocked = customerActions.some((result) => /UNAUTHORIZED|AUTH_REQUIRED/i.test(result.apiErrorCode || ''))
if (customerSmokeBlocked) {
  output.manualAcceptanceRequired = 'Customer-private smoke needs verified WeChat identity from DevTools or real device.'
}

output.ok =
  output.schema.ok &&
  health.transportOk &&
  health.apiSuccess &&
  contracts.transportOk &&
  contracts.apiSuccess &&
  missingActions.length === 0 &&
  rawLeaks.length === 0 &&
  failedCustomerApi.length === 0 &&
  invalidCustomerPayloads.length === 0 &&
  !customerSmokeBlocked

console.log(JSON.stringify(output, null, 2))

if (!output.ok) {
  process.exit(1)
}
