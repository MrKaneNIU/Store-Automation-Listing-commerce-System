import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { main } = require('../cloudfunctions/mallHealth/index.js')

const envelope = await main({})

if (!envelope?.success) {
  throw new Error('mallHealth did not return a success envelope')
}

if (envelope.data?.service !== 'cloudbase') {
  throw new Error('mallHealth service marker is invalid')
}

if (envelope.data?.requiredCollections !== 16) {
  throw new Error(`mallHealth requiredCollections mismatch: ${envelope.data?.requiredCollections}`)
}

if (JSON.stringify(envelope).includes('DATABASE_URL')) {
  throw new Error('mallHealth leaked a database secret marker')
}

console.log(JSON.stringify(envelope))
