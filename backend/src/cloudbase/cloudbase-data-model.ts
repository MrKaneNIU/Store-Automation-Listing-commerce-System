export type CloudBaseIndexDefinition = {
  name: string
  fields: string[]
}

export type CloudBaseCollectionDefinition = {
  name: string
  requiredFields: string[]
  indexes: CloudBaseIndexDefinition[]
}

export type CloudBaseDataModelValidation = {
  valid: boolean
  errors: string[]
}

export const phase2CloudBaseCollections: CloudBaseCollectionDefinition[] = [
  {
    name: 'ocr_batches',
    requiredFields: ['_id', 'status', 'image_urls', 'created_at', 'updated_at'],
    indexes: [{ name: 'status_created_at', fields: ['status', 'created_at'] }],
  },
  {
    name: 'product_drafts',
    requiredFields: [
      '_id',
      'batch_id',
      'product_code',
      'product_name',
      'sale_price',
      'spec',
      'stock',
      'confidence',
      'source_image_url',
      'status',
    ],
    indexes: [
      { name: 'batch_id', fields: ['batch_id'] },
      { name: 'batch_status', fields: ['batch_id', 'status'] },
    ],
  },
  {
    name: 'products',
    requiredFields: [
      '_id',
      'product_code',
      'product_name',
      'main_image_url',
      'image_urls',
      'status',
      'created_from_batch_id',
      'created_at',
      'updated_at',
    ],
    indexes: [
      { name: 'product_code', fields: ['product_code'] },
      { name: 'status_updated_at', fields: ['status', 'updated_at'] },
    ],
  },
  {
    name: 'skus',
    requiredFields: ['_id', 'product_id', 'product_code', 'spec', 'sale_price', 'stock'],
    indexes: [
      { name: 'product_id', fields: ['product_id'] },
      { name: 'product_code_spec', fields: ['product_code', 'spec'] },
    ],
  },
  {
    name: 'orders',
    requiredFields: [
      '_id',
      'customer_name',
      'customer_phone',
      'status',
      'total_amount',
      'created_at',
      'updated_at',
    ],
    indexes: [
      { name: 'status_created_at', fields: ['status', 'created_at'] },
      { name: 'customer_id_created_at', fields: ['customer_id', 'created_at'] },
    ],
  },
  {
    name: 'order_items',
    requiredFields: [
      '_id',
      'order_id',
      'sku_id',
      'product_id',
      'product_name',
      'product_code',
      'spec',
      'sale_price',
      'quantity',
    ],
    indexes: [
      { name: 'order_id', fields: ['order_id'] },
      { name: 'sku_id', fields: ['sku_id'] },
    ],
  },
  {
    name: 'customers',
    requiredFields: ['_id', 'created_at', 'updated_at'],
    indexes: [{ name: 'openid', fields: ['openid'] }],
  },
  {
    name: 'merchant_users',
    requiredFields: ['_id', 'role', 'created_at', 'updated_at'],
    indexes: [{ name: 'role', fields: ['role'] }],
  },
  {
    name: 'staff_users',
    requiredFields: ['_id', 'role', 'created_at', 'updated_at'],
    indexes: [{ name: 'role', fields: ['role'] }],
  },
  {
    name: 'role_assignments',
    requiredFields: ['_id', 'user_id', 'role', 'created_at', 'updated_at'],
    indexes: [
      { name: 'user_id', fields: ['user_id'] },
      { name: 'role', fields: ['role'] },
    ],
  },
  {
    name: 'inventory_ledger',
    requiredFields: ['_id', 'sku_id', 'delta', 'reason', 'created_at'],
    indexes: [
      { name: 'sku_id_created_at', fields: ['sku_id', 'created_at'] },
      { name: 'reason_created_at', fields: ['reason', 'created_at'] },
    ],
  },
  {
    name: 'operation_audit_logs',
    requiredFields: ['_id', 'operator_id', 'action', 'target_type', 'target_id', 'created_at'],
    indexes: [
      { name: 'operator_created_at', fields: ['operator_id', 'created_at'] },
      { name: 'target_created_at', fields: ['target_type', 'target_id', 'created_at'] },
    ],
  },
  {
    name: 'uploaded_assets',
    requiredFields: ['_id', 'cloud_file_id', 'asset_type', 'status', 'created_at', 'updated_at'],
    indexes: [
      { name: 'asset_type_created_at', fields: ['asset_type', 'created_at'] },
      { name: 'status_created_at', fields: ['status', 'created_at'] },
    ],
  },
  {
    name: 'ocr_jobs',
    requiredFields: ['_id', 'batch_id', 'status', 'created_at', 'updated_at'],
    indexes: [
      { name: 'batch_id', fields: ['batch_id'] },
      { name: 'status_created_at', fields: ['status', 'created_at'] },
    ],
  },
]

const requiredCollectionIndexes = new Map<string, { name: string; reason: string }[]>([
  ['product_drafts', [{ name: 'batch_id', reason: 'draft lookup by OCR batch' }]],
  ['products', [{ name: 'status_updated_at', reason: 'published product browsing and owner review' }]],
  ['skus', [{ name: 'product_id', reason: 'SKU lookup by product' }]],
  ['orders', [{ name: 'status_created_at', reason: 'merchant order queue lookup' }]],
  ['order_items', [{ name: 'order_id', reason: 'order detail reconstruction' }]],
  ['customers', [{ name: 'openid', reason: 'future WeChat identity lookup' }]],
  ['staff_users', [{ name: 'role', reason: 'staff role queue and authorization lookup' }]],
  ['merchant_users', [{ name: 'role', reason: 'merchant role lookup' }]],
  ['role_assignments', [{ name: 'user_id', reason: 'future role binding lookup' }]],
  ['inventory_ledger', [{ name: 'sku_id_created_at', reason: 'inventory audit trail lookup' }]],
  ['operation_audit_logs', [{ name: 'target_created_at', reason: 'operation trace reconstruction' }]],
  ['uploaded_assets', [{ name: 'status_created_at', reason: 'asset processing queue lookup' }]],
  ['ocr_jobs', [{ name: 'status_created_at', reason: 'OCR job queue lookup' }]],
])

const requiredPhase2CollectionNames = [
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

export const validateCloudBaseDataModel = (
  collections: CloudBaseCollectionDefinition[],
): CloudBaseDataModelValidation => {
  const missingCollectionErrors = requiredPhase2CollectionNames
    .filter((collectionName) => !collections.some((item) => item.name === collectionName))
    .map((collectionName) => `${collectionName} collection is required`)

  const indexErrors = [...requiredCollectionIndexes.entries()].flatMap(([collectionName, requiredIndexes]) => {
    const collection = collections.find((item) => item.name === collectionName)
    if (!collection) {
      return []
    }

    return requiredIndexes
      .filter((requiredIndex) => !collection.indexes.some((index) => index.name === requiredIndex.name))
      .map((requiredIndex) => `${collectionName} must define index ${requiredIndex.name} for ${requiredIndex.reason}`)
  })
  const errors = [...missingCollectionErrors, ...indexErrors]

  return {
    valid: errors.length === 0,
    errors,
  }
}
