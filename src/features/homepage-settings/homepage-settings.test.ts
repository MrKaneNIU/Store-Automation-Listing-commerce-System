import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getHomepageSettingsView,
  previewHomepageSettings,
  resetHomepageSettingsForTests,
  saveHomepageSettings,
} from './homepage-settings'

describe('homepage settings', () => {
  const storage = new Map<string, unknown>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn((key: string) => storage.get(key)),
      setStorageSync: vi.fn((key: string, value: unknown) => storage.set(key, value)),
      removeStorageSync: vi.fn((key: string) => storage.delete(key)),
    })
    resetHomepageSettingsForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the default homepage display settings', () => {
    const view = getHomepageSettingsView()

    expect(view).toMatchObject({
      backgroundTone: 'runway',
      customBackgroundImage: '',
      titleLineOne: '柔和廓形',
      titleLineTwo: '今日上新',
    })
    expect(view.promotionalContent).toContain('轻盈裙装')
  })

  it('previews edits without saving them to the homepage display layer', () => {
    const preview = previewHomepageSettings({
      backgroundTone: 'linen',
      customBackgroundImage: 'wxfile://preview-homepage-cover.jpg',
      titleLineOne: '周末新衣',
      titleLineTwo: '轻装抵达',
      promotionalContent: '预览文案只用于后台确认。',
    })

    expect(preview).toMatchObject({
      backgroundTone: 'linen',
      customBackgroundImage: 'wxfile://preview-homepage-cover.jpg',
      titleLineOne: '周末新衣',
      titleLineTwo: '轻装抵达',
      promotionalContent: '预览文案只用于后台确认。',
    })
    expect(getHomepageSettingsView().titleLineOne).toBe('柔和廓形')
  })

  it('saves edits so the homepage display layer can read the latest version', () => {
    const result = saveHomepageSettings({
      backgroundTone: 'noir',
      customBackgroundImage: 'wxfile://saved-homepage-cover.jpg',
      titleLineOne: '黑色胶囊',
      titleLineTwo: '限时陈列',
      promotionalContent: '保存后首页展示层应读取这段宣传内容。',
    })

    expect(result.status).toBe('success')
    expect(getHomepageSettingsView()).toMatchObject({
      backgroundTone: 'noir',
      customBackgroundImage: 'wxfile://saved-homepage-cover.jpg',
      titleLineOne: '黑色胶囊',
      titleLineTwo: '限时陈列',
      promotionalContent: '保存后首页展示层应读取这段宣传内容。',
    })
  })

  it('clears a saved custom background image when the setting is saved without one', () => {
    saveHomepageSettings({
      backgroundTone: 'noir',
      customBackgroundImage: 'wxfile://saved-homepage-cover.jpg',
      titleLineOne: '黑色胶囊',
      titleLineTwo: '限时陈列',
      promotionalContent: '保存后首页展示层应读取这段宣传内容。',
    })

    const result = saveHomepageSettings({
      backgroundTone: 'linen',
      customBackgroundImage: '',
      titleLineOne: '亚麻套装',
      titleLineTwo: '日间陈列',
      promotionalContent: '移除图片后首页回到所选背景。',
    })

    expect(result.status).toBe('success')
    expect(getHomepageSettingsView()).toMatchObject({
      backgroundTone: 'linen',
      customBackgroundImage: '',
    })
  })

  it('hydrates the homepage display settings from runtime storage after saving', () => {
    saveHomepageSettings({
      backgroundTone: 'noir',
      customBackgroundImage: 'wxfile://saved-homepage-cover.jpg',
      titleLineOne: '夜间系列',
      titleLineTwo: '真实上新',
      promotionalContent: '保存后重新进入首页也应读取这组展示配置。',
    })

    const persistedSettings = storage.get('vx-homepage-settings')
    resetHomepageSettingsForTests()
    storage.set('vx-homepage-settings', persistedSettings)

    expect(getHomepageSettingsView()).toMatchObject({
      backgroundTone: 'noir',
      customBackgroundImage: 'wxfile://saved-homepage-cover.jpg',
      titleLineOne: '夜间系列',
      titleLineTwo: '真实上新',
      promotionalContent: '保存后重新进入首页也应读取这组展示配置。',
    })
  })

  it('keeps the previous display settings when required text is empty', () => {
    const result = saveHomepageSettings({
      backgroundTone: 'linen',
      titleLineOne: '',
      titleLineTwo: '轻装抵达',
      promotionalContent: '文案',
    })

    expect(result.status).toBe('failed')
    expect(getHomepageSettingsView().backgroundTone).toBe('runway')
  })
})
