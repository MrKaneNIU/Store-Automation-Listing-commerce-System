import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const homepageSettingsPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner homepage settings page contract', () => {
  it('uses user-facing display copy instead of implementation wording', () => {
    const source = homepageSettingsPageSource()

    expect(source).toContain('首页展示')
    expect(source).toContain('调整首页背景、标题和宣传内容')
    expect(source).toContain('自定义首页背景')
    expect(source).toContain('上传图片')
    expect(source).toContain('保存后首页展示层会读取这张图')
    expect(source).not.toContain('DISPLAY ONLY')
    expect(source).not.toContain('OCR')
    expect(source).not.toContain('业务语义')
  })
})
