import { createRequire } from 'node:module'

process.env.MALL_API_LOCAL_MEMORY = '1'

const require = createRequire(import.meta.url)
const { main } = require('../cloudfunctions/mallApi/index.js')

const adminSession = {
  account: 'smoke-admin',
  role: 'creator',
  permissions: ['workbenchAccess', 'productManagement'],
}

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

const invalidCreate = await main({ action: 'createOcrBatch', adminSession, payload: {} })
if (invalidCreate?.success !== false || invalidCreate.error?.code !== 'VALIDATION_ERROR') {
  throw new Error('mallApi did not validate malformed createOcrBatch payloads')
}

const created = await main({
  action: 'createOcrBatch',
  adminSession,
  payload: {
    imageUrls: ['cloud://page-1.png'],
    drafts: [
      {
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        salePrice: 129,
        spec: 'Black/M',
        stock: 2,
        confidence: 0.96,
        sourceImageUrl: 'cloud://page-1.png',
      },
    ],
  },
})
if (!created?.success || created.data?.batch?.status !== 'recognized' || created.data?.drafts?.length !== 1) {
  throw new Error('mallApi createOcrBatch did not persist a recognized batch with drafts')
}

const latest = await main({ action: 'getLatestDrafts' })
if (!latest?.success || latest.data?.batch?.id !== created.data.batch.id || latest.data?.drafts?.length !== 1) {
  throw new Error('mallApi getLatestDrafts did not read back persisted CloudBase data')
}

const confirmed = await main({ action: 'confirmBatch', adminSession, params: { batchId: created.data.batch.id } })
if (!confirmed?.success || confirmed.data?.products?.length !== 1 || confirmed.data?.skus?.length !== 1) {
  throw new Error('mallApi confirmBatch did not create product/SKU data')
}

console.log(JSON.stringify({
  health,
  contractsCount: contracts.data.actions.length,
  batchId: created.data.batch.id,
  productId: confirmed.data.products[0].id,
}))
