const REQUIRED_COLLECTIONS = 16

exports.main = async () => ({
  success: true,
  data: {
    service: 'cloudbase',
    envId: process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || 'cloud1-d7gifjyzl7721b383',
    region: process.env.CLOUDBASE_REGION || 'ap-shanghai',
    billingMode: process.env.CLOUDBASE_BILLING_MODE || 'free-quota',
    requiredCollections: REQUIRED_COLLECTIONS,
  },
  error: null,
  meta: {},
})
