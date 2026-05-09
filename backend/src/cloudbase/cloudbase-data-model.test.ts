import { describe, expect, it } from 'vitest'

import {
  phase2CloudBaseCollections,
  validateCloudBaseDataModel,
} from './cloudbase-data-model'

describe('CloudBase Phase 2 data model', () => {
  it('defines the required Phase 2 collections before Phase 3 storage work starts', () => {
    expect(phase2CloudBaseCollections.map((collection) => collection.name)).toEqual([
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
    ])
  })

  it('requires indexes for the MVP lookup paths', () => {
    const result = validateCloudBaseDataModel(phase2CloudBaseCollections)

    expect(result).toEqual({
      valid: true,
      errors: [],
    })
  })

  it('rejects collection definitions that would make the MVP loop unqueryable', () => {
    const broken = phase2CloudBaseCollections.map((collection) =>
      collection.name === 'skus' ? { ...collection, indexes: [] } : collection,
    )

    expect(validateCloudBaseDataModel(broken)).toEqual({
      valid: false,
      errors: ['skus must define index product_id for SKU lookup by product'],
    })
  })

  it('rejects missing PRD-required collections', () => {
    const broken = phase2CloudBaseCollections.filter((collection) => collection.name !== 'ocr_jobs')

    expect(validateCloudBaseDataModel(broken)).toEqual({
      valid: false,
      errors: ['ocr_jobs collection is required'],
    })
  })
})
