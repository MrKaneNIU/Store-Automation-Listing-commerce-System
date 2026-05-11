const { createMallApiHandler, createMemoryDocumentStore } = require('./mall-api-core')

let cachedStore

const createCloudBaseDocumentStore = () => {
  const cloudbase = require('@cloudbase/node-sdk')
  const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV,
  })
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

const shouldUseCloudBaseStore = () =>
  process.env.MALL_API_LOCAL_MEMORY !== '1'

const getStore = () => {
  if (!cachedStore) {
    cachedStore = shouldUseCloudBaseStore() ? createCloudBaseDocumentStore() : createMemoryDocumentStore()
  }
  return cachedStore
}

const readRuntimeIdentity = () => {
  try {
    const cloudbase = require('@cloudbase/node-sdk')
    if (typeof cloudbase.getWXContext !== 'function') return null
    const context = cloudbase.getWXContext()
    if (!context || !context.OPENID) return null
    return {
      openid: context.OPENID,
      appid: context.APPID,
      unionid: context.UNIONID,
      roles: ['customer'],
    }
  } catch (_error) {
    return null
  }
}

const shouldAllowTestIdentity = () =>
  process.env.MALL_API_ALLOW_TEST_IDENTITY === '1'

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

exports.main = async (event = {}) => {
  const identity = shouldAllowTestIdentity() ? event.identity || readRuntimeIdentity() : readRuntimeIdentity()
  return createMallApiHandler(getStore(), { exchangePhoneCode })({ ...event, ...(identity ? { identity } : {}) })
}
exports.__private__ = {
  createMallApiHandler,
  createMemoryDocumentStore,
}
