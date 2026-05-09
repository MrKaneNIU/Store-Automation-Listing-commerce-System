const REQUIRED_COLLECTIONS = 14

exports.main = async () => ({
  success: true,
  data: {
    service: 'cloudbase',
    envId: process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || 'shop-d0gl83cca8b2777b5',
    region: process.env.CLOUDBASE_REGION || 'ap-shanghai',
    billingMode: process.env.CLOUDBASE_BILLING_MODE || 'free-quota',
    requiredCollections: REQUIRED_COLLECTIONS,
  },
  error: null,
  meta: {},
})
