import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { main } = require('../cloudfunctions/mallApi/index.js')

const health = await main({ action: 'health' })
if (!health?.success || health.data?.service !== 'mall-api') {
  throw new Error('mallApi health action did not return the expected success envelope')
}

const contracts = await main({ action: 'listContracts' })
if (!contracts?.success || !contracts.data?.actions?.includes('createOcrBatch')) {
  throw new Error('mallApi listContracts did not expose the Phase 2 action list')
}

const validation = await main({})
if (validation?.success !== false || validation.error?.code !== 'VALIDATION_ERROR') {
  throw new Error('mallApi did not reject a missing action with VALIDATION_ERROR')
}

const unsupported = await main({ action: 'doesNotExist' })
if (unsupported?.success !== false || unsupported.error?.code !== 'NOT_FOUND') {
  throw new Error('mallApi did not reject an unknown action with NOT_FOUND')
}

const contracted = await main({ action: 'createOcrBatch', payload: {} })
if (contracted?.success !== false || contracted.error?.code !== 'NOT_IMPLEMENTED') {
  throw new Error('mallApi did not fence contracted-but-unwired actions')
}

console.log(JSON.stringify({ health, contractsCount: contracts.data.actions.length }))
