import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ownerPageSource = (page: string) => readFileSync(resolve(__dirname, page), 'utf8')

describe('owner navigation recovery contract', () => {
  it('resets tab navigation locks when route changes complete or are blocked', () => {
    const pages = [
      'dashboard/index.vue',
      'products/index.vue',
      'orders/index.vue',
      'more/index.vue',
      'no-permission/index.vue',
      'permissions/index.vue',
      'homepage-settings/index.vue',
      'account-management/index.vue',
    ]

    for (const page of pages) {
      const source = ownerPageSource(page)

      expect(source, page).toContain('onComplete')
      expect(source, page).toContain("navigatingRoute.value = ''")
    }
  })

  it('resets shop navigation locks when relaunching to the storefront completes or is blocked', () => {
    const pages = [
      'dashboard/index.vue',
      'import-upload/index.vue',
    ]

    for (const page of pages) {
      const source = ownerPageSource(page)

      expect(source, page).toContain('relaunchTo(routes.customerProductList, {')
      expect(source, page).toContain('onComplete')
      expect(source, page).toMatch(/(?:isShopNavigating|navigatingRoute)\.value = (?:false|''|routes\.customerProductList)/)
    }
  })
})
