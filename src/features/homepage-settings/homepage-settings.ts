import { nowIso } from '../../domain/shared/ids'

export type HomepageBackgroundTone = 'runway' | 'linen' | 'noir'

export type HomepageSettings = {
  backgroundTone: HomepageBackgroundTone
  customBackgroundImage: string
  titleLineOne: string
  titleLineTwo: string
  promotionalContent: string
  updatedAt: string
}

export type HomepageSettingsInput = {
  backgroundTone: HomepageBackgroundTone
  customBackgroundImage?: string
  titleLineOne: string
  titleLineTwo: string
  promotionalContent: string
}

export type HomepageSettingsCommandResult = {
  status: 'success' | 'failed'
  message: string
  settings: HomepageSettings
}

type NormalizedHomepageSettingsInput = Omit<HomepageSettingsInput, 'customBackgroundImage'> & {
  customBackgroundImage: string
}

export const homepageBackgroundOptions: Array<{
  label: string
  value: HomepageBackgroundTone
}> = [
  { label: '秀场灰', value: 'runway' },
  { label: '亚麻白', value: 'linen' },
  { label: '夜幕黑', value: 'noir' },
]

const defaultHomepageSettings: HomepageSettings = {
  backgroundTone: 'runway',
  customBackgroundImage: '',
  titleLineOne: '柔和廓形',
  titleLineTwo: '今日上新',
  promotionalContent: '轻盈裙装、通勤套装与限定外套，按小程序 750rpx 视觉比例重构。',
  updatedAt: nowIso(),
}

const homepageSettingsStorageKey = 'vx-homepage-settings'

let homepageSettings: HomepageSettings = { ...defaultHomepageSettings }

const sanitizeText = (value: string, maxLength: number) => value.trim().slice(0, maxLength)

const normalizeSettingsInput = (input: HomepageSettingsInput): NormalizedHomepageSettingsInput => ({
  backgroundTone: input.backgroundTone,
  customBackgroundImage: sanitizeText(input.customBackgroundImage ?? '', 500),
  titleLineOne: sanitizeText(input.titleLineOne, 14),
  titleLineTwo: sanitizeText(input.titleLineTwo, 14),
  promotionalContent: sanitizeText(input.promotionalContent, 72),
})

const copySettings = (settings: HomepageSettings): HomepageSettings => ({ ...settings })

const isHomepageBackgroundTone = (value: unknown): value is HomepageBackgroundTone =>
  value === 'runway' || value === 'linen' || value === 'noir'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeStoredSettings = (value: unknown): HomepageSettings | null => {
  if (!isRecord(value) || !isHomepageBackgroundTone(value.backgroundTone)) {
    return null
  }

  const titleLineOne = typeof value.titleLineOne === 'string' ? sanitizeText(value.titleLineOne, 14) : ''
  const titleLineTwo = typeof value.titleLineTwo === 'string' ? sanitizeText(value.titleLineTwo, 14) : ''
  const promotionalContent = typeof value.promotionalContent === 'string' ? sanitizeText(value.promotionalContent, 72) : ''

  if (!titleLineOne || !titleLineTwo || !promotionalContent) {
    return null
  }

  return {
    backgroundTone: value.backgroundTone,
    customBackgroundImage: typeof value.customBackgroundImage === 'string' ? sanitizeText(value.customBackgroundImage, 500) : '',
    titleLineOne,
    titleLineTwo,
    promotionalContent,
    updatedAt: typeof value.updatedAt === 'string' && value.updatedAt ? value.updatedAt : nowIso(),
  }
}

const readPersistedSettings = (): HomepageSettings | null => {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
      return null
    }

    return normalizeStoredSettings(uni.getStorageSync(homepageSettingsStorageKey))
  } catch {
    return null
  }
}

const persistSettings = (settings: HomepageSettings) => {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') {
      return
    }

    uni.setStorageSync(homepageSettingsStorageKey, settings)
  } catch {
    // Runtime storage is a durability aid; the in-memory view remains usable if storage fails.
  }
}

export const resetHomepageSettingsForTests = () => {
  homepageSettings = {
    ...defaultHomepageSettings,
    updatedAt: nowIso(),
  }

  try {
    if (typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function') {
      uni.removeStorageSync(homepageSettingsStorageKey)
    }
  } catch {
    // Test and non-mini-program runtimes may not provide storage.
  }
}

export const getHomepageSettingsView = (): HomepageSettings => {
  const persistedSettings = readPersistedSettings()

  if (persistedSettings) {
    homepageSettings = persistedSettings
  }

  return copySettings(homepageSettings)
}

export const previewHomepageSettings = (input: HomepageSettingsInput): HomepageSettings => ({
  ...normalizeSettingsInput(input),
  updatedAt: homepageSettings.updatedAt,
})

export const saveHomepageSettings = (input: HomepageSettingsInput): HomepageSettingsCommandResult => {
  const normalized = normalizeSettingsInput(input)

  if (!normalized.titleLineOne || !normalized.titleLineTwo || !normalized.promotionalContent) {
    return {
      status: 'failed',
      message: '标题与宣传内容不能为空',
      settings: getHomepageSettingsView(),
    }
  }

  homepageSettings = {
    ...normalized,
    updatedAt: nowIso(),
  }
  persistSettings(homepageSettings)

  return {
    status: 'success',
    message: '首页设置已保存',
    settings: getHomepageSettingsView(),
  }
}
