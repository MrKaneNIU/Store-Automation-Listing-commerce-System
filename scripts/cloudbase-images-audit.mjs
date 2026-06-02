#!/usr/bin/env node

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  invokeMallApi,
  parseArgs,
  parseMallApiInvokeEnvelope,
  readSchemaManifest,
  resolveEnvId,
} from './cloudbase-schema-utils.mjs'

const isCloudFileId = (imageUrl = '') => imageUrl.trim().startsWith('cloud://')
const isSignedCloudBaseTempUrl = (imageUrl = '') => {
  const normalized = imageUrl.trim()
  return normalized.startsWith('https://') && normalized.includes('.tcb.qcloud.la/') && /[?&]sign=/.test(normalized)
}

export const auditProductImageRecords = ({ products, skus = [], uploadedAssets = [] }) => {
  const healthyProductIds = []
  const blockingIssues = []
  const repairCandidates = []
  const unrecoverableRecords = []

  for (const product of products) {
    const mainImageUrl = String(product.mainImageUrl || '').trim()
    const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls.map((url) => String(url || '').trim()) : []

    if (isCloudFileId(mainImageUrl)) {
      healthyProductIds.push(product.id)
      continue
    }

    if (isSignedCloudBaseTempUrl(mainImageUrl)) {
      blockingIssues.push({ productId: product.id, issue: 'signed_temp_url_without_durable_source', field: 'mainImageUrl' })
      continue
    }

    if (imageUrls.some(isSignedCloudBaseTempUrl)) {
      blockingIssues.push({ productId: product.id, issue: 'signed_temp_url_without_durable_source', field: 'imageUrls' })
      continue
    }

    const uploadedAssetImage = uploadedAssets
      .filter((asset) => asset.entityId === product.id)
      .map((asset) => String(asset.assetId || asset.fileId || '').trim())
      .find(isCloudFileId)
    if (uploadedAssetImage) {
      repairCandidates.push({ productId: product.id, source: 'uploaded_asset', suggestedMainImageUrl: uploadedAssetImage })
      continue
    }

    const skuImage = skus
      .filter((sku) => sku.productId === product.id)
      .flatMap((sku) => [sku.mainImageUrl, sku.imageUrl, ...(Array.isArray(sku.imageUrls) ? sku.imageUrls : [])])
      .map((imageUrl) => String(imageUrl || '').trim())
      .find(isCloudFileId)
    if (skuImage) {
      repairCandidates.push({ productId: product.id, source: 'sku_image', suggestedMainImageUrl: skuImage })
      continue
    }

    unrecoverableRecords.push({ productId: product.id, issue: 'no_recoverable_image_source' })
  }

  return { healthyProductIds, blockingIssues, repairCandidates, unrecoverableRecords }
}

const invokeAction = async (envId, event) => {
  const result = await invokeMallApi(envId, event)
  const envelope = parseMallApiInvokeEnvelope(result)
  if (result.code !== 0 || !envelope?.success) {
    throw new Error(`${event.action} failed: ${envelope?.error?.code || result.stderr || result.stdout || 'UNKNOWN'}`)
  }
  return envelope.data
}

const runLocalMallApiAction = async (event) => {
  process.env.MALL_API_LOCAL_MEMORY = '1'
  const require = createRequire(import.meta.url)
  const { main } = require('../cloudfunctions/mallApi/index.js')
  const envelope = await main(event)
  if (!envelope?.success) {
    throw new Error(`${event.action} local audit failed: ${envelope?.error?.code || 'UNKNOWN'}`)
  }
  return envelope.data
}

export const runCloudBaseImagesAudit = async ({ envId, remote = false }) => {
  const summaries = remote
    ? await invokeAction(envId, { action: 'listPublishedProductSummaries' })
    : await runLocalMallApiAction({ action: 'listPublishedProductSummaries' })
  const products = Array.isArray(summaries.products) ? summaries.products : []
  const result = auditProductImageRecords({ products, skus: [], uploadedAssets: [] })

  return {
    ok: result.blockingIssues.length === 0,
    envId,
    source: remote ? 'remote mallApi.listPublishedProductSummaries' : 'local mallApi.listPublishedProductSummaries',
    acceptanceEvidence: remote && products.length > 0,
    contractOnly: !remote,
    productsChecked: products.length,
    ...result,
    notes: [
      'This audit is read-only.',
      remote
        ? 'Remote mode can support acceptance evidence when productsChecked is greater than 0.'
        : 'Local mode proves script execution only; it is not real product-image acceptance evidence.',
      'uploaded_assets and SKU image recovery require staging repair scope before writes.',
    ],
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs()
  const manifest = await readSchemaManifest()
  const envId = resolveEnvId(args, manifest)
  const remote = args.has('remote')

  if (!envId) {
    console.error('Missing CloudBase envId. Pass --envId or set CLOUDBASE_ENV_ID.')
    process.exit(1)
  }

  try {
    const output = await runCloudBaseImagesAudit({ envId, remote })
    console.log(JSON.stringify(output, null, 2))
    if (!output.ok) {
      process.exit(1)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
