import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const morePageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner more page contract', () => {
  it('shows only the three PRD management entries with user-facing copy', () => {
    const source = morePageSource()

    expect(source).toContain('权限管理')
    expect(source).toContain('首页设置')
    expect(source).toContain('账号管理')
    expect(source).toContain('只放三个管理入口')
    expect(source).not.toContain('真实配置内容')
    expect(source).not.toContain('入口位')
    expect(source).not.toContain('商品管理</text>')
    expect(source).not.toContain('订单确认</text>')
  })

  it('opens management entries with stack navigation so child pages can go back', () => {
    const source = morePageSource()

    expect(source).toContain("import { navigateTo, redirectTo } from '../../../app/navigation'")
    expect(source).toContain('ownerTabRoutes.includes')
    expect(source).toContain('? redirectTo : navigateTo')
  })
})
