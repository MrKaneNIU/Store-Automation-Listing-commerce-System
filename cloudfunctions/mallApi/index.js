const { createMallApiHandler, createMemoryDocumentStore } = require('./mall-api-core')

let cachedStore
let cachedCloudBaseApp

const getCloudBaseApp = () => {
  const cloudbase = require('@cloudbase/node-sdk')
  if (!cachedCloudBaseApp) {
    cachedCloudBaseApp = cloudbase.init({
      env: cloudbase.SYMBOL_CURRENT_ENV,
    })
  }
  return cachedCloudBaseApp
}

const createCloudBaseDocumentStore = () => {
  const app = getCloudBaseApp()
  const db = app.database()

  const collection = (name) => db.collection(name)
  const resultData = (result) => result.data || []

  return {
    async insert(name, document) {
      await collection(name).add(document)
      return document
    },
    async replace(name, document) {
      const { _id, ...data } = document
      await collection(name).doc(_id).update(data)
      return document
    },
    async upsert(name, document) {
      const { _id, ...data } = document
      await collection(name).doc(_id).set(data)
      return document
    },
    async deleteByField(name, field, value) {
      const existing = resultData(await collection(name).where({ [field]: value }).get())
      for (const document of existing) {
        await collection(name).doc(document._id).remove()
      }
    },
    async list(name, query) {
      const ref = query ? collection(name).where(query) : collection(name)
      return resultData(await ref.get())
    },
    async transaction(work) {
      return work()
    },
  }
}

const resolveImageUrl = async (fileID) => {
  const result = await getCloudBaseApp().getTempFileURL({
    fileList: [{ fileID, maxAge: 3600 }],
  })
  const resolved = result.fileList?.[0]?.tempFileURL || result.fileList?.[0]?.download_url
  if (!resolved) {
    throw new Error('Failed to resolve OCR image URL from CloudBase fileID')
  }
  return resolved
}

const shouldUseCloudBaseStore = () =>
  process.env.MALL_API_LOCAL_MEMORY !== '1'

const getStore = () => {
  if (!cachedStore) {
    cachedStore = shouldUseCloudBaseStore() ? createCloudBaseDocumentStore() : createMemoryDocumentStore()
  }
  return cachedStore
}

const normalizeRuntimeIdentityContext = (context) => {
  if (!context || typeof context !== 'object') return null
  const openid = context.WX_OPENID || context.OPENID || context.openid || context.openId
  if (!openid) return null
  return {
    openid,
    appid: context.WX_APPID || context.APPID || context.appid || context.appId,
    unionid: context.WX_UNIONID || context.UNIONID || context.unionid || context.unionId,
    roles: ['customer'],
  }
}

const readRuntimeIdentityFromCloudbase = (cloudbase) => {
  if (!cloudbase || typeof cloudbase !== 'object') return null

  for (const readerName of ['getCloudbaseContext', 'getWXContext']) {
    const readContext = cloudbase[readerName]
    if (typeof readContext !== 'function') continue
    try {
      const identity = normalizeRuntimeIdentityContext(readContext())
      if (identity) return identity
    } catch (_error) {
      // Try the next runtime context reader before treating the call as anonymous.
    }
  }

  return null
}

const readRuntimeIdentity = () => {
  try {
    const cloudbase = require('@cloudbase/node-sdk')
    return readRuntimeIdentityFromCloudbase(cloudbase)
  } catch (_error) {
    return null
  }
}

const shouldAllowTestIdentity = () =>
  process.env.MALL_API_ALLOW_TEST_IDENTITY === '1'

const resolveTrustedIdentity = (event, runtimeIdentity, allowTestIdentity) => {
  if (runtimeIdentity) return runtimeIdentity
  if (allowTestIdentity) return event.identity || null
  return null
}

let cachedAccessToken = null

const readWechatConfig = () => ({
  appid: process.env.WECHAT_APPID || process.env.WX_APPID || process.env.MP_APPID || 'wxa63c53796488d4d4',
  secret: process.env.WECHAT_APPSECRET || process.env.WX_APPSECRET || process.env.MP_APPSECRET,
})

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Wechat API HTTP ${response.status}`)
  }
  return data
}

const getWechatAccessToken = async () => {
  const now = Date.now()
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.value
  }

  const { appid, secret } = readWechatConfig()
  if (!appid || !secret) {
    throw new Error('WECHAT_APPID and WECHAT_APPSECRET are required for phone code exchange')
  }

  const params = new URLSearchParams({
    grant_type: 'client_credential',
    appid,
    secret,
  })
  const data = await requestJson(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`)
  if (data.errcode) {
    throw new Error(`Wechat access_token failed: ${data.errcode} ${data.errmsg || ''}`.trim())
  }
  if (!data.access_token) {
    throw new Error('Wechat access_token response missing access_token')
  }

  cachedAccessToken = {
    value: data.access_token,
    expiresAt: now + Number(data.expires_in || 7200) * 1000,
  }
  return cachedAccessToken.value
}

const exchangePhoneCode = async (phoneCode) => {
  const accessToken = await getWechatAccessToken()
  const data = await requestJson(
    `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      body: JSON.stringify({ code: phoneCode }),
    },
  )

  if (data.errcode) {
    throw new Error(`Wechat phone code exchange failed: ${data.errcode} ${data.errmsg || ''}`.trim())
  }
  const phoneNumber = data.phone_info?.phoneNumber
  if (!phoneNumber) {
    throw new Error('Wechat phone code exchange response missing phone number')
  }
  return phoneNumber
}

const truncateTemplateValue = (value, length) => String(value || '').slice(0, length)

const createOrderNotificationPayload = ({ templateId, managerOpenid, order }) => ({
  touser: managerOpenid,
  template_id: templateId,
  page: 'pages/owner/orders/index',
  data: {
    thing1: {
      value: truncateTemplateValue(order.items?.[0]?.productName || '新订单', 20),
    },
    amount2: {
      value: `${Number(order.totalAmount || 0).toFixed(2)}元`,
    },
    phrase3: {
      value: '待确认',
    },
    time4: {
      value: truncateTemplateValue(String(order.createdAt || '').replace('T', ' '), 16),
    },
    thing5: {
      value: truncateTemplateValue(order.id, 20),
    },
  },
})

const sendWechatOrderNotification = async (message, dependencies = {}) => {
  const readAccessToken = dependencies.getWechatAccessToken || getWechatAccessToken
  const postJson = dependencies.requestJson || requestJson
  const accessToken = await readAccessToken()
  const data = await postJson(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      body: JSON.stringify(createOrderNotificationPayload(message)),
    },
  )

  if (data.errcode) {
    throw new Error(`Wechat order notification failed: ${data.errcode} ${data.errmsg || ''}`.trim())
  }
  return data
}

const createRuntimeHandlerOptions = () => ({
  exchangePhoneCode,
  resolveImageUrl,
  sendOrderNotification: sendWechatOrderNotification,
})

exports.main = async (event = {}) => {
  const identity = resolveTrustedIdentity(event, readRuntimeIdentity(), shouldAllowTestIdentity())
  const { identity: _clientIdentity, adminSession: _clientAdminSession, ...trustedEvent } = event
  return createMallApiHandler(getStore(), createRuntimeHandlerOptions())({ ...trustedEvent, ...(identity ? { identity } : {}) })
}
exports.__private__ = {
  createMallApiHandler,
  createMemoryDocumentStore,
  createOrderNotificationPayload,
  createRuntimeHandlerOptions,
  readRuntimeIdentityFromCloudbase,
  resolveTrustedIdentity,
  sendWechatOrderNotification,
}
